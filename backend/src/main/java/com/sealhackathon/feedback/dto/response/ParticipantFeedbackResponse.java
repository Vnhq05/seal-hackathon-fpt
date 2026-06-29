package com.sealhackathon.feedback.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParticipantFeedbackResponse {

    private UUID id;
    private UUID eventId;
    private UUID userId;
    private String userFullName;
    private UUID teamId;
    private String teamName;
    private int overallRating;
    private String comment;
    private LocalDateTime submittedAt;
}
