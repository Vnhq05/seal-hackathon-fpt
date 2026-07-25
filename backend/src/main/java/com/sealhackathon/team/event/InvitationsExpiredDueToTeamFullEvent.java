package com.sealhackathon.team.event;

import java.util.List;
import java.util.UUID;

/**
 * Fired when leftover PENDING invitations are expired because the team has no free slots left.
 */
public record InvitationsExpiredDueToTeamFullEvent(
        UUID teamId,
        String teamName,
        List<String> inviteeEmails) {}
