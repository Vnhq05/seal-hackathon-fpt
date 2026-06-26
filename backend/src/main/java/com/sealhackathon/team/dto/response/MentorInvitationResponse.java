package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.MentorInvitationStatus;
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
public class MentorInvitationResponse {

    private UUID id;
    private UUID teamId;
    private String teamName;
    private UUID eventId;
    private UUID mentorUserId;
    private String mentorEmail;
    private String mentorName;
    private MentorInvitationStatus status;
    private String message;
    private LocalDateTime createdAt;
}
