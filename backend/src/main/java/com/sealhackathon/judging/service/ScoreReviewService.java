package com.sealhackathon.judging.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.ScoreReviewRequest;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.JudgeScoreReviewRequest;
import com.sealhackathon.judging.dto.request.ResolveScoreReviewRequest;
import com.sealhackathon.judging.dto.response.ScoreReviewJudgeScoreResponse;
import com.sealhackathon.judging.dto.response.ScoreReviewResponse;
import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.event.ScoreReviewCreatedEvent;
import com.sealhackathon.judging.event.ScoreReviewResolvedEvent;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.ScoreReviewRequestRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.ranking.service.AggregationService;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScoreReviewService {

    @Value("${app.hackathon.judging.deviation-threshold:25}")
    private int deviationThresholdValue;

    @Value("${app.hackathon.judging.percent-scale:20}")
    private int percentScaleValue;

    private BigDecimal deviationThreshold;
    private BigDecimal percentScale;

    @PostConstruct
    private void initScoreConstants() {
        deviationThreshold = BigDecimal.valueOf(deviationThresholdValue);
        percentScale = BigDecimal.valueOf(percentScaleValue);
    }

    private final ScoreReviewRequestRepository scoreReviewRequestRepository;
    private final SubmissionRepository submissionRepository;
    private final JudgeScoreRepository judgeScoreRepository;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final TeamRepository teamRepository;
    private final EventPublicService eventPublicService;
    private final AggregationService aggregationService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void evaluateSubmission(UUID submissionId) {
        if (scoreReviewRequestRepository.findBySubmissionId(submissionId).isPresent()) {
            return;
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Optional<DeviationStats> stats = computeDeviationStats(submission);
        if (stats.isEmpty() || stats.get().deviation().compareTo(deviationThreshold) < 0) {
            return;
        }

        DeviationStats deviationStats = stats.get();
        RoundSnapshot round = eventPublicService.getRound(submission.getRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", submission.getRoundId()));

        ScoreReviewRequest review = ScoreReviewRequest.builder()
                .eventId(round.getEventId())
                .roundId(submission.getRoundId())
                .teamId(submission.getTeamId())
                .submissionId(submissionId)
                .deviationValue(deviationStats.deviation())
                .minJudgeScore(deviationStats.min())
                .maxJudgeScore(deviationStats.max())
                .status(ScoreReviewStatus.OPEN)
                .build();

        review = scoreReviewRequestRepository.save(review);

        eventPublisher.publishEvent(new ScoreReviewCreatedEvent(
                review.getId(), review.getEventId(), submissionId,
                submission.getTeamId(), deviationStats.deviation()));
    }

    @Transactional
    public ScoreReviewResponse requestJudgeAdjustment(UUID eventId, UUID judgeId,
                                                      JudgeScoreReviewRequest request) {
        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", request.getSubmissionId()));

        RoundSnapshot round = eventPublicService.getRound(submission.getRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", submission.getRoundId()));
        if (!round.getEventId().equals(eventId)) {
            throw new ResourceNotFoundException("Submission", "id", request.getSubmissionId());
        }

        if (!teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(
                submission.getTeamId(), submission.getRoundId(), judgeId)) {
            throw new BusinessException(
                    "You are not assigned to this team's scoring for this round",
                    HttpStatus.FORBIDDEN) {};
        }

        JudgeScore judgeScore = judgeScoreRepository.findByJudgeUserIdAndSubmissionId(
                        judgeId, request.getSubmissionId())
                .orElseThrow(() -> new BusinessException(
                        "You have not scored this submission",
                        HttpStatus.BAD_REQUEST) {});

        if (judgeScore.getStatus() != ScoreStatus.COMPLETED
                && judgeScore.getStatus() != ScoreStatus.LOCKED) {
            throw new BusinessException(
                    "You must complete your score before requesting an adjustment",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (scoreReviewRequestRepository.existsBySubmissionIdAndStatus(
                request.getSubmissionId(), ScoreReviewStatus.OPEN)) {
            throw new BusinessException(
                    "A deviation review is already open for this submission.",
                    HttpStatus.CONFLICT) {};
        }

        DeviationStats deviationStats = computeDeviationStats(submission)
                .orElseThrow(() -> new BusinessException(
                        "Not enough completed judge scores to request a review.",
                        HttpStatus.BAD_REQUEST) {});

        Optional<ScoreReviewRequest> existing = scoreReviewRequestRepository.findBySubmissionId(
                request.getSubmissionId());

        ScoreReviewRequest review;
        if (existing.isPresent()) {
            review = existing.get();
            review.setStatus(ScoreReviewStatus.OPEN);
            review.setResolvedAt(null);
            review.setResolvedBy(null);
            review.setResolutionNote(request.getNote());
            review.setDeviationValue(deviationStats.deviation());
            review.setMinJudgeScore(deviationStats.min());
            review.setMaxJudgeScore(deviationStats.max());
            review = scoreReviewRequestRepository.save(review);
        } else {
            review = ScoreReviewRequest.builder()
                    .eventId(eventId)
                    .roundId(submission.getRoundId())
                    .teamId(submission.getTeamId())
                    .submissionId(request.getSubmissionId())
                    .deviationValue(deviationStats.deviation())
                    .minJudgeScore(deviationStats.min())
                    .maxJudgeScore(deviationStats.max())
                    .status(ScoreReviewStatus.OPEN)
                    .resolutionNote(request.getNote())
                    .build();
            review = scoreReviewRequestRepository.save(review);
        }

        eventPublisher.publishEvent(new ScoreReviewCreatedEvent(
                review.getId(), review.getEventId(), request.getSubmissionId(),
                submission.getTeamId(), deviationStats.deviation()));

        return toDetailResponse(review);
    }

    @Transactional(readOnly = true)
    public List<ScoreReviewResponse> listReviews(UUID eventId, UUID roundId, ScoreReviewStatus status) {
        return scoreReviewRequestRepository.findByEventFilters(eventId, roundId, status).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScoreReviewResponse getReview(UUID eventId, UUID reviewId,
                                         UUID requesterId, UserType requesterRole) {
        ScoreReviewRequest review = getReviewForEvent(eventId, reviewId);
        assertReviewReadAccess(review, requesterId, requesterRole);
        return toDetailResponse(review);
    }

    @Transactional(readOnly = true)
    public Optional<UUID> findOpenReviewId(UUID submissionId) {
        return scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .filter(r -> r.getStatus() == ScoreReviewStatus.OPEN)
                .map(ScoreReviewRequest::getId);
    }

    @Transactional
    public ScoreReviewResponse resolveReview(UUID eventId, UUID reviewId, UUID resolverId,
                                             ResolveScoreReviewRequest request) {
        if (request.getStatus() != ScoreReviewStatus.RESOLVED
                && request.getStatus() != ScoreReviewStatus.IGNORED) {
            throw new BusinessException(
                    "Resolution status must be RESOLVED or IGNORED",
                    HttpStatus.BAD_REQUEST) {};
        }

        ScoreReviewRequest review = getReviewForEvent(eventId, reviewId);
        if (review.getStatus() != ScoreReviewStatus.OPEN) {
            throw new BusinessException("Review request is already closed", HttpStatus.BAD_REQUEST) {};
        }

        review.setStatus(request.getStatus());
        review.setResolvedBy(resolverId);
        review.setResolvedAt(LocalDateTime.now());
        review.setResolutionNote(request.getResolutionNote());
        review = scoreReviewRequestRepository.save(review);

        eventPublisher.publishEvent(new ScoreReviewResolvedEvent(
                review.getId(), eventId, resolverId,
                request.getStatus().name(), request.getResolutionNote()));

        return toDetailResponse(review);
    }

    @Transactional(readOnly = true)
    public boolean hasOpenReview(UUID submissionId) {
        return scoreReviewRequestRepository.existsBySubmissionIdAndStatus(
                submissionId, ScoreReviewStatus.OPEN);
    }

    private void assertReviewReadAccess(ScoreReviewRequest review, UUID requesterId,
                                        UserType requesterRole) {
        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return;
        }
        if (requesterRole == UserType.LECTURER) {
            if (!teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(
                    review.getTeamId(), review.getRoundId(), requesterId)) {
                throw new BusinessException(
                        "You are not assigned to this team's scoring for this round",
                        HttpStatus.FORBIDDEN) {};
            }
            return;
        }
        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    private ScoreReviewRequest getReviewForEvent(UUID eventId, UUID reviewId) {
        ScoreReviewRequest review = scoreReviewRequestRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("ScoreReviewRequest", "id", reviewId));
        if (!review.getEventId().equals(eventId)) {
            throw new ResourceNotFoundException("ScoreReviewRequest", "id", reviewId);
        }
        return review;
    }

    private Optional<DeviationStats> computeDeviationStats(Submission submission) {
        long assignedJudges = teamJudgeAssignmentRepository.countByTeamIdAndRoundId(
                submission.getTeamId(), submission.getRoundId());
        if (assignedJudges == 0) {
            return Optional.empty();
        }

        List<JudgeScore> finishedScores = judgeScoreRepository.findBySubmissionId(submission.getId()).stream()
                .filter(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                .toList();

        if (finishedScores.size() < assignedJudges) {
            return Optional.empty();
        }

        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(submission.getRoundId());
        Map<UUID, Integer> weightMap = criteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getWeight));

        List<BigDecimal> percentScores = finishedScores.stream()
                .map(score -> toPercentScore(score, criteria, weightMap))
                .sorted()
                .toList();

        BigDecimal min = percentScores.get(0);
        BigDecimal max = percentScores.get(percentScores.size() - 1);
        BigDecimal deviation = max.subtract(min).setScale(2, RoundingMode.HALF_UP);
        return Optional.of(new DeviationStats(min, max, deviation));
    }

    private record DeviationStats(BigDecimal min, BigDecimal max, BigDecimal deviation) {}

    private BigDecimal toPercentScore(JudgeScore score, List<CriteriaSnapshot> criteria,
                                      Map<UUID, Integer> weightMap) {
        JudgeScoreSnapshot snapshot = JudgeScoreSnapshot.builder()
                .id(score.getId())
                .judgeUserId(score.getJudgeUserId())
                .submissionId(score.getSubmissionId())
                .roundId(score.getRoundId())
                .status(score.getStatus())
                .details(score.getDetails().stream()
                        .map(d -> com.sealhackathon.judging.dto.snapshot.ScoreDetailSnapshot.builder()
                                .criteriaId(d.getCriteriaId())
                                .score(d.getScore())
                                .build())
                        .toList())
                .build();
        BigDecimal weighted = aggregationService.computeWeightedJudgeScore(snapshot, weightMap, criteria);
        return weighted.multiply(percentScale).setScale(2, RoundingMode.HALF_UP);
    }

    private ScoreReviewResponse toSummaryResponse(ScoreReviewRequest review) {
        return ScoreReviewResponse.builder()
                .id(review.getId())
                .eventId(review.getEventId())
                .roundId(review.getRoundId())
                .roundType(resolveRoundType(review.getRoundId()))
                .teamId(review.getTeamId())
                .teamName(resolveTeamName(review.getTeamId()))
                .submissionId(review.getSubmissionId())
                .deviationValue(review.getDeviationValue())
                .minJudgeScore(review.getMinJudgeScore())
                .maxJudgeScore(review.getMaxJudgeScore())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .resolvedAt(review.getResolvedAt())
                .resolutionNote(review.getResolutionNote())
                .build();
    }

    private ScoreReviewResponse toDetailResponse(ScoreReviewRequest review) {
        ScoreReviewResponse response = toSummaryResponse(review);
        response.setJudgeScores(buildJudgeScoreBreakdown(review.getSubmissionId(), review.getRoundId()));
        return response;
    }

    private List<ScoreReviewJudgeScoreResponse> buildJudgeScoreBreakdown(UUID submissionId, UUID roundId) {
        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(roundId);
        Map<UUID, Integer> weightMap = criteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getWeight));

        return judgeScoreRepository.findBySubmissionId(submissionId).stream()
                .filter(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                .map(score -> {
                    BigDecimal percent = toPercentScore(score, criteria, weightMap);
                    BigDecimal weighted = percent.divide(percentScale, 4, RoundingMode.HALF_UP);
                    UserSnapshot judge = userPublicService.findById(score.getJudgeUserId()).orElse(null);
                    return ScoreReviewJudgeScoreResponse.builder()
                            .judgeUserId(score.getJudgeUserId())
                            .judgeFullName(judge != null ? judge.getFullName() : null)
                            .weightedScore(weighted)
                            .percentScore(percent)
                            .status(score.getStatus())
                            .build();
                })
                .sorted(Comparator.comparing(ScoreReviewJudgeScoreResponse::getPercentScore).reversed())
                .toList();
    }

    private RoundType resolveRoundType(UUID roundId) {
        return eventPublicService.getRound(roundId)
                .map(RoundSnapshot::getRoundType)
                .orElse(null);
    }

    private String resolveTeamName(UUID teamId) {
        return teamRepository.findById(teamId)
                .map(Team::getName)
                .orElse("Unknown");
    }
}
