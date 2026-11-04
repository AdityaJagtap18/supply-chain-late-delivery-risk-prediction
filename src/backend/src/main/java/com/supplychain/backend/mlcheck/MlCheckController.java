package com.supplychain.backend.mlcheck;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Diagnostic-only endpoint proving target-flow step 3 (backend reaches the ML service over the
 * network) and, when a model happens to be loaded, step 6 (a prediction returns to the
 * backend). This is NOT FR-031's real batch-scoring endpoint and is NOT part of
 * ML-INFERENCE-001's contract — its own response shape below is this skeleton's diagnostic
 * invention, scoped to Phase 1 verification, not a finalized API.
 */
@RestController
@RequestMapping("/api/ml-check")
public class MlCheckController {

    private final MlServiceClient mlServiceClient;

    public MlCheckController(MlServiceClient mlServiceClient) {
        this.mlServiceClient = mlServiceClient;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> check() {
        var sampleOrder = new MlScoreDtos.OrderRequest(
                1,
                new MlScoreDtos.Features(
                        "DEBIT", "Springfield", 847, "12345", "Springfield", "USA", "West", "CA", "Standard Class"));
        var result = mlServiceClient.score(new MlScoreDtos.ScoreRequest(List.of(sampleOrder)));

        if (!result.reachable()) {
            return ResponseEntity.status(502)
                    .body(Map.of("backendReachedMlService", false, "error", result.error()));
        }
        if (result.httpStatus() == 200) {
            return ResponseEntity.ok(Map.of(
                    "backendReachedMlService", true,
                    "mlServiceStatus", 200,
                    "scoreResponse", result.body()));
        }
        return ResponseEntity.status(result.httpStatus())
                .body(Map.of(
                        "backendReachedMlService", true,
                        "mlServiceStatus", result.httpStatus(),
                        "mlServiceBody", result.rawBody()));
    }
}
