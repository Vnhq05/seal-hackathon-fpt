package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FormatRuleEngine {

    public static final int SEAL_MAX_TRACKS = 3;
    public static final int SEAL_MAX_TEAMS_PER_TRACK = 8;
    public static final int SEAL_FINALIST_COUNT = 6;
    public static final int SEAL_TOP_PER_TRACK = 2;

    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TeamRepository teamRepository;

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
        int max = track.getMaxTeams() != null ? track.getMaxTeams() : SEAL_MAX_TEAMS_PER_TRACK;
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

    public boolean canSubmit(EventStatus status) {
        return status == EventStatus.ACTIVE;
    }

    public boolean canScore(EventStatus status) {
        return status == EventStatus.ACTIVE || status == EventStatus.SCORING;
    }

    public boolean canViewPublishedResults(EventStatus status) {
        return status == EventStatus.COMPLETED || status == EventStatus.SCORING;
    }
}
