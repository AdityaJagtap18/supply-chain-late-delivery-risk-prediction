package com.supplychain.backend.scoring;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** QA-STRATEGY-001 S1's backend-service-layer unit-test scope: the risk-band thresholding logic. */
class RiskBandThresholdsTest {

    @Test
    void bandsAtAndAboveHighThresholdAreHigh() {
        assertThat(RiskBandThresholds.bandFor(0.70)).isEqualTo("High");
        assertThat(RiskBandThresholds.bandFor(0.99)).isEqualTo("High");
        assertThat(RiskBandThresholds.bandFor(1.0)).isEqualTo("High");
    }

    @Test
    void bandsInMediumRangeAreMedium() {
        assertThat(RiskBandThresholds.bandFor(0.40)).isEqualTo("Medium");
        assertThat(RiskBandThresholds.bandFor(0.55)).isEqualTo("Medium");
        assertThat(RiskBandThresholds.bandFor(0.6999)).isEqualTo("Medium");
    }

    @Test
    void bandsBelowMediumThresholdAreLow() {
        assertThat(RiskBandThresholds.bandFor(0.0)).isEqualTo("Low");
        assertThat(RiskBandThresholds.bandFor(0.3999)).isEqualTo("Low");
    }
}
