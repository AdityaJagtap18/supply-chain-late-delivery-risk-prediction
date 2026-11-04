package com.supplychain.backend.orders;

import com.supplychain.backend.domain.RiskAssessment;
import com.supplychain.backend.domain.RiskAssessmentRepository;
import com.supplychain.backend.mlcheck.MlServiceClient;
import com.supplychain.backend.mlcheck.ModelInfoCallResult;
import java.time.Instant;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * BE-ARCH-001 S2.6 -- {@code GET /system/model-versions}. Reports the {@code model_version} of
 * the most recently scored {@code risk_assessment} row, whatever that value actually is -- today
 * that is the Phase 3 stub seed value, not a real {@code ML-001} model identifier. Returns
 * {@code null} rather than a fabricated string when no risk assessment exists at all.
 *
 * <p>{@code lastScoredAt} (Phase 5 addition) is `DEV-STRATEGY-001` S5.3's "time since last
 * successful run" batch-job health signal -- the one monitoring signal that document says this
 * system needs for "is scoring actually keeping up," distinct from any single unit's uptime. No
 * alerting threshold is implemented here (S4 there leaves the expected cadence itself an open
 * `BATCH_SCORING_CADENCE_CRON` question); this endpoint only exposes the raw signal honestly.
 */
@RestController
public class SystemController {

    public record ModelVersionsResponse(String activeModelVersion, Instant lastScoredAt) {
    }

    private final RiskAssessmentRepository riskAssessmentRepository;
    private final MlServiceClient mlServiceClient;

    public SystemController(RiskAssessmentRepository riskAssessmentRepository,
                             MlServiceClient mlServiceClient) {
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.mlServiceClient = mlServiceClient;
    }

    @GetMapping("/system/model-versions")
    public ModelVersionsResponse getModelVersions() {
        RiskAssessment latest = riskAssessmentRepository
                .findAll(PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "scoredAt")))
                .stream()
                .findFirst()
                .orElse(null);
        return new ModelVersionsResponse(
                latest == null ? null : latest.getModelVersion(),
                latest == null ? null : latest.getScoredAt());
    }

    /**
     * UI-003 Phase 6 -- relays the ML service's {@code GET /model-info} (read-only training-run
     * metadata: algorithm, feature list, offline test-set metrics, training category
     * frequencies) for the ML Monitoring module. Never recomputed or fabricated here; this is a
     * pass-through, same pattern as {@code BatchScoringController} relaying the ML service's own
     * batch-scoring result.
     */
    @GetMapping("/system/model-info")
    public ResponseEntity<Map<String, Object>> getModelInfo() {
        ModelInfoCallResult result = mlServiceClient.modelInfo();
        if (!result.reachable()) {
            return ResponseEntity.status(502).body(Map.of(
                    "available", false,
                    "reason", "ML service unreachable: " + result.error()));
        }
        if (result.httpStatus() != 200) {
            return ResponseEntity.status(result.httpStatus()).body(Map.of(
                    "available", false,
                    "reason", "ML service returned " + result.httpStatus()));
        }
        return ResponseEntity.ok(result.body());
    }
}
