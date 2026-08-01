package com.sealhackathon.common.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sealhackathon.common.exception.BusinessException;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class SeasonUtilsTest {

    @ParameterizedTest
    @CsvSource({
            "2026-01-15, Fall",
            "2026-02-01, Spring",
            "2026-05-31, Spring",
            "2026-06-01, Summer",
            "2026-09-30, Summer",
            "2026-10-01, Fall",
            "2026-12-31, Fall"
    })
    void deriveCurrentSeason_mapsFptAcademicMonths(LocalDate date, String expected) {
        assertThat(SeasonUtils.deriveCurrentSeason(date)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
            "2026-01-18, 2025",
            "2026-02-01, 2026",
            "2025-10-01, 2025",
            "2025-12-31, 2025",
            "2026-06-15, 2026"
    })
    void deriveCurrentYear_januaryBelongsToPreviousFallYear(LocalDate date, int expectedYear) {
        assertThat(SeasonUtils.deriveCurrentYear(date)).isEqualTo(expectedYear);
    }

    @Test
    void normalize_mapsWinterAndAutumnToFall() {
        assertThat(SeasonUtils.normalize("Winter")).isEqualTo("Fall");
        assertThat(SeasonUtils.normalize("winter")).isEqualTo("Fall");
        assertThat(SeasonUtils.normalize("autumn")).isEqualTo("Fall");
        assertThat(SeasonUtils.normalize("SPRING")).isEqualTo("Spring");
    }

    @Test
    void requireValidSeason_acceptsCanonicalAndAliases() {
        assertThat(SeasonUtils.requireValidSeason("spring")).isEqualTo("Spring");
        assertThat(SeasonUtils.requireValidSeason("Winter")).isEqualTo("Fall");
    }

    @Test
    void requireValidSeason_rejectsUnknown() {
        assertThatThrownBy(() -> SeasonUtils.requireValidSeason("Monsoon"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Spring, Summer, or Fall");
    }

    @Test
    void isValidSeason_whitelist() {
        assertThat(SeasonUtils.isValidSeason("Fall")).isTrue();
        assertThat(SeasonUtils.isValidSeason("Winter")).isTrue();
        assertThat(SeasonUtils.isValidSeason("Monsoon")).isFalse();
    }
}
