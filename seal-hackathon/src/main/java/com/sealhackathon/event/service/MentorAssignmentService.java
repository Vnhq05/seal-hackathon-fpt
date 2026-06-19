package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.MentorAssignment;
import com.sealhackathon.event.dto.request.AssignMentorRequest;
import com.sealhackathon.event.dto.response.MentorAssignmentResponse;
import com.sealhackathon.event.event.MentorAssignedEvent;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
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
    private final EventService eventService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MentorAssignmentResponse assignMentor(UUID eventId, AssignMentorRequest request) {
        HackathonEvent event = eventService.getEvent(eventId);

        UserSnapshot mentor = userPublicService.findById(request.getMentorUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getMentorUserId()));

        if (mentor.getUserType() != UserType.MENTOR) {
            throw new BusinessException(
                    "User " + mentor.getEmail() + " is not a MENTOR. Role: " + mentor.getUserType(),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (mentorAssignmentRepository.existsByHackathonEventIdAndMentorUserId(
                eventId, request.getMentorUserId())) {
            throw new DuplicateResourceException("MentorAssignment", "mentor+event",
                    mentor.getEmail() + " in event " + event.getName());
        }

        MentorAssignment assignment = MentorAssignment.builder()
                .hackathonEvent(event)
                .mentorUserId(request.getMentorUserId())
                .assignedAt(LocalDateTime.now())
                .build();

        assignment = mentorAssignmentRepository.save(assignment);

        eventPublisher.publishEvent(new MentorAssignedEvent(
                assignment.getId(), request.getMentorUserId(), eventId));

        return toResponse(assignment, mentor);
    }

    @Transactional(readOnly = true)
    public List<MentorAssignmentResponse> getMentorsByEvent(UUID eventId) {
        eventService.getEvent(eventId);
        return mentorAssignmentRepository.findByHackathonEventId(eventId).stream()
                .map(a -> {
                    UserSnapshot mentor = userPublicService.findById(a.getMentorUserId()).orElse(null);
                    return toResponse(a, mentor);
                })
                .toList();
    }

    @Transactional
    public void removeMentorAssignment(UUID assignmentId) {
        MentorAssignment assignment = mentorAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorAssignment", "id", assignmentId));
        mentorAssignmentRepository.delete(assignment);
    }

    private MentorAssignmentResponse toResponse(MentorAssignment a, UserSnapshot mentor) {
        return MentorAssignmentResponse.builder()
                .id(a.getId())
                .eventId(a.getHackathonEvent().getId())
                .mentorUserId(a.getMentorUserId())
                .mentorFullName(mentor != null ? mentor.getFullName() : null)
                .mentorEmail(mentor != null ? mentor.getEmail() : null)
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
