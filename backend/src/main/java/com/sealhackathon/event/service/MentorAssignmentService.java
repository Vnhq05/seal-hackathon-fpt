package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.MentorAssignment;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.dto.request.AssignMentorRequest;
import com.sealhackathon.event.dto.response.MentorAssignmentResponse;
import com.sealhackathon.event.event.MentorAssignedEvent;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorAssignmentService {

    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final TrackRepository trackRepository;
    private final EventService eventService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MentorAssignmentResponse assignMentor(UUID eventId, UUID trackId, AssignMentorRequest request) {
        HackathonEvent event = eventService.getEvent(eventId);
        Track track = getTrackForEvent(eventId, trackId);

        UserSnapshot mentor = userPublicService.findById(request.getMentorUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getMentorUserId()));

        if (mentor.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "User " + mentor.getEmail() + " is not a LECTURER. Role: " + mentor.getUserType(),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                eventId, trackId, request.getMentorUserId())) {
            throw new DuplicateResourceException("MentorAssignment", "mentor+track",
                    mentor.getEmail() + " in track " + track.getName());
        }

        MentorAssignment assignment = MentorAssignment.builder()
                .hackathonEvent(event)
                .trackId(trackId)
                .mentorUserId(request.getMentorUserId())
                .assignedAt(LocalDateTime.now())
                .build();

        assignment = mentorAssignmentRepository.save(assignment);

        eventPublisher.publishEvent(new MentorAssignedEvent(
                assignment.getId(), request.getMentorUserId(), eventId));

        return toResponse(assignment, mentor, track.getName());
    }

    @Transactional(readOnly = true)
    public List<MentorAssignmentResponse> getMentorsByTrack(UUID eventId, UUID trackId) {
        eventService.getEvent(eventId);
        Track track = getTrackForEvent(eventId, trackId);
        return mentorAssignmentRepository.findByHackathonEventIdAndTrackId(eventId, trackId).stream()
                .map(a -> {
                    UserSnapshot mentor = userPublicService.findById(a.getMentorUserId()).orElse(null);
                    return toResponse(a, mentor, track.getName());
                })
                .toList();
    }

    @Transactional
    public void removeMentorAssignment(UUID eventId, UUID trackId, UUID assignmentId) {
        MentorAssignment assignment = mentorAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));

        if (!assignment.getHackathonEvent().getId().equals(eventId)
                || !assignment.getTrackId().equals(trackId)) {
            throw new ResourceNotFoundException("MentorAssignment", "id", assignmentId);
        }

        mentorAssignmentRepository.delete(assignment);
    }

    private Track getTrackForEvent(UUID eventId, UUID trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("Track", "id", trackId);
        }
        return track;
    }

    private MentorAssignmentResponse toResponse(MentorAssignment a, UserSnapshot mentor, String trackName) {
        return MentorAssignmentResponse.builder()
                .id(a.getId())
                .eventId(a.getHackathonEvent().getId())
                .trackId(a.getTrackId())
                .trackName(trackName)
                .mentorUserId(a.getMentorUserId())
                .mentorFullName(mentor != null ? mentor.getFullName() : null)
                .mentorEmail(mentor != null ? mentor.getEmail() : null)
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
