package com.sealhackathon.team.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignMentorTeamRequest {

    @NotNull(message = "Mentor user ID is required")
    private UUID mentorUserId;

    @NotNull(message = "Team ID is required")
    private UUID teamId;
}
