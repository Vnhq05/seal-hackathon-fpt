package com.sealhackathon.team.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendInvitationRequest {

    @NotBlank(message = "Invitee email is required")
    @Email(message = "Must be a valid email")
    private String inviteeEmail;
}
