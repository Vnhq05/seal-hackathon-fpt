package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.EventJudgeAssignment;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.dto.response.EventJudgeResponse;
import com.sealhackathon.event.repository.EventJudgeAssignmentRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventJudgeService {

    private final EventJudgeAssignmentRepository eventJudgeRepository;
    private final EventFinder eventFinder;
    private final UserPublicService userPublicService;

    @Transactional(readOnly = true)
    public List<EventJudgeResponse> getEventJudges(UUID eventId) {
        eventFinder.getEvent(eventId);
        return eventJudgeRepository.findByHackathonEventId(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EventJudgeResponse assignEventJudge(UUID eventId, UUID judgeUserId) {
        HackathonEvent event = eventFinder.getEvent(eventId);
        UserSnapshot judge = validateLecturer(judgeUserId);

        if (eventJudgeRepository.existsByHackathonEventIdAndJudgeUserId(eventId, judgeUserId)) {
            throw new DuplicateResourceException("EventJudgeAssignment", "judge",
                    judge.getEmail() != null ? judge.getEmail() : judgeUserId.toString());
        }

        EventJudgeAssignment assignment = eventJudgeRepository.save(EventJudgeAssignment.builder()
                .hackathonEvent(event)
                .judgeUserId(judgeUserId)
                .assignedAt(LocalDateTime.now())
                .build());

        return toResponse(assignment);
    }

    @Transactional
    public void removeEventJudge(UUID eventId, UUID assignmentId) {
        EventJudgeAssignment assignment = eventJudgeRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("EventJudgeAssignment", "id", assignmentId));

        if (!assignment.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("EventJudgeAssignment", "id", assignmentId);
        }

        eventJudgeRepository.delete(assignment);
    }

    @Transactional(readOnly = true)
    public boolean isEventJudge(UUID eventId, UUID judgeUserId) {
        return eventJudgeRepository.existsByHackathonEventIdAndJudgeUserId(eventId, judgeUserId);
    }

    void seedFromEvent(HackathonEvent event, List<UUID> judgeUserIds) {
        if (judgeUserIds == null) return;

        new LinkedHashSet<>(judgeUserIds).forEach(judgeId -> {
            validateLecturer(judgeId);
            EventJudgeAssignment assignment = EventJudgeAssignment.builder()
                    .hackathonEvent(event)
                    .judgeUserId(judgeId)
                    .assignedAt(LocalDateTime.now())
                    .build();
            event.getEventJudgeAssignments().add(assignment);
        });
    }

    private UserSnapshot validateLecturer(UUID userId) {
        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "Only lecturers can be assigned as judges",
                    HttpStatus.BAD_REQUEST) {};
        }

        return user;
    }

    private EventJudgeResponse toResponse(EventJudgeAssignment assignment) {
        UserSnapshot judge = userPublicService.findById(assignment.getJudgeUserId()).orElse(null);
        return EventJudgeResponse.builder()
                .id(assignment.getId())
                .judgeUserId(assignment.getJudgeUserId())
                .judgeFullName(judge != null ? judge.getFullName() : null)
                .judgeEmail(judge != null ? judge.getEmail() : null)
                .assignedAt(assignment.getAssignedAt())
                .build();
    }
}
