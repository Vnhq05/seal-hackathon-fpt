package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.TrackDrawQueueItem;
import com.sealhackathon.event.domain.TrackDrawSession;
import com.sealhackathon.event.domain.enums.DrawSessionStatus;
import com.sealhackathon.event.domain.enums.TrackStatus;
import com.sealhackathon.event.dto.request.OpenTrackDrawSessionRequest;
import com.sealhackathon.event.dto.response.AvailableTrackSlotResponse;
import com.sealhackathon.event.dto.response.TrackDrawSessionResponse;
import com.sealhackathon.event.dto.response.TrackLockResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackDrawSessionRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TrackAssignmentMethod;
import com.sealhackathon.team.dto.request.SelfDrawTrackRequest;
import com.sealhackathon.team.dto.response.TrackAssignmentResponse;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.team.service.TrackAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrackDrawSessionService {

    private final TrackDrawSessionRepository sessionRepository;
    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TeamRepository teamRepository;
    private final TrackAssignmentService trackAssignmentService;
    private final FormatRuleEngine formatRuleEngine;
    private final TeamPublicService teamPublicService;

    @Transactional
    public TrackDrawSessionResponse openDrawSession(UUID eventId, UUID openedBy,
                                                     OpenTrackDrawSessionRequest request) {
        ensureSealFormat(eventId);
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        sessionRepository.findByEventIdAndStatusWithQueue(eventId, DrawSessionStatus.OPEN)
                .ifPresent(s -> {
                    throw new BusinessException("A track draw session is already open", HttpStatus.CONFLICT);
                });

        List<Team> unassigned = teamRepository.findByEventIdAndTrackIdIsNull(eventId);
        if (unassigned.isEmpty()) {
            throw new BusinessException("All teams already have tracks assigned", HttpStatus.BAD_REQUEST);
        }

        List<UUID> drawOrder = resolveDrawOrder(unassigned, request != null ? request.getDrawOrder() : null);

        TrackDrawSession session = TrackDrawSession.builder()
                .eventId(eventId)
                .status(DrawSessionStatus.OPEN)
                .currentIndex(0)
                .scheduledAt(request != null ? request.getScheduledAt() : null)
                .openedAt(LocalDateTime.now())
                .openedBy(openedBy)
                .build();

        for (int i = 0; i < drawOrder.size(); i++) {
            session.getQueue().add(TrackDrawQueueItem.builder()
                    .session(session)
                    .teamId(drawOrder.get(i))
                    .queueOrder(i)
                    .build());
        }

        return toResponse(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public TrackDrawSessionResponse getDrawSession(UUID eventId) {
        TrackDrawSession session = sessionRepository.findByEventIdWithQueue(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("TrackDrawSession", "eventId", eventId));
        return toResponse(session);
    }

    @Transactional
    public TrackAssignmentResponse selfDrawTrack(UUID eventId, UUID teamId, UUID leaderId,
                                                  SelfDrawTrackRequest request) {
        ensureSealFormat(eventId);

        if (!teamPublicService.isTeamLeader(leaderId, teamId)) {
            throw new BusinessException("Only the team leader can draw a track", HttpStatus.FORBIDDEN);
        }

        TrackDrawSession session = sessionRepository.findByEventIdAndStatusWithQueue(eventId, DrawSessionStatus.OPEN)
                .orElseThrow(() -> new BusinessException(
                        "Track draw session is not open", HttpStatus.BAD_REQUEST));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST);
        }
        if (team.getTrackId() != null) {
            throw new BusinessException("Team already has a track assigned", HttpStatus.CONFLICT);
        }

        if (session.getCurrentIndex() >= session.getQueue().size()) {
            throw new BusinessException("Track draw session is complete", HttpStatus.BAD_REQUEST);
        }

        TrackDrawQueueItem current = session.getQueue().stream()
                .filter(q -> q.getQueueOrder().equals(session.getCurrentIndex()))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Invalid draw queue state", HttpStatus.INTERNAL_SERVER_ERROR));

        if (!current.getTeamId().equals(teamId)) {
            throw new BusinessException("It is not this team's turn to draw", HttpStatus.FORBIDDEN);
        }

        Track track = trackRepository.findById(request.getTrackId())
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", request.getTrackId()));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Track does not belong to this event", HttpStatus.BAD_REQUEST);
        }
        if (track.getStatus() == TrackStatus.LOCKED) {
            throw new BusinessException("Track '" + track.getName() + "' is locked", HttpStatus.CONFLICT);
        }

        TrackAssignmentResponse result = trackAssignmentService.assignOneInternal(
                eventId, leaderId, teamId, request.getTrackId(), TrackAssignmentMethod.SELF_DRAW);

        session.setCurrentIndex(session.getCurrentIndex() + 1);
        if (session.getCurrentIndex() >= session.getQueue().size()) {
            session.setStatus(DrawSessionStatus.CLOSED);
        }
        sessionRepository.save(session);

        return result;
    }

    @Transactional
    public TrackLockResponse lockAllTracks(UUID eventId) {
        ensureSealFormat(eventId);
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        List<Track> tracks = trackRepository.findByHackathonEventId(eventId);
        for (Track track : tracks) {
            track.setStatus(TrackStatus.LOCKED);
        }
        trackRepository.saveAll(tracks);

        sessionRepository.findByEventIdAndStatusWithQueue(eventId, DrawSessionStatus.OPEN)
                .ifPresent(session -> {
                    session.setStatus(DrawSessionStatus.CLOSED);
                    sessionRepository.save(session);
                });

        return TrackLockResponse.builder().lockedTrackCount(tracks.size()).build();
    }

    private List<UUID> resolveDrawOrder(List<Team> unassigned, List<UUID> requestedOrder) {
        if (requestedOrder != null && !requestedOrder.isEmpty()) {
            var unassignedIds = unassigned.stream().map(Team::getId).toList();
            for (UUID teamId : requestedOrder) {
                if (!unassignedIds.contains(teamId)) {
                    throw new BusinessException(
                            "Team " + teamId + " is not eligible for draw (already assigned or not in event)",
                            HttpStatus.BAD_REQUEST);
                }
            }
            if (requestedOrder.size() != unassigned.size()) {
                throw new BusinessException(
                        "Draw order must include all unassigned teams", HttpStatus.BAD_REQUEST);
            }
            return requestedOrder;
        }
        return unassigned.stream()
                .sorted(Comparator.comparing(Team::getCreatedAt))
                .map(Team::getId)
                .toList();
    }

    private TrackDrawSessionResponse toResponse(TrackDrawSession session) {
        UUID currentTeamId = null;
        String currentTeamName = null;
        if (session.getStatus() == DrawSessionStatus.OPEN
                && session.getCurrentIndex() < session.getQueue().size()) {
            currentTeamId = session.getQueue().stream()
                    .filter(q -> q.getQueueOrder().equals(session.getCurrentIndex()))
                    .map(TrackDrawQueueItem::getTeamId)
                    .findFirst()
                    .orElse(null);
            if (currentTeamId != null) {
                currentTeamName = teamPublicService.getTeam(currentTeamId)
                        .map(t -> t.getName())
                        .orElse(null);
            }
        }

        return TrackDrawSessionResponse.builder()
                .sessionId(session.getId())
                .eventId(session.getEventId())
                .status(session.getStatus())
                .currentTeamId(currentTeamId)
                .currentTeamName(currentTeamName)
                .currentIndex(session.getCurrentIndex())
                .totalTeams(session.getQueue().size())
                .scheduledAt(session.getScheduledAt())
                .openedAt(session.getOpenedAt())
                .availableTracks(buildAvailableTracks(session.getEventId()))
                .build();
    }

    private List<AvailableTrackSlotResponse> buildAvailableTracks(UUID eventId) {
        List<AvailableTrackSlotResponse> slots = new ArrayList<>();
        for (Track track : trackRepository.findByHackathonEventId(eventId)) {
            int max = track.getMaxTeams() != null ? track.getMaxTeams() : formatRuleEngine.getSealMaxTeamsPerTrack();
            long current = teamRepository.countByEventIdAndTrackId(eventId, track.getId());
            slots.add(AvailableTrackSlotResponse.builder()
                    .trackId(track.getId())
                    .name(track.getName())
                    .status(track.getStatus())
                    .remainingSlots((int) Math.max(0, max - current))
                    .build());
        }
        return slots;
    }

    private void ensureSealFormat(UUID eventId) {
        if (!formatRuleEngine.isSealFormat(eventId)) {
            throw new BusinessException(
                    "Track draw session is only available for SEAL format events",
                    HttpStatus.BAD_REQUEST);
        }
    }
}
