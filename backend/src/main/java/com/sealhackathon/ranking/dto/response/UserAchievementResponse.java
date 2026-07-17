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
public class UserAchievementResponse {

    private UUID id;
    private String type;
    private UUID eventId;
    private String eventName;
    private UUID teamId;
    private String teamName;
    private PrizeRank prizeRank;
    private String title;
    private String description;
    private LocalDateTime achievedAt;
}
