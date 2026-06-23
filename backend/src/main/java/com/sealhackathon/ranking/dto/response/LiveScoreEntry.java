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
public class LiveScoreEntry {

    private UUID teamId;
    private String teamName;
    private String trackName;
    private UUID trackId;
    private BigDecimal finalScore;
    private Integer rank;
    private Integer previousRank;
    private String scoreStatus;
    private Integer judgesScored;
    private Integer judgesAssigned;
    private LocalDateTime calculatedAt;
}
