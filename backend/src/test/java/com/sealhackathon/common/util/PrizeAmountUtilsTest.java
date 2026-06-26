package com.sealhackathon.common.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PrizeAmountUtilsTest {

    @Test
    void parsePrizeAmount_shouldExtractDigits() {
        assertThat(PrizeAmountUtils.parsePrizeAmount("5,000,000 VND")).isEqualTo(5_000_000L);
        assertThat(PrizeAmountUtils.parsePrizeAmount("1000000")).isEqualTo(1_000_000L);
    }

    @Test
    void parsePrizeAmount_shouldReturnNull_whenNoDigits() {
        assertThat(PrizeAmountUtils.parsePrizeAmount("")).isNull();
        assertThat(PrizeAmountUtils.parsePrizeAmount("TBD")).isNull();
    }
}
