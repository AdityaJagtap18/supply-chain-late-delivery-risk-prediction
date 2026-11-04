package com.supplychain.backend.orders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.supplychain.backend.auth.AppUser;
import com.supplychain.backend.auth.AppUserRepository;
import com.supplychain.backend.domain.Customer;
import com.supplychain.backend.domain.CustomerRepository;
import com.supplychain.backend.domain.Order;
import com.supplychain.backend.domain.OrderRepository;
import com.supplychain.backend.domain.RiskAssessment;
import com.supplychain.backend.domain.RiskAssessmentRepository;
import com.supplychain.backend.domain.Shipment;
import com.supplychain.backend.domain.ShipmentRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * Exercises BE-ARCH-001's real endpoints (not mocked) against a real H2-backed Spring context:
 * FR-034's auth gate, and FR-032/FR-033's list/detail views over seeded data with a stubbed
 * risk score (this phase's own scope, per IMPLEMENTATION-PLAN-001.md Phase 3).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrderApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private AppUserRepository appUserRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ShipmentRepository shipmentRepository;
    @Autowired
    private RiskAssessmentRepository riskAssessmentRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private Order scoredOrder;

    @BeforeEach
    void seed() {
        appUserRepository.save(new AppUser("analyst", passwordEncoder.encode("analyst123"),
                Instant.now()));

        Customer customer = customerRepository.save(new Customer(2001, "Consumer"));
        scoredOrder = orderRepository.save(new Order(customer, "Columbus", "USA", "Midwest", "OH",
                "LATAM", "PROCESSING", Instant.now(), "DEBIT"));
        shipmentRepository.save(new Shipment(scoredOrder, "Standard Class"));
        riskAssessmentRepository.save(new RiskAssessment(scoredOrder, "stub-seed-data-phase3",
                new BigDecimal("0.77"), "High", Instant.now(), null));
    }

    @Test
    void ordersEndpointRejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/orders")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginThenListThenDetailWorksEndToEnd() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/auth/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"analyst\",\"credential\":\"analyst123\"}"))
                .andExpect(status().isOk())
                .andReturn();

        var session = loginResult.getRequest().getSession(false);
        assertThat(session).isNotNull();

        String listBody = mockMvc.perform(get("/orders").session((org.springframework.mock.web.MockHttpSession) session))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(listBody).contains("\"riskBand\":\"High\"");
        assertThat(listBody).contains("Columbus");

        String detailBody = mockMvc.perform(get("/orders/" + scoredOrder.getOrderId())
                        .session((org.springframework.mock.web.MockHttpSession) session))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(detailBody).contains("\"segment\":\"Consumer\"");
        assertThat(detailBody).contains("\"modelVersion\":\"stub-seed-data-phase3\"");

        mockMvc.perform(delete("/auth/sessions")
                        .session((org.springframework.mock.web.MockHttpSession) session))
                .andExpect(status().isNoContent());
    }

    @Test
    void loginWithWrongPasswordIsRejected() throws Exception {
        mockMvc.perform(post("/auth/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"analyst\",\"credential\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }
}
