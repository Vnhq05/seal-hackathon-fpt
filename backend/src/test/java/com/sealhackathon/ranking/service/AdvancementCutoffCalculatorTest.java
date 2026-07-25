package com.sealhackathon.ranking.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class AdvancementCutoffCalculatorTest {

    private AdvancementCutoffCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new AdvancementCutoffCalculator();
        ReflectionTestUtils.setField(calculator, "autoEnabled", true);
        ReflectionTestUtils.setField(calculator, "ratio", 0.25);
        ReflectionTestUtils.setField(calculator, "minPerBucket", 1);
        ReflectionTestUtils.setField(calculator, "maxPerBucket", 10);
    }

    @Test
    void compute_returnsZero_whenEmpty() {
        assertThat(calculator.compute(0)).isZero();
    }

    @Test
    void compute_respectsMin_forSmallPools() {
        // ceil(4 * 0.25) = 1 → min 1
        assertThat(calculator.compute(4)).isEqualTo(1);
    }

    @Test
    void compute_usesRatio() {
        // ceil(20 * 0.25) = 5
        assertThat(calculator.compute(20)).isEqualTo(5);
    }

    @Test
    void compute_capsAtMax() {
        // ceil(100 * 0.25) = 25 → max 10
        assertThat(calculator.compute(100)).isEqualTo(10);
    }

    @Test
    void compute_neverExceedsTeamCount() {
        ReflectionTestUtils.setField(calculator, "minPerBucket", 5);
        assertThat(calculator.compute(3)).isEqualTo(3);
    }
}
