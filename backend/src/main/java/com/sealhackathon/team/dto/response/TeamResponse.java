package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {

    private UUID id;
    private UUID eventId;
    private String name;
    private UUID leaderId;
    private TeamStatus status;
    private int memberCount;
    private List<TeamMemberResponse> members;
    private LocalDateTime createdAt;
}
