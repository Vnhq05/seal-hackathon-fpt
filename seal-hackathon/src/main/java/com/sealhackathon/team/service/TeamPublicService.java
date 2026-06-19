package com.sealhackathon.team.service;

import com.sealhackathon.team.dto.snapshot.TeamSnapshot;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamPublicService {

    Optional<TeamSnapshot> getTeam(UUID teamId);

    Optional<TeamSnapshot> getTeamByParticipantAndEvent(UUID userId, UUID eventId);

    boolean isTeamLeader(UUID userId, UUID teamId);

    boolean isTeamMember(UUID userId, UUID teamId);

    boolean isMentorOfTeam(UUID mentorId, UUID teamId);

    List<TeamSnapshot> getTeamsByEvent(UUID eventId);

    List<TeamSnapshot> getTeamsByMentor(UUID mentorId, UUID eventId);
}
