package com.sealhackathon.event.domain.enums;

/**
 * How a prize is awarded when publishing results.
 * FIRST/SECOND/THIRD are always treated as RANK_BASED.
 * Additional (CONSOLATION) prizes may be RANK_BASED (encouragement by finish order)
 * or MANUAL (special awards picked by staff).
 */
public enum PrizeAssignmentMode {
    RANK_BASED,
    MANUAL
}
