package com.sealhackathon.ranking.dto.response;

import com.sealhackathon.ranking.domain.enums.DisputeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisputeResponse {

    private UUID id;
    private UUID teamId;
    private UUID roundId;
    private UUID filedBy;
    private String reason;
    private DisputeStatus status;
    private LocalDateTime filedAt;
    private LocalDateTime resolvedAt;
    private UUID resolvedBy;
    private String resolution;
}
