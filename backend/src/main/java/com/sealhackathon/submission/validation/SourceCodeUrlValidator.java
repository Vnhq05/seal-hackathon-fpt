package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class SourceCodeUrlValidator {

    private static final Pattern GITHUB = Pattern.compile("^https?://(www\\.)?github\\.com/[\\w.-]+/[\\w.-]+/?.*$", Pattern.CASE_INSENSITIVE);
    private static final Set<String> BLOCKED_HOSTS = Set.of("drive.google.com", "docs.google.com");

    public void validate(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException("Source code URL is required", HttpStatus.BAD_REQUEST);
        }
        String trimmed = url.trim();
        try {
            URI uri = URI.create(trimmed);
            String host = uri.getHost();
            if (host != null) {
                String lowerHost = host.toLowerCase();
                if (BLOCKED_HOSTS.contains(lowerHost)) {
                    throw new BusinessException(
                            "Google Drive cannot be used as source code repository",
                            HttpStatus.BAD_REQUEST);
                }
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Invalid source code URL", HttpStatus.BAD_REQUEST);
        }
        if (!GITHUB.matcher(trimmed).matches()
                && !trimmed.contains("atlassian.net")
                && !trimmed.contains("confluence")
                && !trimmed.contains("notion.so")
                && !trimmed.contains("notion.site")) {
            throw new BusinessException(
                    "Source URL must be GitHub, Jira, Confluence, or Notion",
                    HttpStatus.BAD_REQUEST);
        }
    }
}
