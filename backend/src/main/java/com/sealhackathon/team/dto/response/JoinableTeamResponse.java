package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinableTeamResponse {

    private UUID id;
    private String name;
    private UUID leaderId;
    private String leaderEmail;
    private String leaderFullName;
    private int memberCount;
    private int maxTeamMembers;
    private TeamStatus status;
}
