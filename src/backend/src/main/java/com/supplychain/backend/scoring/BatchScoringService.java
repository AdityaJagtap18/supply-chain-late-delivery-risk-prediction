package com.supplychain.backend.scoring;

import com.supplychain.backend.domain.CustomerLocation;
import com.supplychain.backend.domain.CustomerLocationRepository;
import com.supplychain.backend.domain.Order;
import com.supplychain.backend.domain.OrderRepository;
import com.supplychain.backend.domain.RiskAssessment;
import com.supplychain.backend.domain.RiskAssessmentRepository;
import com.supplychain.backend.domain.Shipment;
import com.supplychain.backend.domain.ShipmentRepository;
import com.supplychain.backend.mlcheck.MlScoreDtos;
import com.supplychain.backend.mlcheck.MlServiceCallResult;
import com.supplychain.backend.mlcheck.MlServiceClient;
import com.supplychain.backend.orders.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * FR-031's real batch-scoring job (ML-INFERENCE-001 S4's recommended batch pattern, not a
 * synchronous per-order API). Replaces the Phase 3 stub seed data with real calls to the ML
 * inference service, persisting one new {@code risk_assessment} row per successfully scored
 * order per ML-INFERENCE-001 S5's error/fallback behavior:
 * <ul>
 *   <li>Whole-batch failure (service unreachable or a non-2xx for the whole call): the run
 *       aborts with no writes at all -- the previous cycle's scores remain the latest ones.</li>
 *   <li>Per-order failure (missing location/shipment data to build features, or the ML service
 *       omitting that order from its response because of an unseen category per
 *       ML-INFERENCE-001 S3): that order is simply not updated this cycle, logged, never
 *       defaulted to a fabricated score.</li>
 * </ul>
 */
@Service
public class BatchScoringService {

    private static final Logger logger = LoggerFactory.getLogger(BatchScoringService.class);

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final CustomerLocationRepository customerLocationRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final MlServiceClient mlServiceClient;
    private final OrderService orderService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public BatchScoringService(OrderRepository orderRepository, ShipmentRepository shipmentRepository,
                                CustomerLocationRepository customerLocationRepository,
                                RiskAssessmentRepository riskAssessmentRepository,
                                MlServiceClient mlServiceClient, OrderService orderService) {
        this.orderRepository = orderRepository;
        this.shipmentRepository = shipmentRepository;
        this.customerLocationRepository = customerLocationRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.mlServiceClient = mlServiceClient;
        this.orderService = orderService;
    }

    public BatchScoringResult runBatch() {
        List<Order> allOrders = orderRepository.findAll();
        Map<Long, Order> scorableOrdersByOrderId = new HashMap<>();
        Map<Long, String> fingerprintByOrderId = new HashMap<>();
        List<MlScoreDtos.OrderRequest> scoreRequests = new ArrayList<>();
        int skippedIncompleteData = 0;
        int skippedUnchanged = 0;

        for (Order order : allOrders) {
            MlScoreDtos.Features features = buildFeatures(order);
            if (features == null) {
                skippedIncompleteData++;
                continue;
            }
            String fingerprint = fingerprintOf(features);
            if (isUnchangedSinceLastScore(order.getOrderId(), fingerprint)) {
                // UI-003 Phase 7: this order's nine ML-INFERENCE-001 features are byte-for-byte
                // identical to the snapshot its latest risk_assessment was scored from -- the
                // model would deterministically return the same score, so this run doesn't pay
                // for (or count against) a re-score. A changed order, or one never scored yet,
                // always goes through.
                skippedUnchanged++;
                continue;
            }
            scorableOrdersByOrderId.put(order.getOrderId(), order);
            fingerprintByOrderId.put(order.getOrderId(), fingerprint);
            scoreRequests.add(new MlScoreDtos.OrderRequest(order.getOrderId().intValue(), features));
        }

        if (scoreRequests.isEmpty()) {
            if (skippedUnchanged > 0) {
                return BatchScoringResult.success(
                        Instant.now(), allOrders.size(), 0, 0, skippedIncompleteData, skippedUnchanged);
            }
            return BatchScoringResult.aborted(
                    "No orders had enough data (shipment + customer location) to build a feature vector.");
        }

        MlServiceCallResult callResult = mlServiceClient.score(new MlScoreDtos.ScoreRequest(scoreRequests));

        if (!callResult.reachable()) {
            logger.error("Batch scoring run aborted -- ML service unreachable: {}", callResult.error());
            return BatchScoringResult.aborted("ML service unreachable: " + callResult.error());
        }
        if (callResult.httpStatus() != 200) {
            logger.error("Batch scoring run aborted -- ML service returned HTTP {}: {}",
                    callResult.httpStatus(), callResult.rawBody());
            return BatchScoringResult.aborted(
                    "ML service returned HTTP " + callResult.httpStatus() + ": " + callResult.rawBody());
        }

        Instant scoredAt = Instant.now();
        int scoredCount = 0;
        for (MlScoreDtos.OrderResult result : callResult.body().results()) {
            Order order = scorableOrdersByOrderId.get(result.orderId().longValue());
            if (order == null) {
                continue;
            }
            BigDecimal riskScore = BigDecimal.valueOf(result.riskScore());
            String riskBand = RiskBandThresholds.bandFor(result.riskScore());
            riskAssessmentRepository.save(new RiskAssessment(order, result.modelVersion(), riskScore,
                    riskBand, scoredAt, fingerprintByOrderId.get(order.getOrderId())));
            scoredCount++;
        }

        int skippedUnseenCategory = scoreRequests.size() - scoredCount;
        if (scoredCount > 0) {
            orderService.evictOrdersListingCache();
        }
        logger.info(
                "Batch scoring run complete: {} orders scored, {} skipped (unseen category), "
                        + "{} skipped (incomplete data), {} skipped (unchanged since last score), scoredAt={}",
                scoredCount, skippedUnseenCategory, skippedIncompleteData, skippedUnchanged, scoredAt);

        return BatchScoringResult.success(scoredAt, allOrders.size(), scoredCount, skippedUnseenCategory,
                skippedIncompleteData, skippedUnchanged);
    }

