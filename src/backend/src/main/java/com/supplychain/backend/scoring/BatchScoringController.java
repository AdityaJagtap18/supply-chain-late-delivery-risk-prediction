package com.supplychain.backend.scoring;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Real FR-031 batch-scoring trigger. BE-ARCH-001 S3.4/S5 left this endpoint's existence, auth
 * requirement, and scope as an open question ("TBD -- also contingent on the scope question
 * above"); this Phase 4 implementation makes the concrete choice to add it as a single
 * synchronous, authenticated (session, same as every other endpoint per SecurityConfig's
 * default-authenticated rule) POST, run-on-demand rather than on
 * `BATCH_SCORING_CADENCE_CRON` (still `TBD` per ARCH-CONSISTENCY-001 CONS-005 -- no scheduler is
 * wired here; a cron-driven trigger is a DEV-001 operational concern, not invented in this
 * phase). This is a deliberate scope choice, not a rediscovery of a committed contract.
 */
@RestController
public class BatchScoringController {

    private final BatchScoringService batchScoringService;

    public BatchScoringController(BatchScoringService batchScoringService) {
        this.batchScoringService = batchScoringService;
    }

    @PostMapping("/system/batch-scoring")
    public ResponseEntity<Map<String, Object>> triggerBatchScoring() {
        BatchScoringResult result = batchScoringService.runBatch();
        if (!result.succeeded()) {
            return ResponseEntity.status(502).body(Map.of(
                    "succeeded", false,
                    "reason", result.abortReason()));
        }
        return ResponseEntity.ok(Map.of(
                "succeeded", true,
                "scoredAt", result.scoredAt(),
                "totalOrders", result.totalOrders(),
                "scoredCount", result.scoredCount(),
                "skippedUnseenCategory", result.skippedUnseenCategory(),
                "skippedIncompleteData", result.skippedIncompleteData(),
                "skippedUnchanged", result.skippedUnchanged()));
    }
}
