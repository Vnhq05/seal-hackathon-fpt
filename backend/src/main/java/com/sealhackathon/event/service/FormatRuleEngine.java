package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FormatRuleEngine {

    @Value("${app.hackathon.seal.max-tracks:3}")
    private int sealMaxTracks;

    @Value("${app.hackathon.seal.max-teams-per-track:8}")
    private int sealMaxTeamsPerTrack;

    @Value("${app.hackathon.seal.finalist-count:6}")
    private int sealFinalistCount;

    @Value("${app.hackathon.seal.top-per-track:2}")
    private int sealTopPerTrack;

    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TeamRepository teamRepository;
    @Lazy
    private final EventService eventService;

    public int getSealMaxTracks() {
        return sealMaxTracks;
    }

    public int getSealMaxTeamsPerTrack() {
        return sealMaxTeamsPerTrack;
    }

    public int getSealFinalistCount() {
        return sealFinalistCount;
    }

    public int getSealTopPerTrack() {
        return sealTopPerTrack;
    }

    public CompetitionFormat getFormat(UUID eventId) {
        return eventRepository.findById(eventId)
                .map(HackathonEvent::getCompetitionFormat)
                .orElse(CompetitionFormat.GENERIC);
    }

    public boolean isSealFormat(UUID eventId) {
        return getFormat(eventId) == CompetitionFormat.SEAL_RAG_2026;
    }

    public void validateTrackCapacity(UUID eventId, UUID trackId) {
        if (!isSealFormat(eventId)) {
            return;
        }
        var track = trackRepository.findById(trackId)
                .orElseThrow(() -> new BusinessException("Track not found", HttpStatus.NOT_FOUND));
        long count = teamRepository.countByEventIdAndTrackId(eventId, trackId);
        int max = track.getMaxTeams() != null ? track.getMaxTeams() : sealMaxTeamsPerTrack;
        if (count >= max) {
            throw new BusinessException(
                    "Track '" + track.getName() + "' is full (max " + max + " teams)",
                    HttpStatus.CONFLICT);
        }
    }

    public void validateLeaderCannotSelectTrack(UUID eventId) {
        if (isSealFormat(eventId)) {
            throw new BusinessException(
                    "Track assignment for SEAL events is managed by coordinators. Contact BTC.",
                    HttpStatus.FORBIDDEN);
        }
    }

    public boolean canCreateTeam(EventStatus status) {
        return status == EventStatus.OPEN || status == EventStatus.UPCOMING;
    }

    public boolean canModifyTeamMembers(EventStatus status) {
        return status == EventStatus.OPEN || status == EventStatus.UPCOMING;
    }

    public boolean canModifyTeamMembersResolved(EventStatus persisted, EventStatus resolved) {
        if (persisted == EventStatus.CLOSED_REGISTRATION) {
            return false;
        }
        return canModifyTeamMembers(resolved);
    }

    public boolean canSubmit(EventStatus status) {
        return status == EventStatus.ACTIVE;
    }

    public boolean canScore(EventStatus status) {
        return status == EventStatus.ACTIVE || status == EventStatus.SCORING;
    }

    public boolean canViewPublishedResults(EventStatus status) {
        return status == EventStatus.COMPLETED || status == EventStatus.SCORING;
    }

    public void assertCanCreateTeam(UUID eventId) {
        HackathonEvent event = getEvent(eventId);
        EventStatus resolved = eventService.resolveStatus(event);
        if (resolved == EventStatus.CANCELLED || resolved == EventStatus.COMPLETED) {
            throw new BusinessException("Event is not open for team formation", HttpStatus.BAD_REQUEST);
        }
        if (!canCreateTeam(resolved)) {
            throw new BusinessException("Event is not open for team formation", HttpStatus.BAD_REQUEST);
        }
    }

    public void assertCanModifyTeamMembers(UUID eventId) {
        HackathonEvent event = getEvent(eventId);
        EventStatus persisted = event.getStatus();
        EventStatus resolved = eventService.resolveStatus(event);
        if (resolved == EventStatus.CANCELLED || resolved == EventStatus.COMPLETED) {
            throw new BusinessException("Team member changes are not allowed in the current event phase",
                    HttpStatus.BAD_REQUEST);
        }
        if (!canModifyTeamMembersResolved(persisted, resolved)) {
            throw new BusinessException("Team member changes are not allowed in the current event phase",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private HackathonEvent getEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }
}
