package com.sealhackathon.ranking.dto.response;

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
public class FinalistResponse {

    private UUID id;
    private UUID eventId;
    private UUID teamId;
    private String teamName;
    private UUID trackId;
    private String trackName;
    private Integer preliminaryRank;
    private String selectedReason;
    private LocalDateTime selectedAt;
}
