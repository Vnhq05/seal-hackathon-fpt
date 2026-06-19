package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Set;

@Component
public class DemoUrlWhitelistValidator {

    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "youtube.com", "www.youtube.com", "youtu.be",
            "vimeo.com", "www.vimeo.com",
            "drive.google.com",
            "loom.com", "www.loom.com"
    );

    public void validate(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException("Demo video URL is required", HttpStatus.BAD_REQUEST) {};
        }

        try {
            URI uri = URI.create(url.trim());
            String host = uri.getHost();
            if (host == null || ALLOWED_HOSTS.stream().noneMatch(host::equalsIgnoreCase)) {
                throw new BusinessException(
                        "Demo URL must be from an approved platform: YouTube, Vimeo, Google Drive, or Loom",
                        HttpStatus.BAD_REQUEST) {};
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Demo URL is not a valid URL", HttpStatus.BAD_REQUEST) {};
        }
    }
}
