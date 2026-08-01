package com.sealhackathon.judging.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventOwnershipGuard;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.ScoreReviewRequest;
import com.sealhackathon.judging.domain.enums.ScoreAdjustmentType;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.JudgeScoreReviewRequest;
import com.sealhackathon.judging.dto.request.ResolveScoreReviewRequest;
import com.sealhackathon.judging.dto.response.ScoreReviewContextResponse;
import com.sealhackathon.judging.dto.response.ScoreReviewJudgeScoreResponse;
import com.sealhackathon.judging.dto.response.ScoreReviewResponse;
import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.event.ScoreReviewCreatedEvent;
import com.sealhackathon.judging.event.ScoreReviewResolvedEvent;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.ScoreReviewRequestRepository;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.service.NotificationService;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
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

    public static final String ACTIVE_REVIEW_CONFLICT_MESSAGE =
            "A score adjustment request is already active for this submission.";
    public static final String DEVIATION_TOO_LOW_MESSAGE =
            "Score deviation is below the threshold required for an adjustment request.";
    public static final String EVENT_COMPLETED_MESSAGE =
            "This competition has ended. Score adjustment requests are no longer accepted.";

    private static final List<ScoreReviewStatus> ACTIVE_STATUSES =
            List.of(ScoreReviewStatus.OPEN, ScoreReviewStatus.APPROVED);
    private static final List<ScoreReviewStatus> CLOSED_STATUSES =
            List.of(ScoreReviewStatus.ADJUSTED, ScoreReviewStatus.REJECTED,
                    ScoreReviewStatus.RESOLVED, ScoreReviewStatus.IGNORED);

    @Value("${app.hackathon.judging.deviation-threshold:25}")
    private int deviationThresholdValue;

    @Value("${app.hackathon.judging.cohen-d-threshold:0.8}")
    private double cohenDThresholdValue;

    private BigDecimal deviationThreshold;

    @PostConstruct
    private void initScoreConstants() {
        deviationThreshold = BigDecimal.valueOf(deviationThresholdValue);
    }

    private final ScoreReviewRequestRepository scoreReviewRequestRepository;
    private final SubmissionRepository submissionRepository;
    private final JudgeScoreRepository judgeScoreRepository;
    private final JudgeAssignmentService judgeAssignmentService;
    private final TeamRepository teamRepository;
    private final PublishedResultRepository publishedResultRepository;
    private final EventPublicService eventPublicService;
    private final EventOwnershipGuard eventOwnershipGuard;
    private final AggregationService aggregationService;
    private final UserPublicService userPublicService;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void evaluateSubmission(UUID submissionId) {
        if (hasActiveReview(submissionId)) {
            return;
        }

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        RoundSnapshot round = eventPublicService.getRound(submission.getRoundId()).orElse(null);
        if (round != null && eventPublicService.isStaffCompleted(round.getEventId())) {
            return;
        }
        if (publishedResultRepository.existsByRoundId(submission.getRoundId())) {
            return;
        }

        Optional<DeviationStats> stats = computeDeviationStats(submission);
        if (stats.isEmpty() || stats.get().deviation().compareTo(deviationThreshold) < 0) {
            return;
        }

        createOrReopenReview(submission, stats.get(), ScoreAdjustmentType.AUTO_DEVIATION,
                null, null);
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

        assertNotPublished(submission.getRoundId());
        assertEventNotCompleted(eventId);

        if (!isJudgeInPoolForTeam(submission.getTeamId(), submission.getRoundId(), judgeId)) {
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

        DeviationStats deviationStats = computeDeviationStats(submission)
                .orElseThrow(() -> new BusinessException(
                        "Not enough completed judge scores to request a review.",
                        HttpStatus.BAD_REQUEST) {});

        if (deviationStats.deviation().compareTo(deviationThreshold) < 0) {
            throw new BusinessException(DEVIATION_TOO_LOW_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }

        Optional<ScoreReviewRequest> existingOpt =
                scoreReviewRequestRepository.findBySubmissionId(request.getSubmissionId());
        if (existingOpt.isPresent()) {
            ScoreReviewRequest existing = existingOpt.get();
            if (existing.getStatus() == ScoreReviewStatus.OPEN
                    && existing.getAdjustmentType() == ScoreAdjustmentType.AUTO_DEVIATION) {
                return toDetailResponse(mergeJudgeRequestOntoAutoReview(
                        existing, deviationStats, judgeId, request.getNote()));
            }
            if (ACTIVE_STATUSES.contains(existing.getStatus())) {
                throw new BusinessException(ACTIVE_REVIEW_CONFLICT_MESSAGE, HttpStatus.CONFLICT) {};
            }
        }

        ScoreReviewRequest review = createOrReopenReview(
                submission, deviationStats, ScoreAdjustmentType.JUDGE_REQUESTED,
                judgeId, request.getNote());

        return toDetailResponse(review);
    }

    @Transactional
    public ScoreReviewResponse approveAdjustment(UUID eventId, UUID reviewId, UUID approverId,
                                                 String resolutionNote) {
        eventOwnershipGuard.enforceEventOwnership(eventId);
        ScoreReviewRequest review = getReviewForEvent(eventId, reviewId);
        if (review.getStatus() != ScoreReviewStatus.OPEN) {
            throw new BusinessException("Only open adjustment requests can be approved",
                    HttpStatus.BAD_REQUEST) {};
        }

        unlockScoresForSubmission(review.getSubmissionId());

        review.setStatus(ScoreReviewStatus.APPROVED);
        review.setApprovedAt(LocalDateTime.now());
        review.setApprovedBy(approverId);
        if (resolutionNote != null && !resolutionNote.isBlank()) {
            review.setResolutionNote(resolutionNote.trim());
        }
        review = scoreReviewRequestRepository.save(review);

        notifyJudgesAdjustmentApproved(review);

        return toDetailResponse(review);
    }

    @Transactional
    public ScoreReviewResponse resolveReview(UUID eventId, UUID reviewId, UUID resolverId,
                                             ResolveScoreReviewRequest request) {
        eventOwnershipGuard.enforceEventOwnership(eventId);
        ScoreReviewRequest review = getReviewForEvent(eventId, reviewId);
        ScoreReviewStatus targetStatus = request.getStatus();

        if (targetStatus == ScoreReviewStatus.REJECTED || targetStatus == ScoreReviewStatus.IGNORED) {
            if (review.getStatus() != ScoreReviewStatus.OPEN) {
                throw new BusinessException("Only open requests can be rejected",
                        HttpStatus.BAD_REQUEST) {};
            }
            ScoreReviewStatus finalStatus = targetStatus == ScoreReviewStatus.IGNORED
                    ? ScoreReviewStatus.IGNORED : ScoreReviewStatus.REJECTED;
            return closeReview(review, resolverId, finalStatus, request.getResolutionNote());
        }

        if (targetStatus == ScoreReviewStatus.RESOLVED) {
            if (review.getStatus() != ScoreReviewStatus.APPROVED) {
                throw new BusinessException("Only approved requests can be marked resolved",
                        HttpStatus.BAD_REQUEST) {};
            }
            return closeReview(review, resolverId, ScoreReviewStatus.RESOLVED, request.getResolutionNote());
        }

        throw new BusinessException(
                "Resolution status must be RESOLVED, REJECTED, or IGNORED",
                HttpStatus.BAD_REQUEST) {};
    }

    @Transactional
    public void afterScoreUpdated(UUID submissionId) {
        Optional<ScoreReviewRequest> reviewOpt = scoreReviewRequestRepository.findBySubmissionId(submissionId);
        if (reviewOpt.isEmpty() || reviewOpt.get().getStatus() != ScoreReviewStatus.APPROVED) {
            return;
        }

        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return;
        }

        Optional<DeviationStats> stats = computeDeviationStats(submission);
        if (stats.isEmpty()) {
            return;
        }

        ScoreReviewRequest review = reviewOpt.get();
        review.setDeviationValue(stats.get().deviation());
        review.setMinJudgeScore(stats.get().min());
        review.setMaxJudgeScore(stats.get().max());

        if (stats.get().deviation().compareTo(deviationThreshold) < 0) {
            review.setStatus(ScoreReviewStatus.ADJUSTED);
            review.setResolvedAt(LocalDateTime.now());
            review.setResolvedBy(null);
            review.setResolutionNote(
                    "Scores aligned automatically after adjustment (deviation below threshold).");
            eventPublisher.publishEvent(new ScoreReviewResolvedEvent(
                    review.getId(), review.getEventId(), null,
                    ScoreReviewStatus.ADJUSTED.name(), review.getResolutionNote()));
        }

        scoreReviewRequestRepository.save(review);
    }

    @Transactional(readOnly = true)
    public ScoreReviewContextResponse getSubmissionContext(UUID eventId, UUID submissionId,
                                                           UUID requesterId, UserType requesterRole) {
        if (requesterRole == UserType.EVENT_COORDINATOR) {
            eventOwnershipGuard.enforceEventOwnership(eventId);
        }
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        RoundSnapshot round = eventPublicService.getRound(submission.getRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", submission.getRoundId()));
        if (!round.getEventId().equals(eventId)) {
            throw new ResourceNotFoundException("Submission", "id", submissionId);
        }

        if (requesterRole == UserType.LECTURER
                && !isJudgeInPoolForTeam(submission.getTeamId(), submission.getRoundId(), requesterId)) {
            throw new BusinessException(
                    "You are not assigned to this team's scoring for this round",
                    HttpStatus.FORBIDDEN) {};
        }

        Optional<ScoreReviewRequest> reviewOpt = scoreReviewRequestRepository.findBySubmissionId(submissionId);
        Optional<DeviationStats> stats = computeDeviationStats(submission);
        BigDecimal deviation = stats.map(DeviationStats::deviation).orElse(BigDecimal.ZERO);
        boolean deviationHigh = stats.isPresent()
                && deviation.compareTo(deviationThreshold) >= 0;

        ScoreReviewRequest review = reviewOpt.orElse(null);
        ScoreReviewStatus status = review != null ? review.getStatus() : null;
        boolean approved = review != null && status == ScoreReviewStatus.APPROVED;

        boolean judgeCompleted = requesterRole == UserType.LECTURER
                && judgeScoreRepository.findByJudgeUserIdAndSubmissionId(requesterId, submissionId)
                .map(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                .orElse(false);

        boolean canRequest = requesterRole == UserType.LECTURER
                && judgeCompleted
                && deviationHigh
                && !publishedResultRepository.existsByRoundId(submission.getRoundId())
                && !eventPublicService.isStaffCompleted(eventId)
                && (review == null
                        || !ACTIVE_STATUSES.contains(status)
                        || (status == ScoreReviewStatus.OPEN
                                && review.getAdjustmentType() == ScoreAdjustmentType.AUTO_DEVIATION));

        UUID noteAuthorId = review == null ? null
                : review.getResolvedBy() != null
                        ? review.getResolvedBy()
                        : (review.getStatus() == ScoreReviewStatus.APPROVED
                                ? review.getApprovedBy() : null);
        UserSnapshot resolver = noteAuthorId != null
                ? userPublicService.findById(noteAuthorId).orElse(null)
                : null;

        int scoreScaleMax = resolveScoreScaleMax(submission.getRoundId());
        List<ScoreReviewJudgeScoreResponse> breakdown = buildJudgeScoreBreakdown(
                submissionId, submission.getRoundId());

        return ScoreReviewContextResponse.builder()
                .reviewId(review != null ? review.getId() : null)
                .submissionId(submissionId)
                .status(status)
                .adjustmentType(review != null ? review.getAdjustmentType() : null)
                .deviationValue(deviation)
                .deviationThreshold(deviationThresholdValue)
                .scoreScaleMax(scoreScaleMax)
                .consensusIndex(computeConsensusIndex(breakdown))
                .cohenDThreshold(cohenDThresholdValue)
                .canRequestAdjustment(canRequest)
                .canEditForAdjustment(approved && requesterRole == UserType.LECTURER)
                .requestNote(review != null ? review.getRequestNote() : null)
                .resolutionNote(review != null ? review.getResolutionNote() : null)
                .resolvedBy(review != null ? review.getResolvedBy() : null)
                .resolvedByRole(resolver != null ? resolver.getUserType() : null)
                .resolvedByFullName(resolver != null ? resolver.getFullName() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ScoreReviewResponse> listReviews(UUID eventId, UUID roundId, ScoreReviewStatus status) {
        eventOwnershipGuard.enforceEventOwnership(eventId);
        return scoreReviewRequestRepository.findByEventFilters(eventId, roundId, status).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ScoreReviewResponse getReview(UUID eventId, UUID reviewId,
                                         UUID requesterId, UserType requesterRole) {
        if (requesterRole == UserType.EVENT_COORDINATOR) {
            eventOwnershipGuard.enforceEventOwnership(eventId);
        }
        ScoreReviewRequest review = getReviewForEvent(eventId, reviewId);
        assertReviewReadAccess(review, requesterId, requesterRole);
        return toDetailResponse(review);
    }

    @Transactional(readOnly = true)
    public Optional<UUID> findOpenReviewId(UUID submissionId) {
        return findActiveReview(submissionId).map(ScoreReviewRequest::getId);
    }

    @Transactional(readOnly = true)
    public Optional<ScoreReviewRequest> findActiveReview(UUID submissionId) {
        return scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .filter(r -> ACTIVE_STATUSES.contains(r.getStatus()));
    }

    @Transactional(readOnly = true)
    public boolean hasOpenReview(UUID submissionId) {
        return scoreReviewRequestRepository.existsBySubmissionIdAndStatus(
                submissionId, ScoreReviewStatus.OPEN);
    }

    @Transactional(readOnly = true)
    public boolean hasActiveReview(UUID submissionId) {
        return scoreReviewRequestRepository.existsBySubmissionIdAndStatusIn(
                submissionId, ACTIVE_STATUSES);
    }

    @Transactional(readOnly = true)
    public boolean isAdjustmentApproved(UUID submissionId) {
        return scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .map(r -> r.getStatus() == ScoreReviewStatus.APPROVED)
                .orElse(false);
    }

    public int getDeviationThresholdValue() {
        return deviationThresholdValue;
    }

    /**
     * Live deviation between finished judge scores when every assigned judge has completed.
     * Empty when scoring is incomplete or no assignments exist.
     */
    @Transactional(readOnly = true)
    public Optional<BigDecimal> findLiveDeviationValue(UUID submissionId) {
        return submissionRepository.findById(submissionId)
                .flatMap(this::computeDeviationStats)
                .map(DeviationStats::deviation);
    }

    private ScoreReviewRequest createOrReopenReview(
            Submission submission,
            DeviationStats deviationStats,
            ScoreAdjustmentType adjustmentType,
            UUID requestedBy,
            String requestNote) {
        Optional<ScoreReviewRequest> existing = scoreReviewRequestRepository.findBySubmissionId(
                submission.getId());

        ScoreReviewRequest review;
        if (existing.isPresent()) {
            review = existing.get();
            if (ACTIVE_STATUSES.contains(review.getStatus())) {
                throw new BusinessException(ACTIVE_REVIEW_CONFLICT_MESSAGE, HttpStatus.CONFLICT) {};
            }
            review.setStatus(ScoreReviewStatus.OPEN);
            review.setResolvedAt(null);
            review.setResolvedBy(null);
            review.setApprovedAt(null);
            review.setApprovedBy(null);
        } else {
            RoundSnapshot round = eventPublicService.getRound(submission.getRoundId())
                    .orElseThrow(() -> new ResourceNotFoundException("Round", "id", submission.getRoundId()));
            review = ScoreReviewRequest.builder()
                    .eventId(round.getEventId())
                    .roundId(submission.getRoundId())
                    .teamId(submission.getTeamId())
                    .submissionId(submission.getId())
                    .build();
        }

        review.setDeviationValue(deviationStats.deviation());
        review.setMinJudgeScore(deviationStats.min());
        review.setMaxJudgeScore(deviationStats.max());
        review.setAdjustmentType(adjustmentType);
        review.setRequestedBy(requestedBy);
        review.setRequestNote(requestNote);
        review.setResolutionNote(null);
        review.setStatus(ScoreReviewStatus.OPEN);
        review = scoreReviewRequestRepository.save(review);

        eventPublisher.publishEvent(new ScoreReviewCreatedEvent(
                review.getId(), review.getEventId(), submission.getId(),
                submission.getTeamId(), deviationStats.deviation()));

        return review;
    }

    private ScoreReviewRequest mergeJudgeRequestOntoAutoReview(
            ScoreReviewRequest review,
            DeviationStats deviationStats,
            UUID judgeId,
            String requestNote) {
        review.setDeviationValue(deviationStats.deviation());
        review.setMinJudgeScore(deviationStats.min());
        review.setMaxJudgeScore(deviationStats.max());
        review.setAdjustmentType(ScoreAdjustmentType.JUDGE_REQUESTED);
        review.setRequestedBy(judgeId);
        review.setRequestNote(requestNote);
        return scoreReviewRequestRepository.save(review);
    }

    private ScoreReviewResponse closeReview(ScoreReviewRequest review, UUID resolverId,
                                            ScoreReviewStatus status, String resolutionNote) {
        review.setStatus(status);
        review.setResolvedBy(resolverId);
        review.setResolvedAt(LocalDateTime.now());
        if (resolutionNote != null && !resolutionNote.isBlank()) {
            review.setResolutionNote(resolutionNote.trim());
        }
        review = scoreReviewRequestRepository.save(review);

        eventPublisher.publishEvent(new ScoreReviewResolvedEvent(
                review.getId(), review.getEventId(), resolverId,
                status.name(), review.getResolutionNote()));

        return toDetailResponse(review);
    }

    private void unlockScoresForSubmission(UUID submissionId) {
        judgeScoreRepository.updateStatusBySubmissionId(
                submissionId,
                List.of(ScoreStatus.LOCKED),
                ScoreStatus.COMPLETED);
    }

    private void notifyJudgesAdjustmentApproved(ScoreReviewRequest review) {
        List<UUID> judgeIds = judgeScoreRepository.findBySubmissionId(review.getSubmissionId()).stream()
                .map(JudgeScore::getJudgeUserId)
                .distinct()
                .toList();
        if (judgeIds.isEmpty()) {
            return;
        }

        String teamName = resolveTeamName(review.getTeamId());
        notificationService.createNotification(
                NotificationType.SCORE_ADJUSTMENT_APPROVED,
                "Score adjustment approved",
                "Coordinator approved a score adjustment for team \"" + teamName
                        + "\". You may revise your scores for this submission.",
                review.getId(),
                "ScoreReviewRequest",
                judgeIds);
    }

    private void assertNotPublished(UUID roundId) {
        if (publishedResultRepository.existsByRoundId(roundId)) {
            throw new BusinessException(
                    "Results have been published for this round",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void assertEventNotCompleted(UUID eventId) {
        if (eventPublicService.isStaffCompleted(eventId)) {
            throw new BusinessException(EVENT_COMPLETED_MESSAGE, HttpStatus.BAD_REQUEST) {};
        }
    }

    private void assertReviewReadAccess(ScoreReviewRequest review, UUID requesterId,
                                        UserType requesterRole) {
        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return;
        }
        if (requesterRole == UserType.LECTURER) {
            if (!isJudgeInPoolForTeam(review.getTeamId(), review.getRoundId(), requesterId)) {
                throw new BusinessException(
                        "You are not assigned to this team's scoring for this round",
                        HttpStatus.FORBIDDEN) {};
            }
            return;
        }
        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    private boolean isJudgeInPoolForTeam(UUID teamId, UUID roundId, UUID judgeUserId) {
        return teamRepository.findById(teamId)
                .map(team -> judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                        roundId, judgeUserId, team.getTrackId(), team.getGroupId()))
                .orElse(false);
    }

    private List<UUID> effectiveJudgePoolForTeam(UUID teamId, UUID roundId) {
        return teamRepository.findById(teamId)
                .map(team -> judgeAssignmentService.getEffectiveJudgeUserIdsForTeam(
                        roundId, teamId, team.getTrackId(), team.getGroupId()))
                .orElseGet(List::of);
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
        List<UUID> pool = effectiveJudgePoolForTeam(submission.getTeamId(), submission.getRoundId());
        if (pool.isEmpty()) {
            return Optional.empty();
        }

        // Deviation only counts scores from judges still in the pool, so a score left behind by a
        // removed or newly-conflicted judge cannot satisfy the completeness gate on its own.
        List<JudgeScore> finishedScores = judgeScoreRepository.findBySubmissionId(submission.getId()).stream()
                .filter(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                .filter(s -> pool.contains(s.getJudgeUserId()))
                .toList();

        if (finishedScores.size() < pool.size()) {
            return Optional.empty();
        }

        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(submission.getRoundId());
        Map<UUID, Integer> weightMap = criteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getWeight));
        int scoreScaleMax = resolveScoreScaleMax(submission.getRoundId());

        List<BigDecimal> percentScores = finishedScores.stream()
                .map(score -> toPercentScore(score, criteria, weightMap, scoreScaleMax))
                .sorted()
                .toList();

        BigDecimal min = percentScores.get(0);
        BigDecimal max = percentScores.get(percentScores.size() - 1);
        BigDecimal deviation = max.subtract(min).setScale(2, RoundingMode.HALF_UP);
        return Optional.of(new DeviationStats(min, max, deviation));
    }

    private record DeviationStats(BigDecimal min, BigDecimal max, BigDecimal deviation) {}

    private int resolveScoreScaleMax(UUID roundId) {
        return eventPublicService.getRound(roundId)
                .flatMap(round -> eventPublicService.getEvent(round.getEventId()))
                .map(event -> event.getScoreScaleMax() != null ? event.getScoreScaleMax() : 100)
                .orElse(100);
    }

    /**
     * Percent of event score scale: weightedScore / scoreScaleMax × 100.
     * Scale 10 → 10 = 100%; scale 5 → 5 = 100%.
     */
    private BigDecimal toPercentScore(JudgeScore score, List<CriteriaSnapshot> criteria,
                                      Map<UUID, Integer> weightMap, int scoreScaleMax) {
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
        return ScoreDeviationMath.toPercent(weighted, scoreScaleMax);
    }

    private ScoreReviewResponse toSummaryResponse(ScoreReviewRequest review) {
        UserSnapshot requester = review.getRequestedBy() != null
                ? userPublicService.findById(review.getRequestedBy()).orElse(null) : null;
        UUID noteAuthorId = review.getResolvedBy() != null
                ? review.getResolvedBy()
                : (review.getStatus() == ScoreReviewStatus.APPROVED
                        ? review.getApprovedBy() : null);
        UserSnapshot resolver = noteAuthorId != null
                ? userPublicService.findById(noteAuthorId).orElse(null) : null;

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
                .scoreScaleMax(resolveScoreScaleMax(review.getRoundId()))
                .cohenDThreshold(cohenDThresholdValue)
                .status(review.getStatus())
                .adjustmentType(review.getAdjustmentType())
                .requestedBy(review.getRequestedBy())
                .requestedByFullName(requester != null ? requester.getFullName() : null)
                .requestNote(review.getRequestNote())
                .approvedAt(review.getApprovedAt())
                .approvedBy(review.getApprovedBy())
                .createdAt(review.getCreatedAt())
                .resolvedAt(review.getResolvedAt())
                .resolvedBy(review.getResolvedBy())
                .resolvedByRole(resolver != null ? resolver.getUserType() : null)
                .resolvedByFullName(resolver != null ? resolver.getFullName() : null)
                .resolutionNote(review.getResolutionNote())
                .build();
    }

    private ScoreReviewResponse toDetailResponse(ScoreReviewRequest review) {
        ScoreReviewResponse response = toSummaryResponse(review);
        List<ScoreReviewJudgeScoreResponse> judges =
                buildJudgeScoreBreakdown(review.getSubmissionId(), review.getRoundId());
        response.setJudgeScores(judges);
        response.setConsensusIndex(computeConsensusIndex(judges));
        return response;
    }

    private List<ScoreReviewJudgeScoreResponse> buildJudgeScoreBreakdown(UUID submissionId, UUID roundId) {
        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(roundId);
        Map<UUID, Integer> weightMap = criteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getWeight));
        int scoreScaleMax = resolveScoreScaleMax(roundId);

        record ScoredJudge(JudgeScore score, BigDecimal weighted, BigDecimal percent) {}

        List<ScoredJudge> scored = judgeScoreRepository.findBySubmissionId(submissionId).stream()
                .filter(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                .map(score -> {
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
                    BigDecimal weighted = aggregationService.computeWeightedJudgeScore(
                            snapshot, weightMap, criteria);
                    BigDecimal percent = ScoreDeviationMath.toPercent(weighted, scoreScaleMax);
                    return new ScoredJudge(score, weighted, percent);
                })
                .toList();

        if (scored.isEmpty()) {
            return List.of();
        }

        List<BigDecimal> allPercents = scored.stream().map(ScoredJudge::percent).toList();
        BigDecimal maxPct = allPercents.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        List<ScoreReviewJudgeScoreResponse> result = new java.util.ArrayList<>();
        for (int i = 0; i < scored.size(); i++) {
            ScoredJudge sj = scored.get(i);
            BigDecimal gapFromMaxPct = maxPct.subtract(sj.percent()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal cohenD = ScoreDeviationMath.cohenDVsMajority(
                    allPercents, i, maxPct, deviationThreshold);
            // Flag by percent gap vs max (scale-normalized). Cohen's d is diagnostic for UI.
            boolean flagged = ScoreDeviationMath.isFlaggedByGap(gapFromMaxPct, deviationThreshold);
            UserSnapshot judge = userPublicService.findById(sj.score().getJudgeUserId()).orElse(null);
            result.add(ScoreReviewJudgeScoreResponse.builder()
                    .judgeUserId(sj.score().getJudgeUserId())
                    .judgeFullName(judge != null ? judge.getFullName() : null)
                    .weightedScore(sj.weighted().setScale(4, RoundingMode.HALF_UP))
                    .percentScore(sj.percent())
                    .gapFromMaxPct(gapFromMaxPct)
                    .cohenD(cohenD)
                    .flagged(flagged)
                    .status(sj.score().getStatus())
                    .build());
        }

        result.sort(Comparator.comparing(ScoreReviewJudgeScoreResponse::getPercentScore).reversed());
        return result;
    }

    private BigDecimal computeConsensusIndex(List<ScoreReviewJudgeScoreResponse> judges) {
        if (judges == null || judges.isEmpty()) {
            return null;
        }
        long flagged = judges.stream().filter(ScoreReviewJudgeScoreResponse::isFlagged).count();
        return ScoreDeviationMath.consensusIndex((int) flagged, judges.size());
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
