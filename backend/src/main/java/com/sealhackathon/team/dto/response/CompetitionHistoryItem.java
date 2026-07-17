package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.CompetitionOutcome;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionHistoryItem {

    private UUID eventId;
    private String eventName;
    private String season;
    private Integer year;
    private String teamName;
    private Integer finalRank;
    private CompetitionOutcome outcome;
    private LocalDate achievedAt;
}
