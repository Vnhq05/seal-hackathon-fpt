package com.sealhackathon.team.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinableTeamResponse {

    private UUID id;
    private String name;
    private UUID leaderId;
    private String leaderFullName;
    private int memberCount;
    private int maxTeamMembers;
    private TeamStatus status;
    @Getter(onMethod_ = {@JsonProperty("isRecruiting")})
    private boolean isRecruiting;
    private String recruitmentNote;
    private List<HackathonSkillRole> neededRoles;
}
