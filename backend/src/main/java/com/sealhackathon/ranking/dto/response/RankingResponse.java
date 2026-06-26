package com.sealhackathon.ranking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingResponse {

    private UUID id;
    private UUID teamId;
    private String teamName;
    private UUID roundId;
    private String roundName;
    private UUID trackId;
    private String trackName;
    private BigDecimal finalScore;
    private Integer rank;
    private Integer version;
    private LocalDateTime calculatedAt;
}
