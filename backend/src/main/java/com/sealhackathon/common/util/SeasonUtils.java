package com.sealhackathon.common.util;

import com.sealhackathon.common.exception.BusinessException;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;

public final class SeasonUtils {

    public static final Set<String> VALID_SEASONS = Set.of("Spring", "Summer", "Fall");

    private static final Map<String, String> ALIASES = Map.of(
            "fail", "Fall",
            "autumn", "Fall",
            "winter", "Fall",
            "spring", "Spring",
            "summer", "Summer",
            "fall", "Fall");

    private SeasonUtils() {
    }

    /**
     * FPT academic seasons: Spring (Feb–May), Summer (Jun–Sep), Fall (Oct–Jan).
     */
    public static String deriveCurrentSeason(LocalDate date) {
        int month = date.getMonthValue();
        if (month == 1 || month >= 10) {
            return "Fall";
        }
        if (month <= 5) {
            return "Spring";
        }
        return "Summer";
    }

    /**
     * January belongs to Fall of the previous calendar year (e.g. 2026-01-18 → 2025).
     */
    public static int deriveCurrentYear(LocalDate date) {
        if (date.getMonthValue() == 1) {
            return date.getYear() - 1;
        }
        return date.getYear();
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

    public static boolean isValidSeason(String season) {
        return season != null && VALID_SEASONS.contains(normalize(season));
    }

    public static String requireValidSeason(String season) {
        String normalized = normalize(season);
        if (normalized == null || normalized.isBlank() || !VALID_SEASONS.contains(normalized)) {
            throw new BusinessException(
                    "Season must be Spring, Summer, or Fall.",
                    HttpStatus.BAD_REQUEST) {};
        }
        return normalized;
    }
}
