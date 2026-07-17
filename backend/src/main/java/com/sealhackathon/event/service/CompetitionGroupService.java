package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.request.CreateCompetitionGroupRequest;
import com.sealhackathon.event.dto.request.DeactivateJudgeAssignmentRequest;
import com.sealhackathon.event.dto.request.ReplaceJudgeAssignmentRequest;
import com.sealhackathon.event.dto.response.CompetitionGroupResponse;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompetitionGroupService {

    private final CompetitionGroupRepository groupRepository;
    private final TrackRepository trackRepository;
    private final EventService eventService;
    private final TeamRepository teamRepository;
    private final JudgeAssignmentService judgeAssignmentService;

    @Transactional
    public CompetitionGroupResponse createGroup(UUID eventId, UUID trackId, CreateCompetitionGroupRequest request) {
        validateTrack(eventId, trackId);
        eventService.enforceEventOwnership(eventId);

        if (groupRepository.existsByTrackIdAndName(trackId, request.getName().trim())) {
            throw new DuplicateResourceException("CompetitionGroup", "track+name", trackId + "/" + request.getName());
        }

        CompetitionGroup group = CompetitionGroup.builder()
                .trackId(trackId)
                .name(request.getName().trim())
                .build();
        group = groupRepository.save(group);
        return toResponse(group);
    }

    @Transactional(readOnly = true)
    public List<CompetitionGroupResponse> listGroups(UUID eventId, UUID trackId) {
        validateTrack(eventId, trackId);
        return groupRepository.findByTrackIdOrderByNameAsc(trackId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteGroup(UUID eventId, UUID trackId, UUID groupId, String ipAddress) {
        validateTrack(eventId, trackId);
        eventService.enforceEventOwnership(eventId);

        CompetitionGroup group = groupRepository.findByIdAndTrackId(groupId, trackId)
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionGroup", "id", groupId));

        judgeAssignmentService.deactivateAssignmentsForDeletedGroup(groupId, ipAddress);

        // teams.group_id has no FK to lean on (see docs/adr-fk-policy.md), and a team left pointing
        // at a deleted group is worse than one with no group: it clears every != null guard yet
        // matches no judge assignment, so the team silently goes unjudged.
        List<Team> affectedTeams = teamRepository.findByGroupId(groupId);
        affectedTeams.forEach(team -> team.setGroupId(null));
        teamRepository.saveAll(affectedTeams);

        groupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public CompetitionGroup getGroupInTrack(UUID trackId, UUID groupId) {
        return groupRepository.findByIdAndTrackId(groupId, trackId)
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionGroup", "id", groupId));
    }

    private void validateTrack(UUID eventId, UUID trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Track does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
    }

    private CompetitionGroupResponse toResponse(CompetitionGroup group) {
        return CompetitionGroupResponse.builder()
                .id(group.getId())
                .trackId(group.getTrackId())
                .name(group.getName())
                .build();
    }
}
