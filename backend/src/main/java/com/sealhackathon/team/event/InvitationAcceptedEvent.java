package com.sealhackathon.team.event;

import java.util.UUID;

public record InvitationAcceptedEvent(
        UUID invitationId,
        UUID teamId,
        UUID leaderId,
        String teamName,
        String memberName) {}
