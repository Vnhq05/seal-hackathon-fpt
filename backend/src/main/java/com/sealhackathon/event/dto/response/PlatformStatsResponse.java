package com.sealhackathon.event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PlatformStatsResponse {
    private final long activeEventCount;
    private final long registeredUserCount;
    private final long teamCount;
}
