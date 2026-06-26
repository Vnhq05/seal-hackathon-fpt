package com.sealhackathon.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigResponse {

    private UUID id;
    private Integer minTeamMembers;
    private Integer maxTeamMembers;
    private String defaultRules;
    private Integer minTeams;
    private Integer maxTeams;
}
