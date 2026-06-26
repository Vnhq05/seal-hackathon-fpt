package com.sealhackathon.judging.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeamAssignmentsRequest {

    @NotNull
    private UUID eventId;

    @NotNull
    private UUID roundId;

    @NotNull
    private UUID teamId;

    @NotNull
    @Size(min = 3, max = 3, message = "Exactly 3 judges must be assigned")
    private List<UUID> judgeUserIds;
}
