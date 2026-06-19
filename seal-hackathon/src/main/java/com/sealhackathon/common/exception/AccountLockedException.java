package com.sealhackathon.common.exception;

import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class AccountLockedException extends BusinessException {

    public AccountLockedException(LocalDateTime lockedUntil) {
        super(String.format("Account is locked until %s due to too many failed login attempts.",
                lockedUntil.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))),
                HttpStatus.LOCKED);
    }
}
