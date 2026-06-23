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
public class RankingEventDto {

    private String type;
    private UUID eventId;
    private UUID roundId;
    private UUID teamId;
    private String teamName;
    private Integer newRank;
    private Integer oldRank;
    private LocalDateTime timestamp;
}