    /**
     * UI-003 Phase 7: a canonical (fixed key order) JSON serialization of exactly the nine
     * ML-INFERENCE-001 features, persisted in {@code risk_assessment.feature_snapshot} and
     * compared against on the next run -- never a hash, so the stored value stays
     * human-inspectable in the database, per that column's original DB-ARCH-001 intent.
     */
    private String fingerprintOf(MlScoreDtos.Features features) {
        Map<String, Object> ordered = new LinkedHashMap<>();
        ordered.put("type", features.type());
        ordered.put("customerCity", features.customerCity());
        ordered.put("customerId", features.customerId());
        ordered.put("customerZipcode", features.customerZipcode());
        ordered.put("orderCity", features.orderCity());
        ordered.put("orderCountry", features.orderCountry());
        ordered.put("orderRegion", features.orderRegion());
        ordered.put("orderState", features.orderState());
        ordered.put("shippingMode", features.shippingMode());
        try {
            return objectMapper.writeValueAsString(ordered);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize feature fingerprint", e);
        }
    }

    /**
     * Compares parsed JSON trees, not the raw strings -- Postgres's {@code jsonb} column type
     * reorders object keys on storage, so a freshly serialized fingerprint and the one read back
     * from a previous run never match as strings even when every field value is identical.
     * {@link com.fasterxml.jackson.databind.JsonNode#equals} is value-based and key-order
     * independent, which is what "unchanged" actually means here.
     */
    private boolean isUnchangedSinceLastScore(Long orderId, String fingerprint) {
        return riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(orderId)
                .map(RiskAssessment::getFeatureSnapshot)
                .filter(stored -> stored != null)
                .map(stored -> {
                    try {
                        return objectMapper.readTree(stored).equals(objectMapper.readTree(fingerprint));
                    } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                        return false;
                    }
                })
                .orElse(false);
    }

    /**
     * Returns null (never a partially-built feature map) if this order's shipment or customer
     * location row is missing -- those are per-order, pre-call failures distinct from the ML
     * service's own per-order "unseen category" failures.
     */
    private MlScoreDtos.Features buildFeatures(Order order) {
        Shipment shipment = shipmentRepository.findByOrderId(order.getOrderId()).orElse(null);
        if (shipment == null || order.getCustomer() == null) {
            return null;
        }
        CustomerLocation location = customerLocationRepository
                .findById(order.getCustomer().getCustomerId()).orElse(null);
        if (location == null) {
            return null;
        }
        return new MlScoreDtos.Features(
                order.getPaymentType(),
                location.getCustomerCity(),
                order.getCustomer().getCustomerId(),
                location.getCustomerZipcode(),
                order.getOrderCity(),
                order.getOrderCountry(),
                order.getOrderRegion(),
                order.getOrderState(),
                shipment.getShippingMode());
    }
}
