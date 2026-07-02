package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.EventMentorAssignment;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.dto.response.EventMentorResponse;
import com.sealhackathon.event.repository.EventMentorAssignmentRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventMentorService {

    private final EventMentorAssignmentRepository eventMentorRepository;
    private final EventService eventService;
    private final UserPublicService userPublicService;

    @Transactional(readOnly = true)
    public List<EventMentorResponse> getEventMentors(UUID eventId) {
        eventService.getEvent(eventId);
        return eventMentorRepository.findByHackathonEventId(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EventMentorResponse assignEventMentor(UUID eventId, UUID mentorUserId) {
        HackathonEvent event = eventService.getEvent(eventId);
        UserSnapshot mentor = validateLecturer(mentorUserId);

        if (eventMentorRepository.existsByHackathonEventIdAndMentorUserId(eventId, mentorUserId)) {
            throw new DuplicateResourceException("EventMentorAssignment", "mentor",
                    mentor.getEmail() != null ? mentor.getEmail() : mentorUserId.toString());
        }

        EventMentorAssignment assignment = eventMentorRepository.save(EventMentorAssignment.builder()
                .hackathonEvent(event)
                .mentorUserId(mentorUserId)
                .assignedAt(LocalDateTime.now())
                .build());

        return toResponse(assignment);
    }

    @Transactional
    public void removeEventMentor(UUID eventId, UUID assignmentId) {
        EventMentorAssignment assignment = eventMentorRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("EventMentorAssignment", "id", assignmentId));

        if (!assignment.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("EventMentorAssignment", "id", assignmentId);
        }

        eventMentorRepository.delete(assignment);
    }

    private UserSnapshot validateLecturer(UUID userId) {
        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "Only lecturers can be assigned as mentors",
                    HttpStatus.BAD_REQUEST) {};
        }

        return user;
    }

    private EventMentorResponse toResponse(EventMentorAssignment assignment) {
        UserSnapshot mentor = userPublicService.findById(assignment.getMentorUserId()).orElse(null);
        return EventMentorResponse.builder()
                .id(assignment.getId())
                .mentorUserId(assignment.getMentorUserId())
                .mentorFullName(mentor != null ? mentor.getFullName() : null)
                .mentorEmail(mentor != null ? mentor.getEmail() : null)
                .assignedAt(assignment.getAssignedAt())
                .build();
    }
}
