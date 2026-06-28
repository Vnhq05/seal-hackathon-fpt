package com.sealhackathon.ranking.dto.response;

import com.sealhackathon.event.domain.enums.PrizeRank;
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
public class TeamAwardResponse {

    private UUID id;
    private UUID eventId;
    private UUID teamId;
    private String teamName;
    private UUID prizeId;
    private PrizeRank prizeRank;
    private String prizeLabel;
    private String prizeValue;
    private LocalDateTime awardedAt;
}
