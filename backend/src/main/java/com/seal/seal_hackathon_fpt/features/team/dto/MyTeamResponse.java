package com.seal.seal_hackathon_fpt.features.team.dto;

import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class MyTeamResponse {
    private Team team;
    private List<TeamMember> members;
    private boolean isLeader;
}