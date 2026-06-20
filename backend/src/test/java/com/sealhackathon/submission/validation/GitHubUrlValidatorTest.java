package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GitHubUrlValidatorTest {

    private final GitHubUrlValidator validator = new GitHubUrlValidator();

    @ParameterizedTest
    @ValueSource(strings = {
            "https://github.com/user/repo",
            "https://github.com/user/repo/",
            "https://github.com/my-org/my_repo",
            "https://github.com/user123/project.name"
    })
    void shouldAcceptValidGitHubUrls(String url) {
        assertThatNoException().isThrownBy(() -> validator.validate(url));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://github.com/user/repo",
            "https://gitlab.com/user/repo",
            "https://github.com/user",
            "https://github.com/",
            "github.com/user/repo",
            "not-a-url"
    })
    void shouldRejectInvalidUrls(String url) {
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
