package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.JoinRequestStatus;
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
public class TeamJoinRequestResponse {

    private UUID id;
    private UUID teamId;
    private String teamName;
    private UUID eventId;
    private UUID requesterId;
    private String requesterFullName;
    private String requesterEmail;
    private JoinRequestStatus status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
