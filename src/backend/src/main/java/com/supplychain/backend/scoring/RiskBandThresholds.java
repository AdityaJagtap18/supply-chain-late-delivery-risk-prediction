package com.supplychain.backend.scoring;

/**
 * Risk-score -> risk-band thresholding, owned by the backend's service layer per
 * BE-ARCH-001 S3.3 -- that document explicitly left the concrete threshold values TBD, calling
 * them "ML-001/ML-002's job" (UI-DESIGN-001 S3.1 marks the same thing TBD). This class is that
 * job, exercised now that a real ML-001 training run (scripts/ml/train_model.py) exists to set
 * them against.
 *
 * <p><strong>Implementation-time decision, flagged here rather than silently picked:</strong>
 * High >= 0.70, Medium in [0.40, 0.70), Low < 0.40. These are round-number cut points chosen to
 * land close to the Phase 3 stub seed data's own implicit boundaries (0.12 Low, 0.45/0.61
 * Medium, 0.82/0.91 High) so the UI's visual band distribution does not shift jarringly between
 * stub and real data. They are NOT derived from a cost-benefit analysis of false positives vs.
 * false negatives, and NOT calibrated against the trained model's actual score distribution on
 * the test set (see artifacts/encoders.json's "metrics" for that distribution) -- a product/UX
 * owner revisiting PD-VISION-001's risk-tolerance framing should treat this as a first cut, not
 * a finalized business decision.
 */
public final class RiskBandThresholds {

    public static final double HIGH_THRESHOLD = 0.70;
    public static final double MEDIUM_THRESHOLD = 0.40;

    private RiskBandThresholds() {
    }

    public static String bandFor(double riskScore) {
        if (riskScore >= HIGH_THRESHOLD) {
            return "High";
        }
        if (riskScore >= MEDIUM_THRESHOLD) {
            return "Medium";
        }
        return "Low";
    }
}
