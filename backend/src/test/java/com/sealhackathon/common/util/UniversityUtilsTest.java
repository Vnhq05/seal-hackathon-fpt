package com.sealhackathon.common.util;

import com.sealhackathon.common.enums.UserType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UniversityUtilsTest {

    @Test
    void resolveUniversityName_shouldDefaultFptStudentToFptUniversity() {
        assertThat(UniversityUtils.resolveUniversityName(UserType.FPT_STUDENT, null))
                .isEqualTo(UniversityUtils.FPT_UNIVERSITY_NAME);
        assertThat(UniversityUtils.resolveUniversityName(UserType.FPT_STUDENT, "  "))
                .isEqualTo(UniversityUtils.FPT_UNIVERSITY_NAME);
    }

    @Test
    void resolveUniversityName_shouldKeepExplicitValue() {
        assertThat(UniversityUtils.resolveUniversityName(UserType.FPT_STUDENT, " FPT University HCM "))
                .isEqualTo("FPT University HCM");
        assertThat(UniversityUtils.resolveUniversityName(UserType.EXTERNAL_STUDENT, "HCMUT"))
                .isEqualTo("HCMUT");
    }

    @Test
    void resolveUniversityName_shouldReturnNullForNonFptWithoutValue() {
        assertThat(UniversityUtils.resolveUniversityName(UserType.EXTERNAL_STUDENT, null))
                .isNull();
        assertThat(UniversityUtils.resolveUniversityName(UserType.LECTURER, null))
                .isNull();
    }
}
