package com.sealhackathon.event.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventPublicService {

    Optional<EventSnapshot> getEvent(UUID eventId);

    Optional<RoundSnapshot> getRound(UUID roundId);

    List<RoundSnapshot> getRoundsByEvent(UUID eventId);

    List<CriteriaSnapshot> getCriteriaByRound(UUID roundId);

    LocalDateTime getRegistrationDeadline(UUID eventId);

    LocalDateTime getSubmissionDeadline(UUID roundId);

    LocalDateTime getScoringDeadline(UUID roundId);

    int getAdvancementCutoff(UUID roundId);

    List<UUID> getJudgeAssignments(UUID roundId);

    List<UUID> getMentorAssignments(UUID eventId);

    boolean isJudgeAssignedToRound(UUID judgeId, UUID roundId);

    boolean isEventActive(UUID eventId);
}
