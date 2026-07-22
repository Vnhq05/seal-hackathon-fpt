package com.sealhackathon.event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Public-safe staff member (judge/mentor) — name only, no email.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventStaffPublicResponse {

    private UUID id;
    private String fullName;
}
