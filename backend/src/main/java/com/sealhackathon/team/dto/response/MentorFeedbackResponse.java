package com.sealhackathon.team.dto.response;

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
public class MentorFeedbackResponse {

    private UUID id;
    private UUID teamId;
    private UUID mentorUserId;
    private String subject;
    private String content;
    private LocalDateTime submittedAt;
}
