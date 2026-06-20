package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DemoUrlWhitelistValidatorTest {

    private final DemoUrlWhitelistValidator validator = new DemoUrlWhitelistValidator();

    @ParameterizedTest
    @ValueSource(strings = {
            "https://youtube.com/watch?v=abc123",
            "https://www.youtube.com/watch?v=abc",
            "https://youtu.be/abc123",
            "https://vimeo.com/12345",
            "https://drive.google.com/file/d/abc123",
            "https://loom.com/share/abc",
            "https://seal-demo.vercel.app",
            "http://localhost:3000/demo",
            "https://example.com/demo"
    })
    void shouldAcceptValidHttpUrls(String url) {
        assertThatNoException().isThrownBy(() -> validator.validate(url));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "ftp://files.example.com/video",
            "not-a-url"
    })
    void shouldRejectNonHttpUrls(String url) {
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
        assertThatThrownBy(() -> validator.validate(""))
                .isInstanceOf(BusinessException.class);
    }
}
