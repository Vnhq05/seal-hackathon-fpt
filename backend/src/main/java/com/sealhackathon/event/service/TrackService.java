package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.TrackStatus;
import com.sealhackathon.event.dto.request.AssignTrackTopicRequest;
import com.sealhackathon.event.dto.request.CreateTrackRequest;
import com.sealhackathon.event.dto.response.TrackResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final HackathonEventRepository eventRepository;
    private final TeamRepository teamRepository;

    @Transactional
    public TrackResponse createTrack(UUID eventId, CreateTrackRequest request) {
        HackathonEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (trackRepository.existsByHackathonEventIdAndName(eventId, request.getName())) {
            throw new DuplicateResourceException("Track", "name", request.getName());
        }

        Track track = Track.builder()
                .hackathonEvent(event)
                .name(request.getName())
                .description(request.getDescription())
                .topic(request.getTopic())
                .maxTeams(request.getMaxTeams())
                .scoringTemplateId(request.getScoringTemplateId())
                .build();

        return toResponse(trackRepository.save(track));
    }

    @Transactional
    public TrackResponse updateTrack(UUID eventId, UUID trackId, CreateTrackRequest request) {
        Track track = getTrackEntity(trackId, eventId);

        if (trackRepository.existsByHackathonEventIdAndNameAndIdNot(eventId, request.getName(), trackId)) {
            throw new DuplicateResourceException("Track", "name", request.getName());
        }

        track.setName(request.getName());
        track.setDescription(request.getDescription());
        track.setTopic(request.getTopic());
        track.setMaxTeams(request.getMaxTeams());
        track.setScoringTemplateId(request.getScoringTemplateId());

        return toResponse(trackRepository.save(track));
    }

    @Transactional(readOnly = true)
    public List<TrackResponse> listTracks(UUID eventId) {
        return trackRepository.findByHackathonEventId(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackResponse getTrackById(UUID eventId, UUID trackId) {
        return toResponse(getTrackEntity(trackId, eventId));
    }

    @Transactional
    public TrackResponse assignTopic(UUID eventId, UUID trackId, AssignTrackTopicRequest request) {
        Track track = getTrackEntity(trackId, eventId);
        if (track.getStatus() == TrackStatus.LOCKED) {
            throw new com.sealhackathon.common.exception.BusinessException(
                    "Cannot update topic on a locked track",
                    org.springframework.http.HttpStatus.CONFLICT);
        }
        track.setTopic(request.getTopic().trim());
        return toResponse(trackRepository.save(track));
    }

    @Transactional
    public void deleteTrack(UUID eventId, UUID trackId) {
        Track track = getTrackEntity(trackId, eventId);
        trackRepository.delete(track);
    }

    private Track getTrackEntity(UUID trackId, UUID eventId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("Track", "id", trackId);
        }
        return track;
    }

    private TrackResponse toResponse(Track track) {
        UUID eventId = track.getHackathonEvent().getId();
        long assignedCount = teamRepository.countByEventIdAndTrackId(eventId, track.getId());
        return TrackResponse.builder()
                .id(track.getId())
                .eventId(eventId)
                .name(track.getName())
                .description(track.getDescription())
                .topic(track.getTopic())
                .maxTeams(track.getMaxTeams())
                .scoringTemplateId(track.getScoringTemplateId())
                .status(track.getStatus())
                .assignedTeamCount((int) assignedCount)
                .build();
    }
}
