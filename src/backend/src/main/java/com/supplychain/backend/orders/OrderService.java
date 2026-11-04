package com.supplychain.backend.orders;

import com.supplychain.backend.domain.Order;
import com.supplychain.backend.domain.OrderRepository;
import com.supplychain.backend.domain.RiskAssessment;
import com.supplychain.backend.domain.RiskAssessmentRepository;
import com.supplychain.backend.domain.Shipment;
import com.supplychain.backend.domain.ShipmentRepository;
import com.supplychain.backend.orders.OrderDtos.CurrentRisk;
import com.supplychain.backend.orders.OrderDtos.CustomerSummary;
import com.supplychain.backend.orders.OrderDtos.Destination;
import com.supplychain.backend.orders.OrderDtos.OrderDetailResponse;
import com.supplychain.backend.orders.OrderDtos.OrderQueueItem;
import com.supplychain.backend.orders.OrderDtos.OrdersResponse;
import com.supplychain.backend.orders.OrderDtos.RiskAssessmentHistoryItem;
import com.supplychain.backend.orders.OrderDtos.RiskAssessmentHistoryResponse;
import com.supplychain.backend.scoring.CacheConfig;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

/**
 * Implements BE-ARCH-001 S2.3/2.4/2.5 (FR-032/FR-033) against real repository reads -- no
 * stubbed HTTP layer. The risk scores themselves are seeded stub data (see
 * scripts/db/002_seed_phase3.sql and RiskAssessment's class comment), per
 * IMPLEMENTATION-PLAN-001.md Phase 3's own scope ("a stubbed risk score").
 */
@Service
public class OrderService {

    /**
     * BE-ARCH-001 S2.3's `riskBand` query param documents `stale` as a fourth value alongside
     * `high`/`medium`/`low` (per UI-DESIGN-001 S3.1's "stale/unscored" state) -- `stale` has no
     * corresponding `risk_assessment.risk_band` value in the database; it means "no risk
     * assessment exists yet". This constant names that mapping explicitly rather than leaving it
     * as a silent special case.
     */
    private static final String STALE_RISK_BAND_PARAM = "stale";

    private final OrderRepository orderRepository;
    private final ShipmentRepository shipmentRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;

    public OrderService(OrderRepository orderRepository, ShipmentRepository shipmentRepository,
                         RiskAssessmentRepository riskAssessmentRepository) {
        this.orderRepository = orderRepository;
        this.shipmentRepository = shipmentRepository;
        this.riskAssessmentRepository = riskAssessmentRepository;
    }

    /**
     * {@code status}, if given, is an exact-match filter on {@code order.order_status}. No
     * default filter is applied when it is absent. BE-ARCH-001 S2.3 states a default of
     * {@code "open"}, but none of the four {@code order_status} values this schema's source data
     * actually carries (COMPLETE / PENDING_PAYMENT / PROCESSING / CLOSED, per DB-ARCH-001 S2.3) is
     * literally {@code "open"} -- a contract-level ambiguity surfaced here, not silently resolved
     * by inventing a "which statuses count as open" business rule the source documents never
     * state.
     */
    /**
     * UI-003 Phase 7: cached (keyed by the two filter params) since every call re-reads every
     * order plus a per-order shipment/risk-assessment lookup ({@link #toQueueItem}) -- Postgres
     * stays authoritative; {@link #evictOrdersListingCache()} is this cache's one invalidation
     * rule, called right after a batch-scoring run writes new rows.
     */
    @Cacheable(CacheConfig.ORDERS_LISTING_CACHE)
    public OrdersResponse listOrders(Optional<String> riskBand, Optional<String> status) {
        List<Order> orders = status.map(orderRepository::findByOrderStatus)
                .orElseGet(orderRepository::findAll);

        List<OrderQueueItem> items = orders.stream()
                .map(this::toQueueItem)
                .filter(item -> matchesRiskBandFilter(item, riskBand))
                .sorted(riskDescendingWithUnscoredLast())
                .toList();

        Instant scoresAsOf = items.stream()
                .map(OrderQueueItem::scoredAt)
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(null);

        return new OrdersResponse(scoresAsOf, items);
    }

    /** UI-003 Phase 7's explicit cache-invalidation rule for {@link #listOrders}. */
    @CacheEvict(value = CacheConfig.ORDERS_LISTING_CACHE, allEntries = true)
    public void evictOrdersListingCache() {
    }

    public Optional<OrderDetailResponse> getOrderDetail(Long orderId) {
        return orderRepository.findById(orderId).map(order -> {
            Shipment shipment = shipmentRepository.findByOrderId(orderId).orElse(null);
            RiskAssessment latest = riskAssessmentRepository
                    .findFirstByOrder_OrderIdOrderByScoredAtDesc(orderId).orElse(null);

            CurrentRisk currentRisk = latest == null ? null : new CurrentRisk(
                    latest.getRiskScore(), latest.getRiskBand(), latest.getModelVersion(),
                    latest.getScoredAt());

            return new OrderDetailResponse(
                    order.getOrderId(),
                    order.getPlacedAt(),
                    order.getOrderStatus(),
                    shipment == null ? null : shipment.getShippingMode(),
                    new Destination(order.getOrderCity(), order.getOrderRegion()),
                    new CustomerSummary(order.getCustomer() == null ? null
                            : order.getCustomer().getCustomerSegment()),
                    currentRisk);
        });
    }

    public Optional<RiskAssessmentHistoryResponse> getRiskHistory(Long orderId) {
        if (orderRepository.findById(orderId).isEmpty()) {
            return Optional.empty();
        }
        List<RiskAssessmentHistoryItem> items = riskAssessmentRepository
                .findByOrder_OrderIdOrderByScoredAtDesc(orderId).stream()
                .map(ra -> new RiskAssessmentHistoryItem(ra.getRiskAssessmentId(), ra.getRiskScore(),
                        ra.getRiskBand(), ra.getModelVersion(), ra.getScoredAt()))
                .toList();
        return Optional.of(new RiskAssessmentHistoryResponse(items));
    }

    private OrderQueueItem toQueueItem(Order order) {
        Shipment shipment = shipmentRepository.findByOrderId(order.getOrderId()).orElse(null);
        RiskAssessment latest = riskAssessmentRepository
                .findFirstByOrder_OrderIdOrderByScoredAtDesc(order.getOrderId()).orElse(null);

        return new OrderQueueItem(
                order.getOrderId(),
                latest == null ? null : latest.getRiskBand(),
                latest == null ? null : latest.getRiskScore(),
                shipment == null ? null : shipment.getShippingMode(),
                new Destination(order.getOrderCity(), order.getOrderRegion()),
                latest == null ? null : latest.getScoredAt(),
                order.getOrderStatus(),
                order.getPaymentType());
    }

    private boolean matchesRiskBandFilter(OrderQueueItem item, Optional<String> riskBand) {
        if (riskBand.isEmpty()) {
            return true;
        }
        String wanted = riskBand.get();
        if (STALE_RISK_BAND_PARAM.equalsIgnoreCase(wanted)) {
            return item.scoredAt() == null;
        }
        return item.riskBand() != null && item.riskBand().equalsIgnoreCase(wanted);
    }

    private Comparator<OrderQueueItem> riskDescendingWithUnscoredLast() {
        return Comparator
                .comparing((OrderQueueItem item) -> item.riskScore() == null)
                .thenComparing(Comparator.comparing(OrderQueueItem::riskScore,
                        Comparator.nullsLast(Comparator.reverseOrder())));
    }
}
