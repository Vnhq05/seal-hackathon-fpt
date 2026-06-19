package com.sealhackathon.ranking.dto.response;

import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvancementResponse {

    private UUID id;
    private UUID teamId;
    private String teamName;
    private UUID roundId;
    private AdvancementStatus status;
    private Integer rank;
    private java.math.BigDecimal finalScore;
}
