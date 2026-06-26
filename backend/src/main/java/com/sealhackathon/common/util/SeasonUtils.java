package com.sealhackathon.common.util;

import java.util.Locale;
import java.util.Map;

public final class SeasonUtils {

    private static final Map<String, String> ALIASES = Map.of(
            "fail", "Fall",
            "autumn", "Fall",
            "spring", "Spring",
            "summer", "Summer",
            "fall", "Fall",
            "winter", "Winter");

    private SeasonUtils() {
    }

    public static String normalize(String season) {
        if (season == null || season.isBlank()) {
            return season;
        }
        String trimmed = season.trim();
        String canonical = ALIASES.get(trimmed.toLowerCase(Locale.ROOT));
        if (canonical != null) {
            return canonical;
        }
        return trimmed.substring(0, 1).toUpperCase(Locale.ROOT)
                + trimmed.substring(1).toLowerCase(Locale.ROOT);
    }
}
