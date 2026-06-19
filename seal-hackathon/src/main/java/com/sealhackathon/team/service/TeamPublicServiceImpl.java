package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamPublicServiceImpl implements TeamPublicService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentorTeamRepository mentorTeamRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<TeamSnapshot> getTeam(UUID teamId) {
        return teamRepository.findById(teamId).map(this::toSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TeamSnapshot> getTeamByParticipantAndEvent(UUID userId, UUID eventId) {
        return teamMemberRepository.findTeamIdByUserIdAndEventId(userId, eventId)
                .flatMap(teamId -> teamRepository.findById(teamId).map(this::toSnapshot));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTeamLeader(UUID userId, UUID teamId) {
        return teamRepository.findById(teamId)
                .map(team -> team.getLeaderId().equals(userId))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTeamMember(UUID userId, UUID teamId) {
        return teamMemberRepository.existsByTeamIdAndUserId(teamId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isMentorOfTeam(UUID mentorId, UUID teamId) {
        return mentorTeamRepository.isMentorOfTeam(mentorId, teamId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamSnapshot> getTeamsByEvent(UUID eventId) {
        return teamRepository.findByEventId(eventId).stream()
                .map(this::toSnapshot)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamSnapshot> getTeamsByMentor(UUID mentorId, UUID eventId) {
        return mentorTeamRepository.findByMentorUserIdAndEventId(mentorId, eventId).stream()
                .map(mt -> toSnapshot(mt.getTeam()))
                .toList();
    }

    private TeamSnapshot toSnapshot(Team team) {
        int memberCount = teamMemberRepository.countByTeamId(team.getId());
        return TeamSnapshot.builder()
                .id(team.getId())
                .eventId(team.getEventId())
                .name(team.getName())
                .leaderId(team.getLeaderId())
                .status(team.getStatus())
                .memberCount(memberCount)
                .build();
    }
}
