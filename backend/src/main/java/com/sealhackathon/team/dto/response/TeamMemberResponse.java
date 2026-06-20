package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.TeamMemberRole;
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
public class TeamMemberResponse {

    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private TeamMemberRole role;
    private LocalDateTime joinedAt;
}
