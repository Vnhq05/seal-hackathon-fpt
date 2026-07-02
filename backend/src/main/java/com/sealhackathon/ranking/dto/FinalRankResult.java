package com.sealhackathon.ranking.dto;

import com.sealhackathon.team.domain.enums.CompetitionOutcome;

public record FinalRankResult(Integer finalRank, CompetitionOutcome outcome) {
}
