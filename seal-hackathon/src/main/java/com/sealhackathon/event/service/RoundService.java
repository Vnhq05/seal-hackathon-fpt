package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CreateRoundRequest;
import com.sealhackathon.event.dto.response.CriteriaResponse;
import com.sealhackathon.event.dto.response.RoundResponse;
import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.event.repository.RoundRepository;
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
public class RoundService {

    private final RoundRepository roundRepository;
    private final EventService eventService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public RoundResponse createRound(UUID eventId, CreateRoundRequest request) {
        HackathonEvent event = eventService.getEvent(eventId);
        guardDraftOrActive(event);

        validateRoundDatesWithinEvent(event, request.getStartDate(), request.getEndDate());
        validateNoOverlap(eventId, request.getStartDate(), request.getEndDate());

        if (roundRepository.existsByHackathonEventIdAndRoundNumber(eventId, request.getRoundNumber())) {
            throw new BusinessException(
                    "Round number " + request.getRoundNumber() + " already exists in this event",
                    HttpStatus.CONFLICT) {};
        }

        validateDeadlineOrder(request.getStartDate(), request.getEndDate(),
                request.getSubmissionDeadline(), request.getScoringDeadline());

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(request.getRoundNumber())
                .name(request.getName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .submissionDeadline(request.getSubmissionDeadline())
                .scoringDeadline(request.getScoringDeadline())
                .advancementCutoff(request.getAdvancementCutoff())
                .build();

        round = roundRepository.save(round);
        return toResponse(round);
    }

    @Transactional
    public RoundResponse updateRound(UUID roundId, CreateRoundRequest request) {
        Round round = getRound(roundId);
        HackathonEvent event = round.getHackathonEvent();
        guardDraftOrActive(event);

        validateRoundDatesWithinEvent(event, request.getStartDate(), request.getEndDate());

        if (roundRepository.existsOverlappingRound(event.getId(), roundId,
                request.getStartDate(), request.getEndDate())) {
            throw new BusinessException("Round dates overlap with another round in this event",
                    HttpStatus.BAD_REQUEST) {};
        }

        validateDeadlineOrder(request.getStartDate(), request.getEndDate(),
                request.getSubmissionDeadline(), request.getScoringDeadline());

        round.setRoundNumber(request.getRoundNumber());
        round.setName(request.getName());
        round.setStartDate(request.getStartDate());
        round.setEndDate(request.getEndDate());
        round.setSubmissionDeadline(request.getSubmissionDeadline());
        round.setScoringDeadline(request.getScoringDeadline());
        round.setAdvancementCutoff(request.getAdvancementCutoff());

        round = roundRepository.save(round);
        return toResponse(round);
    }

    @Transactional
    public RoundResponse reopenScoringWindow(UUID roundId, LocalDateTime newDeadline) {
        Round round = getRound(roundId);

        if (newDeadline.isBefore(LocalDateTime.now())) {
            throw new BusinessException("New scoring deadline must be in the future",
                    HttpStatus.BAD_REQUEST) {};
        }

        round.setScoringDeadline(newDeadline);
        round = roundRepository.save(round);

        eventPublisher.publishEvent(new ScoringWindowReopenedEvent(roundId, newDeadline));

        return toResponse(round);
    }

    @Transactional(readOnly = true)
    public RoundResponse getRoundById(UUID roundId) {
        return toResponse(getRound(roundId));
    }

    @Transactional(readOnly = true)
    public List<RoundResponse> getRoundsByEvent(UUID eventId) {
        eventService.getEvent(eventId);
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteRound(UUID roundId) {
        Round round = getRound(roundId);
        guardDraftOrActive(round.getHackathonEvent());
        roundRepository.delete(round);
    }

    Round getRound(UUID roundId) {
        return roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
    }

    private void validateRoundDatesWithinEvent(HackathonEvent event,
                                                LocalDateTime start, LocalDateTime end) {
        if (start.toLocalDate().isBefore(event.getStartDate())
                || end.toLocalDate().isAfter(event.getEndDate())) {
            throw new BusinessException(
                    "Round dates must be within event dates [" +
                            event.getStartDate() + ", " + event.getEndDate() + "]",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (!end.isAfter(start)) {
            throw new BusinessException("Round end date must be after start date",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateNoOverlap(UUID eventId, LocalDateTime start, LocalDateTime end) {
        if (roundRepository.existsOverlappingRoundForNew(eventId, start, end)) {
            throw new BusinessException("Round dates overlap with another round in this event",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateDeadlineOrder(LocalDateTime roundStart, LocalDateTime roundEnd,
                                       LocalDateTime submissionDeadline,
                                       LocalDateTime scoringDeadline) {
        if (submissionDeadline.isBefore(roundStart) || submissionDeadline.isAfter(roundEnd)) {
            throw new BusinessException("Submission deadline must be within round dates",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (scoringDeadline.isBefore(submissionDeadline)) {
            throw new BusinessException("Scoring deadline must be after submission deadline",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void guardDraftOrActive(HackathonEvent event) {
        if (event.getStatus() != EventStatus.DRAFT && event.getStatus() != EventStatus.ACTIVE) {
            throw new BusinessException(
                    "Cannot modify rounds for event with status: " + event.getStatus(),
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    RoundResponse toResponse(Round round) {
        List<CriteriaResponse> criteriaList = round.getCriteria().stream()
                .map(c -> CriteriaResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .weight(c.getWeight())
                        .sortOrder(c.getSortOrder())
                        .build())
                .toList();

        return RoundResponse.builder()
                .id(round.getId())
                .eventId(round.getHackathonEvent().getId())
                .roundNumber(round.getRoundNumber())
                .name(round.getName())
                .startDate(round.getStartDate())
                .endDate(round.getEndDate())
                .submissionDeadline(round.getSubmissionDeadline())
                .scoringDeadline(round.getScoringDeadline())
                .advancementCutoff(round.getAdvancementCutoff())
                .criteria(criteriaList)
                .judgeCount(round.getJudgeAssignments().size())
                .build();
    }
}
