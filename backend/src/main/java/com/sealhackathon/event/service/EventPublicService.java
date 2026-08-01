package com.sealhackathon.event.service;

import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.dto.snapshot.TrackSnapshot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventPublicService {

    Optional<EventSnapshot> getEvent(UUID eventId);

    Optional<RoundSnapshot> getRound(UUID roundId);

    List<RoundSnapshot> getRoundsByEvent(UUID eventId);

    List<CriteriaSnapshot> getCriteriaByRound(UUID roundId);

    List<TrackSnapshot> getTracksByEvent(UUID eventId);

    LocalDateTime getRegistrationDeadline(UUID eventId);

    LocalDateTime getSubmissionDeadline(UUID roundId);

    LocalDateTime getScoringDeadline(UUID roundId);

    int getAdvancementCutoff(UUID roundId);

    List<UUID> getJudgeAssignments(UUID roundId);

    List<UUID> getMentorAssignments(UUID eventId);

    boolean isJudgeAssignedToRound(UUID judgeId, UUID roundId);

    boolean isEventActive(UUID eventId);

    EventStatus getResolvedEventStatus(UUID eventId);

    /** Persisted sticky COMPLETED set by admin/coordinator (not date-derived). */
    boolean isStaffCompleted(UUID eventId);

    UUID getEventIdByRoundId(UUID roundId);

    boolean isRoundScoringOpen(UUID roundId);

    void setLeaderboardPublic(UUID eventId, boolean enabled);
}
