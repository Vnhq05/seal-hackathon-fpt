package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.CreateRoundRequest;
import com.sealhackathon.event.dto.response.CriteriaResponse;
import com.sealhackathon.event.dto.response.RoundResponse;
import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final FormatRuleEngine formatRuleEngine;

    @Transactional
    public RoundResponse createRound(UUID eventId, CreateRoundRequest request) {
        HackathonEvent event = getEvent(eventId);
        guardDraftOrActive(event);

        validateRoundDatesWithinEvent(event, request.getStartDate(), request.getEndDate());
        validateNoOverlap(eventId, request.getStartDate(), request.getEndDate());
        validateSequentialRound(eventId, request.getStartDate());

        if (roundRepository.existsByHackathonEventIdAndRoundNumber(eventId, request.getRoundNumber())) {
            throw new BusinessException(
                    "Round number " + request.getRoundNumber() + " already exists in this event",
                    HttpStatus.CONFLICT) {};
        }

        validateDeadlineOrder(request.getStartDate(), request.getEndDate(),
                request.getSubmissionDeadline(), request.getScoringDeadline());
        validateSealRoundType(event, request.getRoundType());

        int roundWeight = resolveRoundWeight(eventId, request.getRoundWeight());
        int cutoff = request.getAdvancementCutoff() != null ? request.getAdvancementCutoff() : 1;

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(request.getRoundNumber())
                .name(request.getName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .submissionDeadline(request.getSubmissionDeadline())
                .scoringDeadline(request.getScoringDeadline())
                .advancementCutoff(cutoff)
                .roundWeight(roundWeight)
                .roundType(request.getRoundType())
                .advancementRule(request.getAdvancementRule() != null
                        ? request.getAdvancementRule()
                        : AdvancementRule.PER_GROUP_TOP_N)
                .minJudgesPerRound(request.getMinJudgesPerRound() != null
                        ? request.getMinJudgesPerRound() : 2)
                .build();

        round = roundRepository.save(round);
        if (request.getRoundWeight() == null) {
            rebalanceRoundWeights(eventId);
            round = roundRepository.findById(round.getId()).orElse(round);
        }
        applyDefaultCriteria(round, event);
        reconcileRoundTypesForEvent(eventId);
        round = roundRepository.findById(round.getId()).orElse(round);
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

        validateSequentialRoundExcluding(event.getId(), roundId, request.getStartDate());

        validateDeadlineOrder(request.getStartDate(), request.getEndDate(),
                request.getSubmissionDeadline(), request.getScoringDeadline());
        validateSealRoundType(event, request.getRoundType());

        int roundWeight = request.getRoundWeight() != null
                ? request.getRoundWeight()
                : round.getRoundWeight();

        round.setRoundNumber(request.getRoundNumber());
        round.setName(request.getName());
        round.setStartDate(request.getStartDate());
        round.setEndDate(request.getEndDate());
        round.setSubmissionDeadline(request.getSubmissionDeadline());
        round.setScoringDeadline(request.getScoringDeadline());
        round.setAdvancementCutoff(request.getAdvancementCutoff() != null
                ? request.getAdvancementCutoff()
                : round.getAdvancementCutoff());
        round.setRoundWeight(roundWeight);
        if (request.getRoundType() != null) {
            round.setRoundType(request.getRoundType());
        }
        if (request.getAdvancementRule() != null) {
            round.setAdvancementRule(request.getAdvancementRule());
        }
        if (request.getMinJudgesPerRound() != null) {
            round.setMinJudgesPerRound(request.getMinJudgesPerRound());
        }

        round = roundRepository.save(round);
        reconcileRoundTypesForEvent(event.getId());
        round = roundRepository.findById(round.getId()).orElse(round);
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
        getEvent(eventId);
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteRound(UUID roundId) {
        Round round = getRound(roundId);
        UUID eventId = round.getHackathonEvent().getId();
        guardDraftOrActive(round.getHackathonEvent());
        roundRepository.delete(round);
        reconcileRoundTypesForEvent(eventId);
    }

    /**
     * Final = round with the latest endDate. Others are PRELIMINARY.
     * Types are persisted so existing FINAL checks keep working.
     */
    @Transactional
    public void reconcileRoundTypesForEvent(UUID eventId) {
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        if (rounds.isEmpty()) {
            return;
        }
        Round latestEnding = rounds.stream()
                .max(java.util.Comparator
                        .comparing(Round::getEndDate)
                        .thenComparing(Round::getRoundNumber))
                .orElse(null);
        if (latestEnding == null) {
            return;
        }
        for (Round r : rounds) {
            if (r.getId().equals(latestEnding.getId())) {
                r.setRoundType(RoundType.FINAL);
                r.setAdvancementRule(AdvancementRule.FINALIST_POOL);
            } else {
                r.setRoundType(RoundType.PRELIMINARY);
                if (r.getAdvancementRule() == null
                        || r.getAdvancementRule() == AdvancementRule.FINALIST_POOL
                        || r.getAdvancementRule() == AdvancementRule.NONE) {
                    r.setAdvancementRule(AdvancementRule.PER_GROUP_TOP_N);
                }
            }
        }
        roundRepository.saveAll(rounds);
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

    private void validateSequentialRound(UUID eventId, LocalDateTime startDate) {
        List<Round> existing = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        if (existing.isEmpty()) {
            return;
        }
        Round previous = existing.get(existing.size() - 1);
        if (!startDate.isAfter(previous.getEndDate())) {
            throw new BusinessException(
                    "Round must start after the previous round ends (" + previous.getEndDate() + ")",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateSequentialRoundExcluding(UUID eventId, UUID excludeRoundId, LocalDateTime startDate) {
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        Round current = rounds.stream()
                .filter(r -> r.getId().equals(excludeRoundId))
                .findFirst()
                .orElseThrow();

        Round previous = rounds.stream()
                .filter(r -> r.getRoundNumber() < current.getRoundNumber())
                .reduce((a, b) -> b)
                .orElse(null);

        if (previous != null && !startDate.isAfter(previous.getEndDate())) {
            throw new BusinessException(
                    "Round must start after the previous round ends (" + previous.getEndDate() + ")",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private int resolveRoundWeight(UUID eventId, Integer requestedWeight) {
        if (requestedWeight != null) {
            if (requestedWeight <= 0 || requestedWeight > 100) {
                throw new BusinessException("Round weight must be between 1 and 100", HttpStatus.BAD_REQUEST) {};
            }
            return requestedWeight;
        }
        return 100;
    }

    private void rebalanceRoundWeights(UUID eventId) {
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        int count = rounds.size();
        if (count == 0) {
            return;
        }
        int base = 100 / count;
        int remainder = 100 % count;
        for (int i = 0; i < count; i++) {
            rounds.get(i).setRoundWeight(base + (i < remainder ? 1 : 0));
        }
        roundRepository.saveAll(rounds);
    }

    public void validateRoundWeightsForPublish(UUID eventId) {
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        if (rounds.isEmpty()) {
            throw new BusinessException("Event must have at least one round before publishing",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (rounds.size() == 1 && rounds.get(0).getRoundWeight() == null) {
            Round only = rounds.get(0);
            only.setRoundWeight(100);
            roundRepository.save(only);
            return;
        }
        int sum = rounds.stream().mapToInt(Round::getRoundWeight).sum();
        if (sum != 100) {
            throw new BusinessException(
                    "Total round weight must equal 100% before publishing. Current total: " + sum + "%",
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

    private void validateSealRoundType(HackathonEvent event, RoundType roundType) {
        if (formatRuleEngine.isSealFormat(event) && roundType == null) {
            throw new BusinessException(
                    "roundType is required for SEAL format rounds (PRELIMINARY or FINAL)",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    /**
     * Copies criteria onto a newly created round from the event scoring template when set,
     * otherwise from the system {@code Default} template (BR-44). Admin/coordinator can still
     * replace criteria afterwards.
     */
    private void applyDefaultCriteria(Round round, HackathonEvent event) {
        if (round.getCriteria() != null && !round.getCriteria().isEmpty()) {
            return;
        }

        ScoringTemplate template = null;
        if (event.getScoringTemplateId() != null) {
            template = scoringTemplateRepository.findWithCriteriaById(event.getScoringTemplateId())
                    .orElse(null);
        }
        if (template == null) {
            template = scoringTemplateRepository
                    .findWithCriteriaByNameIgnoreCase(ScoringTemplateService.DEFAULT_TEMPLATE_NAME)
                    .orElse(null);
        }
        if (template == null || template.getCriteria() == null || template.getCriteria().isEmpty()) {
            return;
        }

        List<ScoringTemplateCriterion> source = template.getCriteria().stream()
                .sorted(Comparator.comparing(c -> c.getSortOrder() != null ? c.getSortOrder() : 0))
                .toList();
        for (ScoringTemplateCriterion tc : source) {
            round.getCriteria().add(Criteria.builder()
                    .round(round)
                    .name(tc.getName())
                    .description(tc.getDescription())
                    .weight(tc.getWeight())
                    .sortOrder(tc.getSortOrder() != null ? tc.getSortOrder() : 0)
                    .minScore(1)
                    .maxScore(resolveEventScoreScaleMax(event, tc))
                    .build());
        }
        roundRepository.save(round);
    }

    private static int resolveEventScoreScaleMax(HackathonEvent event, ScoringTemplateCriterion tc) {
        if (event.getScoreScaleMax() != null) {
            return event.getScoreScaleMax();
        }
        return tc.getMaxScore() != null ? tc.getMaxScore() : 100;
    }

    private void guardDraftOrActive(HackathonEvent event) {
        if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.CANCELLED) {
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
                        .minScore(c.getMinScore())
                        .maxScore(c.getMaxScore())
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
                .slideDeadline(round.getSlideDeadline())
                .scoringDeadline(round.getScoringDeadline())
                .advancementCutoff(round.getAdvancementCutoff())
                .roundWeight(round.getRoundWeight())
                .roundType(round.getRoundType())
                .advancementRule(round.getAdvancementRule())
                .criteria(criteriaList)
                .judgeCount(round.getJudgeAssignments().size())
                .minJudgesPerRound(round.getMinJudgesPerRound())
                .build();
    }

    private HackathonEvent getEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }
}
