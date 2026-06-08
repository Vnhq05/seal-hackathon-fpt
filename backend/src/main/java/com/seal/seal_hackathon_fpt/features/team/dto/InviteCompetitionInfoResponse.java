package com.seal.seal_hackathon_fpt.features.team.dto;

import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class InviteCompetitionInfoResponse {
    private Team team;
    private Competition competition;
    private String inviteEmail;
    private String inviteStatus;
}