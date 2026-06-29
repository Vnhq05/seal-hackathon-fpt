package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.dto.snapshot.TrackSnapshot;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventPublicServiceImpl implements EventPublicService {

    private final HackathonEventRepository eventRepository;
    private final EventService eventService;
    private final RoundRepository roundRepository;
    private final CriteriaRepository criteriaRepository;
    private final TrackRepository trackRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<EventSnapshot> getEvent(UUID eventId) {
        return eventRepository.findById(eventId).map(this::toEventSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<RoundSnapshot> getRound(UUID roundId) {
        return roundRepository.findById(roundId).map(this::toRoundSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoundSnapshot> getRoundsByEvent(UUID eventId) {
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .map(this::toRoundSnapshot)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CriteriaSnapshot> getCriteriaByRound(UUID roundId) {
        return criteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId).stream()
                .map(c -> CriteriaSnapshot.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .weight(c.getWeight())
                        .sortOrder(c.getSortOrder())
                        .minScore(c.getMinScore())
                        .maxScore(c.getMaxScore())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrackSnapshot> getTracksByEvent(UUID eventId) {
        return trackRepository.findByHackathonEventId(eventId).stream()
                .map(t -> TrackSnapshot.builder()
                        .id(t.getId())
                        .name(t.getName())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public LocalDateTime getRegistrationDeadline(UUID eventId) {
        HackathonEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        LocalDate deadline = event.getRegistrationDeadline();
        if (deadline == null) {
            return null;
        }
        return deadline.atTime(23, 59, 59);
    }

    @Override
    @Transactional(readOnly = true)
    public LocalDateTime getSubmissionDeadline(UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        return round.getSubmissionDeadline();
    }

    @Override
    @Transactional(readOnly = true)
    public LocalDateTime getScoringDeadline(UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        return round.getScoringDeadline();
    }

    @Override
    @Transactional(readOnly = true)
    public int getAdvancementCutoff(UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        return round.getAdvancementCutoff();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getJudgeAssignments(UUID roundId) {
        return judgeAssignmentRepository.findByRoundId(roundId).stream()
                .map(a -> a.getJudgeUserId())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UUID> getMentorAssignments(UUID eventId) {
        return mentorAssignmentRepository.findByHackathonEventId(eventId).stream()
                .map(a -> a.getMentorUserId())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isJudgeAssignedToRound(UUID judgeId, UUID roundId) {
        return judgeAssignmentRepository.findByRoundId(roundId).stream()
                .anyMatch(a -> a.getJudgeUserId().equals(judgeId));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEventActive(UUID eventId) {
        return eventRepository.findById(eventId)
                .map(e -> eventService.resolveStatus(e) == EventStatus.ACTIVE)
                .orElse(false);
    }

    @Override
    @Transactional
    public void setLeaderboardPublic(UUID eventId, boolean enabled) {
        HackathonEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        event.setLeaderboardPublic(enabled);
        eventRepository.save(event);
    }

    private EventSnapshot toEventSnapshot(HackathonEvent event) {
        return EventSnapshot.builder()
                .id(event.getId())
                .name(event.getName())
                .season(event.getSeason())
                .year(event.getYear())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .registrationOpenDate(event.getRegistrationOpenDate())
                .status(eventService.resolveStatus(event))
                .competitionFormat(event.getCompetitionFormat())
                .semesterMin(event.getSemesterMin())
                .semesterMax(event.getSemesterMax())
                .leaderboardPublic(event.isLeaderboardPublic())
                .scoringTemplateId(event.getScoringTemplateId())
                .tiebreakerCriteria(event.getTiebreakerCriteria())
                .tiebreakerCriterionIds(List.copyOf(event.getTiebreakerCriterionIds()))
                .build();
    }

    private RoundSnapshot toRoundSnapshot(Round round) {
        return RoundSnapshot.builder()
                .id(round.getId())
                .eventId(round.getHackathonEvent().getId())
                .roundNumber(round.getRoundNumber())
                .name(round.getName())
                .startDate(round.getStartDate())
                .endDate(round.getEndDate())
                .submissionDeadline(round.getSubmissionDeadline())
                .slideDeadline(round.getSlideDeadline())
                .scoringDeadline(round.getScoringDeadline())
                .advancementCutoff(round.getAdvancementCutoff())
                .roundWeight(round.getRoundWeight())
                .roundType(round.getRoundType())
                .advancementRule(round.getAdvancementRule())
                .build();
    }
}
