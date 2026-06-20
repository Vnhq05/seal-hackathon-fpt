package com.sealhackathon.team.dto.snapshot;

import com.sealhackathon.team.domain.enums.TeamStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamSnapshot {

    private UUID id;
    private UUID eventId;
    private String name;
    private UUID leaderId;
    private TeamStatus status;
    private int memberCount;
}
