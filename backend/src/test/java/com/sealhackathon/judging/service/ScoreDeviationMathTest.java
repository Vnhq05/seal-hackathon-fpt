package com.sealhackathon.judging.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ScoreDeviationMathTest {

    private static final BigDecimal THRESHOLD_25 = new BigDecimal("25");
    private static final BigDecimal COHEN_08 = new BigDecimal("0.8");

    @Test
    void toPercent_usesEventScaleMaxAsHundredPercent() {
        assertThat(ScoreDeviationMath.toPercent(new BigDecimal("10"), 10))
                .isEqualByComparingTo("100.00");
        assertThat(ScoreDeviationMath.toPercent(new BigDecimal("2"), 10))
                .isEqualByComparingTo("20.00");
        assertThat(ScoreDeviationMath.toPercent(new BigDecimal("5"), 5))
                .isEqualByComparingTo("100.00");
        assertThat(ScoreDeviationMath.toPercent(new BigDecimal("1"), 5))
                .isEqualByComparingTo("20.00");
    }

    @Test
    void scale10_example_flagsLowJudgesNotNearMax() {
        // 10,9,8,2,3 → 100,90,80,20,30
        List<BigDecimal> pct = List.of(
                new BigDecimal("100.00"),
                new BigDecimal("90.00"),
                new BigDecimal("80.00"),
                new BigDecimal("20.00"),
                new BigDecimal("30.00"));
        BigDecimal max = new BigDecimal("100.00");

        assertThat(flaggedAt(pct, max, 0)).isFalse(); // 10
        assertThat(flaggedAt(pct, max, 1)).isFalse(); // 9 gap 10%
        assertThat(flaggedAt(pct, max, 2)).isFalse(); // 8 gap 20%
        assertThat(flaggedAt(pct, max, 3)).isTrue();  // 2 gap 80%
        assertThat(flaggedAt(pct, max, 4)).isTrue();  // 3 gap 70%

        assertThat(ScoreDeviationMath.consensusIndex(2, 5))
                .isEqualByComparingTo("0.6000");
    }

    @Test
    void cohenD_vsMajority_isLargeForOutliers() {
        List<BigDecimal> pct = List.of(
                new BigDecimal("100.00"),
                new BigDecimal("90.00"),
                new BigDecimal("80.00"),
                new BigDecimal("20.00"),
                new BigDecimal("30.00"));
        BigDecimal max = new BigDecimal("100.00");

        BigDecimal dOutlier = ScoreDeviationMath.cohenDVsMajority(pct, 3, max, THRESHOLD_25);
        assertThat(dOutlier).isNotNull();
        assertThat(dOutlier.abs()).isGreaterThanOrEqualTo(COHEN_08);

        BigDecimal dNear = ScoreDeviationMath.cohenDVsMajority(pct, 1, max, THRESHOLD_25);
        assertThat(dNear).isNotNull();
        assertThat(dNear.abs()).isLessThan(COHEN_08);
    }

    @Test
    void deviationSpread_onScale10_isEightyNotOneSixty() {
        BigDecimal max = ScoreDeviationMath.toPercent(new BigDecimal("10"), 10);
        BigDecimal min = ScoreDeviationMath.toPercent(new BigDecimal("2"), 10);
        assertThat(max.subtract(min)).isEqualByComparingTo("80.00");
    }

    private boolean flaggedAt(List<BigDecimal> pct, BigDecimal max, int index) {
        BigDecimal gap = max.subtract(pct.get(index)).setScale(2);
        return ScoreDeviationMath.isFlaggedByGap(gap, THRESHOLD_25);
    }
}
