package com.sealhackathon.team.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SendMentorInvitationRequest {

    @NotNull
    private UUID teamId;

    @NotNull
    private UUID mentorUserId;

    private String message;
}
