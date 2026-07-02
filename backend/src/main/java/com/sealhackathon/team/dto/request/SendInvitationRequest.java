package com.sealhackathon.team.dto.request;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendInvitationRequest {

    @Email(message = "Must be a valid email")
    private String inviteeEmail;

    private UUID inviteeUserId;
}
