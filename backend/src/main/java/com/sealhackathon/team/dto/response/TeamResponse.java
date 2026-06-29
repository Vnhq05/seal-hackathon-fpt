package com.sealhackathon.team.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
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
    private UUID trackId;
    private int memberCount;
    private int minTeamMembers;
    private int maxTeamMembers;
    private boolean canSelectTrack;
    private List<TeamMemberResponse> members;
    private LocalDateTime createdAt;
    @Getter(onMethod_ = {@JsonProperty("isRecruiting")})
    private boolean isRecruiting;
    private String recruitmentNote;
    private List<HackathonSkillRole> neededRoles;
}
