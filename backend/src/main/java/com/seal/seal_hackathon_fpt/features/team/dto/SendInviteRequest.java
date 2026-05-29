package com.seal.seal_hackathon_fpt.features.team.dto;

import lombok.Data;

@Data
public class SendInviteRequest {
    private Long teamId;
    private Long inviteeId;
}
