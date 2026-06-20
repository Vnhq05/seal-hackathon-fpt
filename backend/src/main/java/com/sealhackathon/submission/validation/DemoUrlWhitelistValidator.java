package com.sealhackathon.submission.validation;

import com.sealhackathon.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;

@Component
public class DemoUrlWhitelistValidator {

    public void validate(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException("Demo URL is required", HttpStatus.BAD_REQUEST) {};
        }

        try {
            URI uri = URI.create(url.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();

            if (scheme == null || host == null) {
                throw new BusinessException("Demo URL is not a valid URL", HttpStatus.BAD_REQUEST) {};
            }

            if (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) {
                throw new BusinessException("Demo URL must start with http:// or https://", HttpStatus.BAD_REQUEST) {};
            }
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Demo URL is not a valid URL", HttpStatus.BAD_REQUEST) {};
        }
    }
}
