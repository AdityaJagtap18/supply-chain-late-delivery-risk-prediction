package com.supplychain.backend.mlcheck;

import java.util.List;

/**
 * Mirrors ML-INFERENCE-001-service-contract.md §§ 1-2 exactly — the field names/shapes here are
 * that artifact's contract, not this skeleton's invention. Nothing beyond what that artifact
 * finalizes is added to the request; `confidence` is deliberately nullable per that artifact's
 * § 2 note (reserved, not populated).
 */
public final class MlScoreDtos {

    private MlScoreDtos() {
    }

    public record Features(
            String type,
            String customerCity,
            Integer customerId,
            String customerZipcode,
            String orderCity,
            String orderCountry,
            String orderRegion,
            String orderState,
            String shippingMode) {
    }

    public record OrderRequest(Integer orderId, Features features) {
    }

    public record ScoreRequest(List<OrderRequest> orders) {
    }

    public record OrderResult(Integer orderId, Double riskScore, String modelVersion, Double confidence) {
    }

    public record ScoreResponse(List<OrderResult> results) {
    }
}
