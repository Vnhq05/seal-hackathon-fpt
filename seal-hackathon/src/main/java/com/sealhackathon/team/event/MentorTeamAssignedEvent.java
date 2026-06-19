package com.sealhackathon.team.event;

import java.util.UUID;

public record MentorTeamAssignedEvent(UUID mentorId, UUID teamId) {}
