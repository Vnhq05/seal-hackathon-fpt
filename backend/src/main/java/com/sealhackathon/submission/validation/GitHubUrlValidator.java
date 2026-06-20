package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class GitHubUrlValidator {

    private static final Pattern GITHUB_REPO_PATTERN = Pattern.compile(
            "^https://github\\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/?$"
    );

    public void validate(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException("GitHub URL is required", HttpStatus.BAD_REQUEST) {};
        }
        if (!GITHUB_REPO_PATTERN.matcher(url.trim()).matches()) {
            throw new BusinessException(
                    "Invalid GitHub URL. Expected format: https://github.com/{owner}/{repo}",
                    HttpStatus.BAD_REQUEST) {};
        }
    }
}
