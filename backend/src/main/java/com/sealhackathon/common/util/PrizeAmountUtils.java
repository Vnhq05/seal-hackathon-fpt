package com.sealhackathon.common.util;

public final class PrizeAmountUtils {

    private PrizeAmountUtils() {}

    public static Long parsePrizeAmount(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String digits = value.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return null;
        }
        return Long.parseLong(digits);
    }
}
