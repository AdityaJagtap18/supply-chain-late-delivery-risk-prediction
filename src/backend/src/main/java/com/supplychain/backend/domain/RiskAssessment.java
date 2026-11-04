package com.supplychain.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Maps to DB-ARCH-001 S2.7 `risk_assessment`. `feature_snapshot` was left unmapped through
 * Phase 6 -- BE-ARCH-001 S3.4 states no endpoint reads it -- but UI-003 Phase 7 is exactly what
 * that column was reserved for: the exact feature values a score was computed from, so a later
 * batch run can tell whether an order's inputs actually changed before paying for a re-score.
 * See {@code BatchScoringService}'s fingerprint comparison.
 *
 * Phase 3 scope note: rows backing this entity are seeded stub scores
 * (`model_version = "stub-seed-data-phase3"`), not real ML inference output -- Phase 4 is what
 * replaces the stub with the real inference call per IMPLEMENTATION-PLAN-001.md.
 */
@Entity
@Table(name = "risk_assessment")
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "risk_assessment_id")
    private Long riskAssessmentId;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "model_version", nullable = false)
    private String modelVersion;

    @Column(name = "risk_score")
    private BigDecimal riskScore;

    @Column(name = "risk_band")
    private String riskBand;

    @Column(name = "scored_at", nullable = false)
    private Instant scoredAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "feature_snapshot")
    private String featureSnapshot;

    protected RiskAssessment() {
    }

    public RiskAssessment(Order order, String modelVersion, BigDecimal riskScore, String riskBand,
                           Instant scoredAt, String featureSnapshot) {
        this.order = order;
        this.modelVersion = modelVersion;
        this.riskScore = riskScore;
        this.riskBand = riskBand;
        this.scoredAt = scoredAt;
        this.featureSnapshot = featureSnapshot;
    }

    public Long getRiskAssessmentId() {
        return riskAssessmentId;
    }

    public Order getOrder() {
        return order;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public BigDecimal getRiskScore() {
        return riskScore;
    }

    public String getRiskBand() {
        return riskBand;
    }

    public Instant getScoredAt() {
        return scoredAt;
    }

    public String getFeatureSnapshot() {
        return featureSnapshot;
    }
}
