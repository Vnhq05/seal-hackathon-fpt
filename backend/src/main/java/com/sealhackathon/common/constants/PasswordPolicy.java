package com.sealhackathon.common.constants;

/**
 * Shared password length bounds for Jakarta {@code @Size} and frontend validation.
 * Values must stay compile-time constants so they can be referenced in annotation attributes.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;
    /** Bcrypt limit — longer input is truncated silently by some encoders. */
    public static final int MAX_LENGTH = 72;

    private PasswordPolicy() {}
}
