package com.sealhackathon.common.exception;

import org.springframework.http.HttpStatus;

public class AccountNotActivatedException extends BusinessException {

    public AccountNotActivatedException() {
        super("Account is not activated. Please wait for admin approval.", HttpStatus.FORBIDDEN);
    }
}
