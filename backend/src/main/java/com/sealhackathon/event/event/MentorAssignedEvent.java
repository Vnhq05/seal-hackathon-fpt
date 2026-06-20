package com.sealhackathon.event.event;

import java.util.UUID;

public record MentorAssignedEvent(UUID assignmentId, UUID mentorId, UUID eventId) {}
