package com.seal.seal_hackathon_fpt.features.team.dto;

import lombok.Data;

@Data
public class CreateTeamRequest {
    private Long competitionId;
    private String name;
}
