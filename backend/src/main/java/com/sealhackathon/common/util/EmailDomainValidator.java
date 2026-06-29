package com.sealhackathon.common.util;

import java.util.Collection;
import java.util.Locale;

public final class EmailDomainValidator {

    private EmailDomainValidator() {}

    public static String extractDomain(String email) {
        if (email == null || !email.contains("@")) {
            return "";
        }
        return email.substring(email.indexOf('@') + 1).trim().toLowerCase(Locale.ROOT);
    }

    public static String normalizeRuleDomain(String domain) {
        if (domain == null) {
            return "";
        }
        String normalized = domain.trim().toLowerCase(Locale.ROOT);
        if (normalized.startsWith("@")) {
            normalized = normalized.substring(1);
        }
        return normalized;
    }

    public static boolean matchesAllowedDomain(String email, Collection<String> allowedDomains) {
        String emailDomain = extractDomain(email);
        if (emailDomain.isEmpty() || allowedDomains == null || allowedDomains.isEmpty()) {
            return false;
        }
        for (String rule : allowedDomains) {
            String normalizedRule = normalizeRuleDomain(rule);
            if (normalizedRule.isEmpty()) {
                continue;
            }
            if (emailDomain.equals(normalizedRule) || emailDomain.endsWith("." + normalizedRule)) {
                return true;
            }
        }
        return false;
    }
}
