package com.sealhackathon.team.dto.request;

import com.sealhackathon.team.domain.enums.MentorInvitationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RespondMentorInvitationRequest {

    @NotNull
    private MentorInvitationStatus decision;
}
