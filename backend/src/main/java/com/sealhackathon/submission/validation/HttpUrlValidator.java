package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;

/**
 * Validates that a string is a non-blank http(s) URL. No host whitelist.
 */
@Component
public class HttpUrlValidator {

    public void validate(String url, String fieldLabel) {
        if (url == null || url.isBlank()) {
            throw new BusinessException(fieldLabel + " is required", HttpStatus.BAD_REQUEST) {};
        }

        try {
            URI uri = URI.create(url.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();

            if (scheme == null || host == null) {
                throw new BusinessException(fieldLabel + " is not a valid URL", HttpStatus.BAD_REQUEST) {};
            }

            if (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) {
                throw new BusinessException(
                        fieldLabel + " must start with http:// or https://",
                        HttpStatus.BAD_REQUEST) {};
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException(fieldLabel + " is not a valid URL", HttpStatus.BAD_REQUEST) {};
        }
    }
}
