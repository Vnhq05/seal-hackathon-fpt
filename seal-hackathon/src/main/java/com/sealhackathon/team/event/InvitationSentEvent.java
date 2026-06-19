package com.sealhackathon.team.event;

import java.util.UUID;

public record InvitationSentEvent(UUID invitationId, UUID teamId, String inviteeEmail) {}
