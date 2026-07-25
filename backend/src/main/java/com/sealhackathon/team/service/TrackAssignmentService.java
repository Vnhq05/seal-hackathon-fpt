package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TrackAssignmentMethod;
import com.sealhackathon.team.dto.request.TrackAssignRequest;
import com.sealhackathon.team.dto.response.TrackAssignmentResponse;
import com.sealhackathon.team.dto.response.TrackDrawResultResponse;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrackAssignmentService {

    private final TeamRepository teamRepository;
    private final TrackRepository trackRepository;
    private final HackathonEventRepository eventRepository;
    private final FormatRuleEngine formatRuleEngine;
    private final GroupAssignmentService groupAssignmentService;

    @Transactional
    public List<TrackAssignmentResponse> assignTracks(UUID eventId, UUID assignedBy, TrackAssignRequest request) {
        ensureEventExists(eventId);
        List<TrackAssignmentResponse> results = new ArrayList<>();
        for (TrackAssignRequest.Assignment a : request.getAssignments()) {
            results.add(assignOne(eventId, assignedBy, a.getTeamId(), a.getTrackId(), TrackAssignmentMethod.MANUAL));
        }
        return results;
    }

    @Transactional
    public TrackDrawResultResponse drawTracks(UUID eventId, UUID assignedBy) {
        ensureEventExists(eventId);
        List<Team> unassigned = teamRepository.findByEventIdAndTrackIdIsNull(eventId);
        if (unassigned.isEmpty()) {
            return TrackDrawResultResponse.builder()
                    .assignments(List.of())
                    .unassignedCount(0)
                    .build();
        }

        List<Track> tracks = trackRepository.findByHackathonEventId(eventId);
        if (tracks.isEmpty()) {
            throw new BusinessException("Event has no tracks configured", HttpStatus.BAD_REQUEST);
        }

        Collections.shuffle(unassigned);
        List<TrackAssignmentResponse> results = new ArrayList<>();
        int trackIndex = 0;

        // Round-robin across tracks — no per-track capacity limit.
        for (Team team : unassigned) {
            Track track = tracks.get(trackIndex % tracks.size());
            results.add(assignOne(eventId, assignedBy, team.getId(), track.getId(), TrackAssignmentMethod.RANDOM));
            trackIndex++;
        }

        int stillUnassigned = teamRepository.findByEventIdAndTrackIdIsNull(eventId).size();
        return TrackDrawResultResponse.builder()
                .assignments(results)
                .unassignedCount(stillUnassigned)
                .build();
    }

    private TrackAssignmentResponse assignOne(UUID eventId, UUID assignedBy, UUID teamId, UUID trackId,
                                               TrackAssignmentMethod method) {
        return assignOneInternal(eventId, assignedBy, teamId, trackId, method);
    }

    public TrackAssignmentResponse assignOneInternal(UUID eventId, UUID assignedBy, UUID teamId, UUID trackId,
                                               TrackAssignmentMethod method) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST);
        }

        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Track does not belong to this event", HttpStatus.BAD_REQUEST);
        }
        if (track.getStatus() == com.sealhackathon.event.domain.enums.TrackStatus.LOCKED) {
            throw new BusinessException("Track '" + track.getName() + "' is locked", HttpStatus.CONFLICT);
        }

        UUID currentTrackId = team.getTrackId();
        if (currentTrackId != null) {
            if (currentTrackId.equals(trackId)) {
                return TrackAssignmentResponse.builder()
                        .teamId(teamId)
                        .trackId(trackId)
                        .trackName(track.getName())
                        .method(team.getTrackAssignmentMethod() != null
                                ? team.getTrackAssignmentMethod()
                                : method)
                        .build();
            }
            // Coordinators may reassign via MANUAL; draw/self-draw still reject already-assigned teams.
            if (method != TrackAssignmentMethod.MANUAL) {
                throw new BusinessException("Team already has a track assigned", HttpStatus.CONFLICT);
            }
        }

        formatRuleEngine.validateTrackCapacity(eventId, trackId);

        if (currentTrackId != null) {
            team.setGroupId(null);
        }
        team.setTrackId(trackId);
        team.setTrackAssignedAt(LocalDateTime.now());
        team.setTrackAssignmentMethod(method);
        team.setTrackAssignedBy(assignedBy);
        groupAssignmentService.autoAssignGroup(team);
        teamRepository.save(team);

        return TrackAssignmentResponse.builder()
                .teamId(teamId)
                .trackId(trackId)
                .trackName(track.getName())
                .method(method)
                .build();
    }

    private void ensureEventExists(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }
}
