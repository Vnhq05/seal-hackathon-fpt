package com.sealhackathon.event.dto.request;

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
public class AssignMentorRequest {

    @NotNull(message = "Mentor user ID is required")
    private UUID mentorUserId;
}
