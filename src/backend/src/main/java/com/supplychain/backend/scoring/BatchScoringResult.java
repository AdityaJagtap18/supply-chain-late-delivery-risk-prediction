package com.supplychain.backend.scoring;

import java.time.Instant;

/**
 * Outcome of one {@code BatchScoringService.runBatch()} call -- distinguishes a real success
 * (with per-category counts, never hidden) from an aborted whole-batch run, per
 * ML-INFERENCE-001 S5.
 */
public record BatchScoringResult(
        boolean succeeded, Instant scoredAt, Integer totalOrders, Integer scoredCount,
        Integer skippedUnseenCategory, Integer skippedIncompleteData, Integer skippedUnchanged,
        String abortReason) {

    public static BatchScoringResult success(Instant scoredAt, int totalOrders, int scoredCount,
                                               int skippedUnseenCategory, int skippedIncompleteData,
                                               int skippedUnchanged) {
        return new BatchScoringResult(true, scoredAt, totalOrders, scoredCount, skippedUnseenCategory,
                skippedIncompleteData, skippedUnchanged, null);
    }

    public static BatchScoringResult aborted(String reason) {
        return new BatchScoringResult(false, null, null, null, null, null, null, reason);
    }
}
