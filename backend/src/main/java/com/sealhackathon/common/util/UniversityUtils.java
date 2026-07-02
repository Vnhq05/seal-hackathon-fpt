package com.sealhackathon.common.util;

import com.sealhackathon.common.enums.UserType;

public final class UniversityUtils {

    public static final String FPT_UNIVERSITY_NAME = "FPT University";

    private UniversityUtils() {}

    public static String resolveUniversityName(UserType userType, String universityName) {
        if (universityName != null && !universityName.isBlank()) {
            return universityName.trim();
        }
        if (userType == UserType.FPT_STUDENT) {
            return FPT_UNIVERSITY_NAME;
        }
        return null;
    }
}
