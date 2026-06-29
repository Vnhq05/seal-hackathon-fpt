package com.sealhackathon.common.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmailDomainValidatorTest {

    @Test
    void shouldMatchExactDomain() {
        assertThat(EmailDomainValidator.matchesAllowedDomain(
                "student@hcmut.edu.vn", List.of("hcmut.edu.vn"))).isTrue();
    }

    @Test
    void shouldMatchSubdomain() {
        assertThat(EmailDomainValidator.matchesAllowedDomain(
                "alice@student.hcmus.edu.vn", List.of("hcmus.edu.vn"))).isTrue();
    }

    @Test
    void shouldRejectUnknownDomain() {
        assertThat(EmailDomainValidator.matchesAllowedDomain(
                "user@gmail.com", List.of("hcmut.edu.vn"))).isFalse();
    }

    @Test
    void shouldNormalizeRuleWithAtPrefix() {
        assertThat(EmailDomainValidator.normalizeRuleDomain("@uit.edu.vn")).isEqualTo("uit.edu.vn");
    }
}
