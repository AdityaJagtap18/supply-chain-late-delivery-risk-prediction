package com.supplychain.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.supplychain.backend.auth.AppUser;
import com.supplychain.backend.auth.AppUserRepository;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

/**
 * SEC-THREATMODEL-001's concrete, functionally-testable requirements (QA-STRATEGY-001 S2's
 * "backend auth-enforcement, functional correctness, not adversarial" framing applies equally
 * here -- these check the documented behavior exists, not that it resists a determined attacker):
 * REQ-INPUT-001 (query-param enum validation), REQ-INPUT-003 (login body validation), REQ-AUTH-001
 * (the new Phase 4 batch-scoring endpoint is covered by the same authenticated-by-default rule),
 * and REQ-RATE-001 (login rate limiting).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityRequirementsIntegrationTests {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private AppUserRepository appUserRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void seedUser() {
        appUserRepository.save(new AppUser("sec-test-analyst", passwordEncoder.encode("sec-test-pw"),
                Instant.now()));
    }

    private MockHttpSession loginAndGetSession() throws Exception {
        MvcResult loginResult = mockMvc.perform(post("/auth/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sec-test-analyst\",\"credential\":\"sec-test-pw\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) loginResult.getRequest().getSession(false);
    }

    @Test
    void batchScoringEndpointRejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(post("/system/batch-scoring")).andExpect(status().isUnauthorized());
    }

    @Test
    void blankLoginCredentialsAreRejectedWithBadRequest() throws Exception {
        mockMvc.perform(post("/auth/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"credential\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingLoginFieldsAreRejectedWithBadRequest() throws Exception {
        mockMvc.perform(post("/auth/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unrecognizedRiskBandQueryParamIsRejected() throws Exception {
        MockHttpSession session = loginAndGetSession();
        mockMvc.perform(get("/orders").session(session).param("riskBand", "not-a-real-band"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unrecognizedStatusQueryParamIsRejected() throws Exception {
        MockHttpSession session = loginAndGetSession();
        mockMvc.perform(get("/orders").session(session).param("status", "NOT_A_REAL_STATUS"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void recognizedRiskBandQueryParamIsAccepted() throws Exception {
        MockHttpSession session = loginAndGetSession();
        mockMvc.perform(get("/orders").session(session).param("riskBand", "high"))
                .andExpect(status().isOk());
    }

    @Test
    void loginIsRateLimitedAfterTooManyAttempts() throws Exception {
        String uniqueUsername = "rate-limit-probe-user";
        String body = "{\"username\":\"" + uniqueUsername + "\",\"credential\":\"wrong\"}";

        for (int attempt = 0; attempt < 10; attempt++) {
            mockMvc.perform(post("/auth/sessions").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/auth/sessions").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isTooManyRequests());
    }
}
