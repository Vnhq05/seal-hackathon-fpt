package com.sealhackathon.event.domain.enums;

/**
 * How teams advance from a round to the next phase.
 */
public enum AdvancementRule {
    /** Generic hackathon: top N teams overall. */
    GLOBAL_TOP_N,
    /** SEAL preliminary: top N teams within each track. */
    PER_TRACK_TOP_N,
    /** SEAL final round: finalist pool size (display only, no advancement). */
    FINALIST_POOL,
    /** No advancement from this round. */
    NONE
}
