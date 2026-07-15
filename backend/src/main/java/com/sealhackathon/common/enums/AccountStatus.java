package com.sealhackathon.common.enums;

public enum AccountStatus {

    PENDING,
    ACTIVE,
    REJECTED,
    LOCKED,
    /** Soft-deleted; row retained for audit/FK UUID refs. Not reusable for login. */
    DELETED
}
