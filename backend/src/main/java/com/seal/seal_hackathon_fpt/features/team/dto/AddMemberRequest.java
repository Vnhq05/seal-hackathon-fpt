package com.seal.seal_hackathon_fpt.features.team.dto;

import lombok.Data;

@Data
public class AddMemberRequest {
    private Long userId;
    private Boolean isLeader;
}
