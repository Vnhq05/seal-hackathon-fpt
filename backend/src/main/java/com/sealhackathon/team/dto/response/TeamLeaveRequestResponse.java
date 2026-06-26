package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.LeaveRequestStatus;
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
public class TeamLeaveRequestResponse {

    private UUID id;
    private UUID teamId;
    private String teamName;
    private UUID eventId;
    private UUID userId;
    private String userFullName;
    private String userEmail;
    private LeaveRequestStatus status;
    private String reason;
    private LocalDateTime createdAt;
    private UUID resolvedBy;
    private LocalDateTime resolvedAt;
}
