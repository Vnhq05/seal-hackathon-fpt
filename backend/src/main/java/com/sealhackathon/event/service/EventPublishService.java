package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.request.CreateRoundRequest;
import com.sealhackathon.event.dto.request.PublishEventRequest;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.dto.response.RoundResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventPublishService {

    private final EventService eventService;
    private final RoundService roundService;
    private final JudgeAssignmentService judgeAssignmentService;

    @Transactional
    public EventResponse publishEvent(PublishEventRequest request, String ipAddress) {
        validateJudgesForRounds(request);

        EventResponse created = eventService.createEvent(request);
        UUID eventId = created.getId();

        List<UUID> judgeUserIds = request.getJudgeUserIds() != null
                ? request.getJudgeUserIds()
                : List.of();

        if (request.getRounds() != null) {
            for (CreateRoundRequest roundRequest : request.getRounds()) {
                RoundResponse round = roundService.createRound(eventId, roundRequest);
                for (UUID judgeUserId : judgeUserIds) {
                    judgeAssignmentService.assignJudge(
                            round.getId(),
                            AssignJudgeRequest.builder().judgeUserId(judgeUserId).build());
                }
            }
        }

        return eventService.finalizePublish(eventId, ipAddress);
    }

    private void validateJudgesForRounds(PublishEventRequest request) {
        if (request.getRounds() == null || request.getRounds().isEmpty()) {
            return;
        }
        if (request.getJudgeUserIds() == null || request.getJudgeUserIds().isEmpty()) {
            throw new BusinessException(
                    "At least one judge (JUDGE or BOTH role) is required when the event has rounds",
                    HttpStatus.BAD_REQUEST) {};
        }
    }
}
