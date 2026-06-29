package com.sealhackathon.feedback.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantFeedbackSummaryResponse {

    private UUID eventId;
    private long totalCount;
    private Double averageRating;
    private Map<String, Integer> ratingDistribution;
}
