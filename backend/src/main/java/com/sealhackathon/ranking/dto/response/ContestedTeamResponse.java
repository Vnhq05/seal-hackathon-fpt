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
public class ContestedTeamResponse {

    private UUID teamId;
    private String teamName;
    private BigDecimal finalScore;
    private LocalDateTime submittedAt;
}
