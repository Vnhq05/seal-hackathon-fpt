package com.sealhackathon.team.event;

import com.sealhackathon.team.domain.enums.TeamMemberRole;

import java.util.UUID;

public record MemberJoinedEvent(UUID teamId, UUID userId, TeamMemberRole role) {}
