package com.supplychain.backend.mlcheck;

import static org.assertj.core.api.Assertions.assertThat;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Proves target-flow step 3 (backend reaches the ML service over the network) against a fake
 * upstream standing in for the real ml-service container — the real container's own behavior
 * (honest model_unavailable when no artifacts are loaded) was separately verified directly via
 * docker compose, per IMPLEMENTATION-PLAN-001.md. This test only proves the backend's HTTP
 * client code correctly reaches a remote service and passes through a non-2xx response rather
 * than swallowing or fabricating one.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class MlCheckControllerTests {

    private static HttpServer fakeMlService;

    @BeforeAll
    static void startFakeMlService() throws IOException {
        fakeMlService = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        fakeMlService.createContext("/score", exchange -> {
            String body = "{\"error\":\"model_unavailable\",\"detail\":\"no artifacts (fake upstream)\"}";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(503, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        fakeMlService.start();
    }

    @AfterAll
    static void stopFakeMlService() {
        fakeMlService.stop(0);
    }

    @DynamicPropertySource
    static void mlServiceUrl(DynamicPropertyRegistry registry) {
        registry.add(
                "ml-service.base-url", () -> "http://localhost:" + fakeMlService.getAddress().getPort());
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void passesThroughMlServiceResponseRatherThanFabricatingOne() {
        ResponseEntity<String> response =
                restTemplate.getForEntity("http://localhost:" + port + "/api/ml-check", String.class);

        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody()).contains("\"backendReachedMlService\":true");
        assertThat(response.getBody()).contains("model_unavailable");
    }
}
