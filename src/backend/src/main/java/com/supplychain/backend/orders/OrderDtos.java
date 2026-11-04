package com.supplychain.backend.orders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Response shapes copied verbatim from BE-ARCH-001 S2.3/2.4/2.5. No field here is invented
 * beyond what that contract specifies.
 */
public class OrderDtos {

    public record Destination(String city, String region) {
    }

    public record CustomerSummary(String segment) {
    }

    /**
     * {@code orderStatus}/{@code paymentType} are a UI-DESIGN-001-REVISION-001 contract
     * extension -- BE-ARCH-001 S2.3's original response did not include them. See that
     * revision document for why.
     */
    public record OrderQueueItem(Long orderId, String riskBand, BigDecimal riskScore,
                                  String shippingMode, Destination destination, Instant scoredAt,
                                  String orderStatus, String paymentType) {
    }

    public record OrdersResponse(Instant scoresAsOf, List<OrderQueueItem> orders) {
    }

    public record CurrentRisk(BigDecimal riskScore, String riskBand, String modelVersion,
                               Instant scoredAt) {
    }

    public record OrderDetailResponse(Long orderId, Instant placedAt, String orderStatus,
                                       String shippingMode, Destination destination,
                                       CustomerSummary customer, CurrentRisk currentRisk) {
    }

    public record RiskAssessmentHistoryItem(Long riskAssessmentId, BigDecimal riskScore,
                                             String riskBand, String modelVersion, Instant scoredAt) {
    }

    public record RiskAssessmentHistoryResponse(List<RiskAssessmentHistoryItem> assessments) {
    }
}
