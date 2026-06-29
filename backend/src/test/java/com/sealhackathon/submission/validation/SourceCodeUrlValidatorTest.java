package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SourceCodeUrlValidatorTest {

    private final SourceCodeUrlValidator validator = new SourceCodeUrlValidator();

    @ParameterizedTest
    @ValueSource(strings = {
            "https://github.com/org/repo",
            "https://www.github.com/org/repo",
            "https://myorg.atlassian.net/browse/PROJ-1",
            "https://myorg.atlassian.net/wiki/spaces/DEV",
            "https://www.notion.so/myorg/Page-Title-abc123",
            "https://myorg.notion.site/docs"
    })
    void shouldAcceptAllowedSourceHosts(String url) {
        assertThatNoException().isThrownBy(() -> validator.validate(url));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://drive.google.com/file/d/abc123",
            "https://docs.google.com/document/d/abc123",
            "https://gitlab.com/org/repo",
            "not-a-url"
    })
    void shouldRejectBlockedOrUnsupportedUrls(String url) {
        assertThatThrownBy(() -> validator.validate(url))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldRejectNull() {
        assertThatThrownBy(() -> validator.validate(null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldRejectBlank() {
        assertThatThrownBy(() -> validator.validate("  "))
                .isInstanceOf(BusinessException.class);
    }
}
