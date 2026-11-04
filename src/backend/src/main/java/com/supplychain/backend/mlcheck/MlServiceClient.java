package com.supplychain.backend.mlcheck;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * Backend-to-ML-service network call (ADR-0004, Accepted — a separate Python service, never
 * in-process). This is the IMPLEMENTATION-PLAN-001.md target-flow step 3 connection; the actual
 * FR-031 batch-scoring integration (ML-INFERENCE-001 § 4's recommended batch pattern) is a later
 * Phase 4 task, not this skeleton's scope — this client exists to prove the network path works,
 * not to implement the real batch job.
 */
@Component
public class MlServiceClient {

    private final RestClient restClient;

    public MlServiceClient(RestClient.Builder builder, @Value("${ml-service.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public MlServiceCallResult score(MlScoreDtos.ScoreRequest request) {
        try {
            return restClient
                    .post()
                    .uri("/score")
                    .body(request)
                    .exchange(
                            (clientRequest, clientResponse) -> {
                                int status = clientResponse.getStatusCode().value();
                                if (clientResponse.getStatusCode().is2xxSuccessful()) {
                                    return MlServiceCallResult.success(
                                            status, clientResponse.bodyTo(MlScoreDtos.ScoreResponse.class));
                                }
                                String rawBody = new String(clientResponse.getBody().readAllBytes());
                                return MlServiceCallResult.nonSuccess(status, rawBody);
                            });
        } catch (ResourceAccessException e) {
            // The ML service is unreachable (connection refused, DNS failure, etc. — RestClient
            // wraps the underlying IOException in this unchecked exception). Reported
            // explicitly, never silently treated as a successful call with no result.
            return MlServiceCallResult.unreachable(e.getMessage());
        }
    }

    /** UI-003 Phase 6: relays the ML service's read-only training-run metadata, unmodified. */
    @SuppressWarnings("unchecked")
    public ModelInfoCallResult modelInfo() {
        try {
            return restClient
                    .get()
                    .uri("/model-info")
                    .exchange(
                            (clientRequest, clientResponse) -> {
                                int status = clientResponse.getStatusCode().value();
                                if (clientResponse.getStatusCode().is2xxSuccessful()) {
                                    return ModelInfoCallResult.success(
                                            status, clientResponse.bodyTo(Map.class));
                                }
                                String rawBody = new String(clientResponse.getBody().readAllBytes());
                                return ModelInfoCallResult.nonSuccess(status, rawBody);
                            });
        } catch (ResourceAccessException e) {
            return ModelInfoCallResult.unreachable(e.getMessage());
        }
    }
}
