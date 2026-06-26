package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
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

import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventJudgeService {

    private final EventJudgeAssignmentRepository eventJudgeRepository;
    private final UserPublicService userPublicService;

    @Transactional(readOnly = true)
    public List<EventJudgeResponse> getEventJudges(UUID eventId) {
        return eventJudgeRepository.findByHackathonEventId(eventId).stream()
                .map(a -> {
                    UserSnapshot judge = userPublicService.findById(a.getJudgeUserId()).orElse(null);
                    return EventJudgeResponse.builder()
                            .id(a.getId())
                            .judgeUserId(a.getJudgeUserId())
                            .judgeFullName(judge != null ? judge.getFullName() : null)
                            .judgeEmail(judge != null ? judge.getEmail() : null)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isEventJudge(UUID eventId, UUID judgeUserId) {
        return eventJudgeRepository.existsByHackathonEventIdAndJudgeUserId(eventId, judgeUserId);
    }

    void seedFromEvent(HackathonEvent event, List<UUID> judgeUserIds) {
        if (judgeUserIds == null) return;

        new LinkedHashSet<>(judgeUserIds).forEach(judgeId -> {
            UserSnapshot user = userPublicService.findById(judgeId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", judgeId));

            if (user.getUserType() != UserType.LECTURER) {
                throw new BusinessException(
                        "Only lecturers can be assigned as judges",
                        HttpStatus.BAD_REQUEST) {};
            }

            EventJudgeAssignment assignment = EventJudgeAssignment.builder()
                    .hackathonEvent(event)
                    .judgeUserId(judgeId)
                    .assignedAt(java.time.LocalDateTime.now())
                    .build();
            event.getEventJudgeAssignments().add(assignment);
        });
    }
}
