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
import lombok.RequiredArgsConstructor;
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

    public static final BigDecimal DEVIATION_THRESHOLD = BigDecimal.valueOf(25);
    private static final BigDecimal PERCENT_SCALE = BigDecimal.valueOf(20);

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

        long assignedJudges = teamJudgeAssignmentRepository.countByTeamIdAndRoundId(
                submission.getTeamId(), submission.getRoundId());
        if (assignedJudges == 0) {
            return;
        }

        List<JudgeScore> finishedScores = judgeScoreRepository.findBySubmissionId(submissionId).stream()
                .filter(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                .toList();

        if (finishedScores.size() < assignedJudges) {
            return;
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

        if (deviation.compareTo(DEVIATION_THRESHOLD) < 0) {
            return;
        }

        RoundSnapshot round = eventPublicService.getRound(submission.getRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", submission.getRoundId()));

        ScoreReviewRequest review = ScoreReviewRequest.builder()
                .eventId(round.getEventId())
                .roundId(submission.getRoundId())
                .teamId(submission.getTeamId())
                .submissionId(submissionId)
                .deviationValue(deviation)
                .minJudgeScore(min)
                .maxJudgeScore(max)
                .status(ScoreReviewStatus.OPEN)
                .build();

        review = scoreReviewRequestRepository.save(review);

        eventPublisher.publishEvent(new ScoreReviewCreatedEvent(
                review.getId(), review.getEventId(), submissionId,
                submission.getTeamId(), deviation));
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
        return weighted.multiply(PERCENT_SCALE).setScale(2, RoundingMode.HALF_UP);
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
                    BigDecimal weighted = percent.divide(PERCENT_SCALE, 4, RoundingMode.HALF_UP);
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
