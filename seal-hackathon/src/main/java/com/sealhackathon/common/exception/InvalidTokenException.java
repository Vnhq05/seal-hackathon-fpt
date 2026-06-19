package com.sealhackathon.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidTokenException extends BusinessException {

    public InvalidTokenException() {
        super("Token is invalid or has expired", HttpStatus.UNAUTHORIZED);
    }
}
