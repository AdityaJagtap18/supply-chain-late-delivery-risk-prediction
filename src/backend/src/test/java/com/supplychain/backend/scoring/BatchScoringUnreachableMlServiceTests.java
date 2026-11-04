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
import java.net.ServerSocket;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

/**
 * The other half of ML-INFERENCE-001 S5's whole-batch-failure behavior
 * ({@link BatchScoringServiceIntegrationTests} covers the non-2xx case): the ML service is
 * entirely unreachable (connection refused), not just erroring. Points {@code ml-service.base-url}
 * at a closed local port, found by briefly opening and immediately closing a server socket, so
 * nothing listens there.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BatchScoringUnreachableMlServiceTests {

    private static int unusedPort;

    @DynamicPropertySource
    static void mlServiceUrl(DynamicPropertyRegistry registry) throws Exception {
        try (ServerSocket socket = new ServerSocket(0)) {
            unusedPort = socket.getLocalPort();
        }
        registry.add("ml-service.base-url", () -> "http://localhost:" + unusedPort);
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

    @Test
    void unreachableMlServiceAbortsWithNoWrites() {
        Customer customer = customerRepository.save(new Customer(4001, "Consumer"));
        customerLocationRepository.save(new CustomerLocation(4001, "Testville", "TS", "00000", "Testland"));
        Order order = orderRepository.save(new Order(customer, "Testville", "Testland", "Test Region",
                "Test State", "LATAM", "PROCESSING", Instant.now(), "DEBIT"));
        shipmentRepository.save(new Shipment(order, "Standard Class"));

        BatchScoringResult result = batchScoringService.runBatch();

        assertThat(result.succeeded()).isFalse();
        assertThat(result.abortReason()).containsIgnoringCase("unreachable");
        assertThat(riskAssessmentRepository.findFirstByOrder_OrderIdOrderByScoredAtDesc(order.getOrderId()))
                .isEmpty();
    }
}
