package com.supplychain.backend.scoring;

import static org.assertj.core.api.Assertions.assertThat;

import com.supplychain.backend.domain.Customer;
import com.supplychain.backend.domain.CustomerLocation;
import com.supplychain.backend.domain.CustomerLocationRepository;
import com.supplychain.backend.domain.CustomerRepository;
import com.supplychain.backend.domain.Order;
import com.supplychain.backend.domain.OrderRepository;
import com.supplychain.backend.domain.RiskAssessmentRepository;
import com.supplychain.backend.domain.Shipment;
import com.supplychain.backend.domain.ShipmentRepository;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * QA-STRATEGY-001 S2's explicit instruction: the ML-INFERENCE-001 S5 error/fallback behavior
 * (whole-batch failure leaves previous scores untouched; per-order failure skips only that
 * order) "must be integration-tested... a mock that always 'succeeds' can't catch a fallback
 * path regression." This exercises {@link BatchScoringService} against real H2-backed
 * repositories with a fake upstream HTTP server standing in for ml-service -- a "test double
 * that can simulate failure," per that document's own phrasing -- not a happy-path-only mock.
 *
 * <p>The fake server's behavior is driven entirely by data already in the request (a magic
 * {@code paymentType} value selects the whole-batch-failure path; a magic negative
 * {@code customerId} selects the per-order-omission path), so one running fake server covers
 * every scenario without needing a different Spring context per test method.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BatchScoringServiceIntegrationTests {

    private static final String TRIGGER_WHOLE_BATCH_FAILURE_PAYMENT_TYPE = "TRIGGER_500";
    private static final int OMITTED_CUSTOMER_ID = -1;

    private static HttpServer fakeMlService;

    @BeforeAll
    static void startFakeMlService() throws IOException {
        fakeMlService = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        fakeMlService.createContext("/score", exchange -> {
            String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            byte[] responseBytes;
            int status;
            if (requestBody.contains(TRIGGER_WHOLE_BATCH_FAILURE_PAYMENT_TYPE)) {
                status = 500;
                responseBytes = "{\"error\":\"simulated failure\"}".getBytes(StandardCharsets.UTF_8);
            } else {
                status = 200;
                responseBytes = buildScoreResponse(requestBody).getBytes(StandardCharsets.UTF_8);
            }
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, responseBytes.length);
            exchange.getResponseBody().write(responseBytes);
            exchange.close();
        });
        fakeMlService.start();
    }

    @AfterAll
    static void stopFakeMlService() {
        fakeMlService.stop(0);
    }

    /** Builds a ScoreResponse echoing every orderId except one whose customerId marks it for omission. */
    private static String buildScoreResponse(String requestBody) {
        StringBuilder results = new StringBuilder("{\"results\":[");
        boolean first = true;
        for (String orderIdStr : requestBody.split("\"orderId\":")) {
            String trimmed = orderIdStr.trim();
            if (trimmed.isEmpty() || !Character.isDigit(trimmed.charAt(0))) {
                continue;
            }
            String orderId = trimmed.replaceAll("^(\\d+).*", "$1");
            boolean belongsToOmittedCustomer = orderIdStr.contains("\"customerId\":" + OMITTED_CUSTOMER_ID);
            if (belongsToOmittedCustomer) {
                continue;
            }
            if (!first) {
                results.append(",");
            }
            results.append("{\"orderId\":").append(orderId)
                    .append(",\"riskScore\":0.5,\"modelVersion\":\"test-model-v1\",\"confidence\":null}");
            first = false;
        }
        results.append("]}");
        return results.toString();
    }

    @DynamicPropertySource
    static void mlServiceUrl(DynamicPropertyRegistry registry) {
        registry.add(
                "ml-service.base-url", () -> "http://localhost:" + fakeMlService.getAddress().getPort());
    }

    @Autowired
    private BatchScoringService batchScoringService;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private CustomerLocationRepository customerLocationRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ShipmentRepository shipmentRepository;
    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;

    private Order seedScorableOrder(int customerId, String paymentType) {
        Customer customer = customerRepository.save(new Customer(customerId, "Consumer"));
        customerLocationRepository.save(
                new CustomerLocation(customerId, "Testville", "TS", "00000", "Testland"));
        Order order = orderRepository.save(new Order(customer, "Testville", "Testland", "Test Region",
                "Test State", "LATAM", "PROCESSING", Instant.now(), paymentType));
        shipmentRepository.save(new Shipment(order, "Standard Class"));
        return order;
    }

    @Test
    void successfulRunPersistsOneRiskAssessmentPerScoredOrder() {
        Order order = seedScorableOrder(3001, "DEBIT");

        BatchScoringResult result = batchScoringService.runBatch();

        assertThat(result.succeeded()).isTrue();
        assertThat(result.scoredCount()).isEqualTo(1);
        assertThat(result.skippedUnseenCategory()).isEqualTo(0);
        assertThat(riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(order.getOrderId()))
                .isPresent();
    }

    @Test
    void perOrderOmissionIsSkippedNotFabricated() {
        Order omittedOrder = seedScorableOrder(OMITTED_CUSTOMER_ID, "DEBIT");
        Order normalOrder = seedScorableOrder(3002, "CASH");

        BatchScoringResult result = batchScoringService.runBatch();

        assertThat(result.succeeded()).isTrue();
        assertThat(result.scoredCount()).isEqualTo(1);
        assertThat(result.skippedUnseenCategory()).isEqualTo(1);
        assertThat(riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(normalOrder.getOrderId()))
                .isPresent();
        assertThat(riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(omittedOrder.getOrderId()))
                .isEmpty();
    }

    @Test
    void orderMissingCustomerLocationIsSkippedBeforeCallingMlService() {
        Customer customer = customerRepository.save(new Customer(3003, "Consumer"));
        // Deliberately no CustomerLocation row for this customer.
        Order order = orderRepository.save(new Order(customer, "Testville", "Testland", "Test Region",
                "Test State", "LATAM", "PROCESSING", Instant.now(), "DEBIT"));
        shipmentRepository.save(new Shipment(order, "Standard Class"));

        BatchScoringResult result = batchScoringService.runBatch();

        assertThat(result.succeeded()).isFalse();
        assertThat(riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(order.getOrderId()))
                .isEmpty();
    }

    @Test
    void wholeBatchFailureWritesNothingAndIsReportedHonestly() {
        Order order = seedScorableOrder(3004, TRIGGER_WHOLE_BATCH_FAILURE_PAYMENT_TYPE);

        BatchScoringResult result = batchScoringService.runBatch();

        assertThat(result.succeeded()).isFalse();
        assertThat(result.abortReason()).isNotBlank();
        assertThat(riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(order.getOrderId()))
                .isEmpty();
    }
}
