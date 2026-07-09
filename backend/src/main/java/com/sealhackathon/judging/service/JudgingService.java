package com.sealhackathon.judging.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.domain.JudgeComment;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.JudgeScoreDetail;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.ScoreDetailDto;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.CommentResponse;
import com.sealhackathon.judging.dto.response.JudgeRoundSubmissionResponse;
import com.sealhackathon.judging.dto.response.JudgeScoringAssignmentResponse;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.dto.response.ScoreDetailResponse;
import com.sealhackathon.judging.event.ScoreChangeDetail;
import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.judging.event.ScoreDeletedEvent;
import com.sealhackathon.judging.event.ScoreUpdatedEvent;
import com.sealhackathon.judging.event.ScoringCompletedEvent;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JudgingService {

    private static final int DEFAULT_MIN_SCORE = 1;
    private static final int DEFAULT_MAX_SCORE = 5;

    private final JudgeScoreRepository judgeScoreRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final JudgeAssignmentService judgeAssignmentService;
    private final SubmissionRepository submissionRepository;
    private final TeamRepository teamRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final CompetitionGroupRepository competitionGroupRepository;
    private final ConflictDetectionService conflictDetectionService;
    private final ScoreReviewService scoreReviewService;
    private final EventPublicService eventPublicService;
    private final FormatRuleEngine formatRuleEngine;
    private final PublishedResultRepository publishedResultRepository;
    private final FinalistSelectionRepository finalistSelectionRepository;
    private final SubmissionPublicService submissionPublicService;
    private final TeamPublicService teamPublicService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public JudgeScoreResponse submitScore(UUID judgeId, UUID roundId,
                                          ScoreSubmissionRequest request) {
        UUID submissionId = request.getSubmissionId();
        boolean completing = request.getComplete() == null || Boolean.TRUE.equals(request.getComplete());

        assertCanScore(judgeId, roundId, submissionId);

        List<CriteriaSnapshot> roundCriteria = eventPublicService.getCriteriaByRound(roundId);
        validateCriteriaBelongToRound(request.getScores(), roundCriteria);
        validateScoreRange(request.getScores(), roundCriteria);
        if (completing) {
            validateAllCriteriaPresent(request.getScores(), roundCriteria);
            validateExtremeScoreComments(request.getScores(), roundCriteria);
        }

        var existing = judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, submissionId);

        if (existing.isPresent()) {
            JudgeScore score = existing.get();
            if (score.getStatus() == ScoreStatus.LOCKED
                    && !scoreReviewService.isAdjustmentApproved(submissionId)) {
                throw new BusinessException("Score is locked and cannot be modified",
                        HttpStatus.BAD_REQUEST) {};
            }
            try {
                return saveScore(score, request, roundCriteria, completing);
            } catch (OptimisticLockingFailureException e) {
                throw new BusinessException(
                        "Concurrent score modification detected. Please retry.",
                        HttpStatus.CONFLICT) {};
            }
        }
        try {
            return createNewScore(judgeId, roundId, request, roundCriteria, completing);
        } catch (OptimisticLockingFailureException e) {
            throw new BusinessException(
                    "Concurrent score modification detected. Please retry.",
                    HttpStatus.CONFLICT) {};
        }
    }

    @Transactional
    public JudgeScoreResponse updateScore(UUID judgeId, UUID judgeScoreId,
                                          ScoreSubmissionRequest request) {
        JudgeScore score = getJudgeScore(judgeScoreId);
        boolean completing = request.getComplete() == null || Boolean.TRUE.equals(request.getComplete());

        if (!score.getJudgeUserId().equals(judgeId)) {
            throw new BusinessException("You can only update your own scores",
                    HttpStatus.FORBIDDEN) {};
        }

        if (score.getStatus() == ScoreStatus.LOCKED
                && !scoreReviewService.isAdjustmentApproved(score.getSubmissionId())) {
            throw new BusinessException("Score is locked and cannot be modified",
                    HttpStatus.BAD_REQUEST) {};
        }

        assertCanScore(judgeId, score.getRoundId(), score.getSubmissionId());

        List<CriteriaSnapshot> roundCriteria = eventPublicService.getCriteriaByRound(score.getRoundId());
        validateCriteriaBelongToRound(request.getScores(), roundCriteria);
        validateScoreRange(request.getScores(), roundCriteria);
        if (completing) {
            validateAllCriteriaPresent(request.getScores(), roundCriteria);
            validateExtremeScoreComments(request.getScores(), roundCriteria);
        }

        try {
            return saveScore(score, request, roundCriteria, completing);
        } catch (OptimisticLockingFailureException e) {
            throw new BusinessException(
                    "Concurrent score modification detected. Please retry.",
                    HttpStatus.CONFLICT) {};
        }
    }

    @Transactional
    public int lockScoresForRound(UUID roundId) {
        int lockedCompleted = judgeScoreRepository.updateStatusByRoundId(
                roundId, ScoreStatus.COMPLETED, ScoreStatus.LOCKED);
        int lockedInProgress = judgeScoreRepository.updateStatusByRoundId(
                roundId, ScoreStatus.IN_PROGRESS, ScoreStatus.LOCKED);
        return lockedCompleted + lockedInProgress;
    }

    @Transactional
    public void deleteScore(UUID judgeScoreId, UUID roundId) {
        JudgeScore score = getJudgeScore(judgeScoreId);

        if (!score.getRoundId().equals(roundId)) {
            throw new BusinessException("Score does not belong to this round", HttpStatus.BAD_REQUEST) {};
        }
        if (score.getStatus() == ScoreStatus.LOCKED) {
            throw new BusinessException("Cannot delete a locked score", HttpStatus.BAD_REQUEST) {};
        }

        UUID submissionId = score.getSubmissionId();

        judgeScoreRepository.delete(score);

        eventPublisher.publishEvent(new ScoreDeletedEvent(
                judgeScoreId, score.getJudgeUserId(), submissionId, score.getRoundId()));
    }

    @Transactional(readOnly = true)
    public List<JudgeRoundSubmissionResponse> getRoundSubmissionsForJudge(
            UUID judgeId, UUID roundId, String filter) {
        return getMyScoringAssignments(judgeId).stream()
                .filter(a -> a.getRoundId().equals(roundId))
                .filter(a -> a.getSubmissionId() != null)
                .map(a -> toRoundSubmissionResponse(judgeId, a))
                .filter(item -> matchesSubmissionFilter(item.getScoringStatus(), filter))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JudgeScoringAssignmentResponse> getMyScoringAssignments(UUID judgeId) {
        List<JudgeAssignment> poolAssignments = judgeAssignmentRepository.findByJudgeUserId(judgeId);
        Set<String> seen = new HashSet<>();
        List<JudgeScoringAssignmentResponse> result = new ArrayList<>();

        for (JudgeAssignment assignment : poolAssignments) {
            if (!assignment.isActive()) {
                continue;
            }
            Round round = assignment.getRound();
            UUID roundId = round.getId();
            if (!roundRepository.existsById(roundId)) {
                continue;
            }

            UUID eventId = round.getHackathonEvent().getId();
            List<Team> teams = switch (assignment.getScope()) {
                case ROUND -> teamRepository.findByEventId(eventId);
                case TRACK -> teamRepository.findByEventIdAndTrackId(eventId, assignment.getTrackId());
                case GROUP -> teamRepository.findByEventIdAndGroupId(eventId, assignment.getGroupId());
            };

            for (Team team : teams) {
                String key = team.getId() + ":" + roundId;
                if (!seen.add(key) || !teamRepository.existsById(team.getId())) {
                    continue;
                }
                result.add(buildScoringAssignmentForTeam(judgeId, team.getId(), roundId, assignment));
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public JudgeScoreResponse getScoreById(UUID judgeScoreId, UUID requesterId, UserType requesterRole) {
        JudgeScore score = getJudgeScore(judgeScoreId);
        assertScoreReadAccess(score, requesterId, requesterRole);
        return toResponse(score);
    }

    @Transactional(readOnly = true)
    public List<JudgeScoreResponse> getScoresBySubmission(
            UUID submissionId, UUID roundId, UUID requesterId, UserType requesterRole) {
        if (requesterRole == UserType.LECTURER) {
            if (!isJudgeAssignedToSubmissionScope(requesterId, submissionId, roundId)) {
                throw new BusinessException(
                        "You are not assigned to score this team for this round",
                        HttpStatus.FORBIDDEN) {};
            }
            return judgeScoreRepository.findByJudgeUserIdAndSubmissionId(requesterId, submissionId)
                    .map(this::toResponse)
                    .map(List::of)
                    .orElse(List.of());
        }
        return judgeScoreRepository.findBySubmissionId(submissionId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JudgeScoreResponse> getScoresByRound(UUID roundId) {
        return judgeScoreRepository.findByRoundId(roundId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JudgeScoreResponse> getMyScores(UUID judgeId) {
        return judgeScoreRepository.findByJudgeUserId(judgeId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public JudgeScoreResponse getMyScoreForSubmission(UUID judgeId, UUID submissionId) {
        JudgeScore score = judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("JudgeScore",
                        "judge+submission", judgeId + " / " + submissionId));
        return toResponse(score);
    }

    private JudgeScoringAssignmentResponse buildScoringAssignmentForTeam(
            UUID judgeId, UUID teamId, UUID roundId, JudgeAssignment coveringAssignment) {
        Team team = teamRepository.findById(teamId).orElse(null);
        Round round = roundRepository.findById(roundId).orElse(null);
        HackathonEvent event = team != null
                ? eventRepository.findById(team.getEventId()).orElse(null) : null;
        Track track = team != null && team.getTrackId() != null
                ? trackRepository.findById(team.getTrackId()).orElse(null) : null;
        CompetitionGroup group = team != null && team.getGroupId() != null
                ? competitionGroupRepository.findById(team.getGroupId()).orElse(null) : null;

        Submission submission = submissionRepository
                .findByTeamIdAndRoundId(teamId, roundId).orElse(null);

        Optional<JudgeScore> myScore = submission != null
                ? judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, submission.getId())
                : Optional.empty();

        String scoringStatus = "NOT_STARTED";
        if (myScore.isPresent()) {
            scoringStatus = switch (myScore.get().getStatus()) {
                case IN_PROGRESS -> "IN_PROGRESS";
                case COMPLETED -> "COMPLETED";
                case LOCKED -> "LOCKED";
            };
        }

        String conflictReason = team != null
                ? conflictDetectionService.resolveConflictReason(judgeId, team) : null;
        boolean mentorConflict = conflictReason != null;
        boolean hasOpenReview = submission != null
                && scoreReviewService.hasActiveReview(submission.getId());
        UUID openReviewId = hasOpenReview && submission != null
                ? scoreReviewService.findOpenReviewId(submission.getId()).orElse(null)
                : null;

        String deniedReason = team != null && round != null
                ? resolveScoringDeniedReason(judgeId, roundId, team, submission, round, myScore.orElse(null))
                : "Assignment data unavailable";
        boolean scoringAllowed = deniedReason == null;

        return JudgeScoringAssignmentResponse.builder()
                .teamId(teamId)
                .teamName(team != null ? team.getName() : "Unknown")
                .roundId(roundId)
                .roundName(round != null ? round.getName() : "Unknown")
                .eventId(event != null ? event.getId() : null)
                .eventName(event != null ? event.getName() : null)
                .trackId(team != null ? team.getTrackId() : null)
                .trackName(track != null ? track.getName() : null)
                .groupId(team != null ? team.getGroupId() : null)
                .groupName(group != null ? group.getName() : null)
                .assignmentScope(coveringAssignment != null ? coveringAssignment.getScope() : null)
                .submissionId(submission != null ? submission.getId() : null)
                .submissionStatus(submission != null ? submission.getStatus() : null)
                .submittedAt(resolveSubmittedAt(submission))
                .scoringStatus(scoringStatus)
                .scoringDeadline(round != null ? round.getScoringDeadline() : null)
                .conflictOfInterest(mentorConflict)
                .conflictReason(conflictReason)
                .scoringAllowed(scoringAllowed)
                .scoringDeniedReason(deniedReason)
                .hasOpenScoreReview(hasOpenReview)
                .openScoreReviewId(openReviewId)
                .build();
    }

    private JudgeRoundSubmissionResponse toRoundSubmissionResponse(
            UUID judgeId, JudgeScoringAssignmentResponse assignment) {
        BigDecimal weightedScore = null;
        BigDecimal maxWeightedScore = computeMaxWeightedScore(assignment.getRoundId());

        if (assignment.getSubmissionId() != null
                && ("COMPLETED".equals(assignment.getScoringStatus())
                || "LOCKED".equals(assignment.getScoringStatus()))) {
            weightedScore = judgeScoreRepository
                    .findByJudgeUserIdAndSubmissionId(judgeId, assignment.getSubmissionId())
                    .map(score -> computeWeightedScore(score, assignment.getRoundId()))
                    .orElse(null);
        }

        return JudgeRoundSubmissionResponse.builder()
                .submissionId(assignment.getSubmissionId())
                .teamId(assignment.getTeamId())
                .teamName(assignment.getTeamName())
                .trackId(assignment.getTrackId())
                .trackName(assignment.getTrackName())
                .groupId(assignment.getGroupId())
                .groupName(assignment.getGroupName())
                .submittedAt(assignment.getSubmittedAt())
                .scoringDeadline(assignment.getScoringDeadline())
                .submissionStatus(assignment.getSubmissionStatus())
                .scoringStatus(assignment.getScoringStatus())
                .weightedScore(weightedScore)
                .maxWeightedScore(maxWeightedScore)
                .conflictOfInterest(assignment.isConflictOfInterest())
                .conflictReason(assignment.getConflictReason())
                .scoringAllowed(assignment.isScoringAllowed())
                .scoringDeniedReason(assignment.getScoringDeniedReason())
                .build();
    }

    private boolean isJudgeAssignedToSubmissionScope(UUID judgeId, UUID submissionId, UUID roundId) {
        UUID teamId = resolveTeamId(submissionId);
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        return judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                roundId, judgeId, team.getTrackId(), team.getGroupId());
    }

    private void assertScoreReadAccess(JudgeScore score, UUID requesterId, UserType requesterRole) {
        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return;
        }
        if (requesterRole == UserType.LECTURER && !score.getJudgeUserId().equals(requesterId)) {
            throw new BusinessException("You can only view your own scores", HttpStatus.FORBIDDEN) {};
        }
    }

    private LocalDateTime resolveSubmittedAt(Submission submission) {
        if (submission == null) {
            return null;
        }
        return submissionPublicService.getSubmission(submission.getId())
                .map(s -> s.getSubmittedAt())
                .orElse(submission.getUpdatedAt());
    }

    private void assertCanScore(UUID judgeId, UUID roundId, UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        if (!submission.getRoundId().equals(roundId)) {
            throw new BusinessException("Submission does not belong to this round",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (submission.getStatus() != SubmissionStatus.SUBMITTED
                && submission.getStatus() != SubmissionStatus.SCORED) {
            throw new BusinessException("Team has not submitted for this round",
                    HttpStatus.BAD_REQUEST) {};
        }

        Team team = teamRepository.findById(submission.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", submission.getTeamId()));

        UUID eventId = team.getEventId();
        formatRuleEngine.assertCanScore(eventId);
        assertScoringWindowOpen(roundId);
        assertScoringNotLocked(roundId, eventId);

        if (!judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                roundId, judgeId, team.getTrackId(), team.getGroupId())) {
            throw new BusinessException("You are not assigned to score this team for this round",
                    HttpStatus.FORBIDDEN) {};
        }

        conflictDetectionService.checkConflict(judgeId, submissionId);
    }

    private String resolveScoringDeniedReason(
            UUID judgeId, UUID roundId, Team team, Submission submission,
            Round round, JudgeScore existingScore) {
        if (submission == null) {
            return "Team has not submitted for this round";
        }
        if (submission.getStatus() != SubmissionStatus.SUBMITTED
                && submission.getStatus() != SubmissionStatus.SCORED) {
            return "Team has not submitted for this round";
        }

        EventStatus eventStatus = eventPublicService.getResolvedEventStatus(team.getEventId());
        if (eventStatus != EventStatus.SCORING) {
            return "Event is not in SCORING phase";
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(round.getStartDate())) {
            return "Round scoring has not opened yet";
        }
        if (now.isAfter(round.getScoringDeadline())
                && !scoreReviewService.isAdjustmentApproved(submission.getId())) {
            return "Scoring deadline has passed";
        }

        if (publishedResultRepository.existsByRoundId(roundId)) {
            return "Results have been published for this round";
        }

        if (round.getRoundType() != RoundType.FINAL
                && !finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(team.getEventId()).isEmpty()) {
            return "Finalists have been confirmed";
        }

        if (!judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                roundId, judgeId, team.getTrackId(), team.getGroupId())) {
            return "You are not assigned to score this team for this round";
        }

        String conflictReason = conflictDetectionService.resolveConflictReason(judgeId, team);
        if (conflictReason != null) {
            return "Conflict of interest";
        }

        if (existingScore != null && existingScore.getStatus() == ScoreStatus.LOCKED
                && !scoreReviewService.isAdjustmentApproved(submission.getId())) {
            return "Score is locked";
        }

        return null;
    }

    private void assertScoringNotLocked(UUID roundId, UUID eventId) {
        if (publishedResultRepository.existsByRoundId(roundId)) {
            throw new BusinessException("Results have been published for this round",
                    HttpStatus.BAD_REQUEST) {};
        }
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        if (round.getRoundType() != RoundType.FINAL
                && !finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(eventId).isEmpty()) {
            throw new BusinessException("Finalists have been confirmed; scoring is locked",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private boolean matchesSubmissionFilter(String scoringStatus, String filter) {
        if (filter == null || filter.isBlank() || "all".equalsIgnoreCase(filter)) {
            return true;
        }
        return switch (filter.toLowerCase()) {
            case "unscored" -> "NOT_STARTED".equals(scoringStatus);
            case "draft" -> "IN_PROGRESS".equals(scoringStatus);
            case "submitted", "scored" -> "COMPLETED".equals(scoringStatus);
            case "locked" -> "LOCKED".equals(scoringStatus);
            default -> true;
        };
    }

    private BigDecimal computeMaxWeightedScore(UUID roundId) {
        return eventPublicService.getCriteriaByRound(roundId).stream()
                .map(c -> {
                    int max = c.getMaxScore() != null ? c.getMaxScore() : DEFAULT_MAX_SCORE;
                    return BigDecimal.valueOf(max)
                            .multiply(BigDecimal.valueOf(c.getWeight()))
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal computeWeightedScore(JudgeScore score, UUID roundId) {
        Map<UUID, CriteriaSnapshot> criteriaById = eventPublicService.getCriteriaByRound(roundId).stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, c -> c));

        return score.getDetails().stream()
                .map(detail -> {
                    CriteriaSnapshot criterion = criteriaById.get(detail.getCriteriaId());
                    int weight = criterion != null ? criterion.getWeight() : 0;
                    return BigDecimal.valueOf(detail.getScore())
                            .multiply(BigDecimal.valueOf(weight))
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void assertScoringWindowOpen(UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(round.getStartDate())) {
            throw new BusinessException("Round scoring has not opened yet", HttpStatus.BAD_REQUEST) {};
        }
        if (now.isAfter(round.getScoringDeadline())) {
            throw new BusinessException("Scoring deadline has passed", HttpStatus.BAD_REQUEST) {};
        }
    }

    private JudgeScoreResponse createNewScore(UUID judgeId, UUID roundId,
                                               ScoreSubmissionRequest request,
                                               List<CriteriaSnapshot> roundCriteria,
                                               boolean completing) {
        UUID teamId = resolveTeamId(request.getSubmissionId());
        LocalDateTime now = LocalDateTime.now();

        JudgeScore score = JudgeScore.builder()
                .judgeUserId(judgeId)
                .submissionId(request.getSubmissionId())
                .roundId(roundId)
                .status(completing ? ScoreStatus.COMPLETED : ScoreStatus.IN_PROGRESS)
                .startedAt(now)
                .completedAt(completing ? now : null)
                .build();

        applyScoreDetails(score, request.getScores());
        score = judgeScoreRepository.save(score);

        eventPublisher.publishEvent(new ScoreCreatedEvent(
                score.getId(), judgeId, request.getSubmissionId(), roundId, teamId));

        if (completing) {
            checkScoringComplete(request.getSubmissionId());
        }

        return toResponse(score);
    }

    private JudgeScoreResponse saveScore(JudgeScore score,
                                          ScoreSubmissionRequest request,
                                          List<CriteriaSnapshot> roundCriteria,
                                          boolean completing) {
        UUID teamId = resolveTeamId(score.getSubmissionId());
        List<ScoreChangeDetail> changes = new ArrayList<>();

        Map<UUID, JudgeScoreDetail> existingDetails = score.getDetails().stream()
                .collect(Collectors.toMap(JudgeScoreDetail::getCriteriaId, d -> d));

        Map<UUID, JudgeComment> existingComments = score.getComments().stream()
                .collect(Collectors.toMap(JudgeComment::getCriteriaId, c -> c));

        for (ScoreDetailDto dto : request.getScores()) {
            JudgeScoreDetail detail = existingDetails.get(dto.getCriteriaId());
            if (detail != null) {
                if (!detail.getScore().equals(dto.getScore())) {
                    changes.add(new ScoreChangeDetail(dto.getCriteriaId(), detail.getScore(), dto.getScore()));
                    detail.setScore(dto.getScore());
                }
            } else {
                changes.add(new ScoreChangeDetail(dto.getCriteriaId(), null, dto.getScore()));
                score.getDetails().add(JudgeScoreDetail.builder()
                        .judgeScore(score)
                        .criteriaId(dto.getCriteriaId())
                        .score(dto.getScore())
                        .build());
            }

            if (dto.getComment() != null && !dto.getComment().isBlank()) {
                JudgeComment comment = existingComments.get(dto.getCriteriaId());
                if (comment != null) {
                    comment.setComment(dto.getComment());
                } else {
                    score.getComments().add(JudgeComment.builder()
                            .judgeScore(score)
                            .criteriaId(dto.getCriteriaId())
                            .comment(dto.getComment())
                            .build());
                }
            }
        }

        if (completing) {
            score.setStatus(ScoreStatus.COMPLETED);
            score.setCompletedAt(LocalDateTime.now());
            checkScoringComplete(score.getSubmissionId());
            scoreReviewService.afterScoreUpdated(score.getSubmissionId());
        } else {
            score.setStatus(ScoreStatus.IN_PROGRESS);
        }

        score = judgeScoreRepository.save(score);

        if (!changes.isEmpty()) {
            eventPublisher.publishEvent(new ScoreUpdatedEvent(
                    score.getId(), score.getJudgeUserId(),
                    score.getSubmissionId(), score.getRoundId(), teamId, changes));
        }

        return toResponse(score);
    }

    private void applyScoreDetails(JudgeScore score, List<ScoreDetailDto> scores) {
        List<JudgeScoreDetail> details = new ArrayList<>();
        List<JudgeComment> comments = new ArrayList<>();

        for (ScoreDetailDto dto : scores) {
            details.add(JudgeScoreDetail.builder()
                    .judgeScore(score)
                    .criteriaId(dto.getCriteriaId())
                    .score(dto.getScore())
                    .build());

            if (dto.getComment() != null && !dto.getComment().isBlank()) {
                comments.add(JudgeComment.builder()
                        .judgeScore(score)
                        .criteriaId(dto.getCriteriaId())
                        .comment(dto.getComment())
                        .build());
            }
        }

        score.setDetails(details);
        score.setComments(comments);
    }

    private UUID resolveTeamId(UUID submissionId) {
        return submissionPublicService.getSubmission(submissionId)
                .map(s -> s.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));
    }

    private void validateCriteriaBelongToRound(List<ScoreDetailDto> scores,
                                               List<CriteriaSnapshot> roundCriteria) {
        var validIds = roundCriteria.stream()
                .map(CriteriaSnapshot::getId)
                .collect(Collectors.toSet());

        for (ScoreDetailDto dto : scores) {
            if (!validIds.contains(dto.getCriteriaId())) {
                throw new BusinessException(
                        "Criteria " + dto.getCriteriaId() + " does not belong to this round",
                        HttpStatus.BAD_REQUEST) {};
            }
        }
    }

    private void validateAllCriteriaPresent(List<ScoreDetailDto> scores,
                                            List<CriteriaSnapshot> roundCriteria) {
        Set<UUID> submittedIds = scores.stream()
                .map(ScoreDetailDto::getCriteriaId)
                .collect(Collectors.toSet());

        if (submittedIds.size() != scores.size()) {
            throw new BusinessException(
                    "Duplicate criteria in score submission",
                    HttpStatus.BAD_REQUEST) {};
        }

        Set<UUID> requiredIds = roundCriteria.stream()
                .map(CriteriaSnapshot::getId)
                .collect(Collectors.toSet());

        if (!submittedIds.equals(requiredIds)) {
            throw new BusinessException(
                    "Must provide scores for all " + requiredIds.size() + " criteria. Got: " + submittedIds.size(),
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateScoreRange(List<ScoreDetailDto> scores,
                                    List<CriteriaSnapshot> roundCriteria) {
        var criteriaById = roundCriteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, c -> c));

        for (ScoreDetailDto dto : scores) {
            CriteriaSnapshot criterion = criteriaById.get(dto.getCriteriaId());
            if (criterion == null) {
                continue;
            }
            int min = criterion.getMinScore() != null ? criterion.getMinScore() : DEFAULT_MIN_SCORE;
            int max = criterion.getMaxScore() != null ? criterion.getMaxScore() : DEFAULT_MAX_SCORE;
            if (dto.getScore() < min || dto.getScore() > max) {
                throw new BusinessException(
                        "Score " + dto.getScore() + " for criteria " + dto.getCriteriaId()
                                + " must be between " + min + " and " + max,
                        HttpStatus.BAD_REQUEST) {};
            }
        }
    }

    private void validateExtremeScoreComments(List<ScoreDetailDto> scores,
                                              List<CriteriaSnapshot> roundCriteria) {
        var criteriaById = roundCriteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, c -> c));

        for (ScoreDetailDto dto : scores) {
            CriteriaSnapshot criterion = criteriaById.get(dto.getCriteriaId());
            if (criterion == null) {
                continue;
            }
            int min = criterion.getMinScore() != null ? criterion.getMinScore() : DEFAULT_MIN_SCORE;
            int max = criterion.getMaxScore() != null ? criterion.getMaxScore() : DEFAULT_MAX_SCORE;
            if ((dto.getScore() == min || dto.getScore() == max)
                    && (dto.getComment() == null || dto.getComment().isBlank())) {
                throw new BusinessException(
                        "Comment is required for criteria " + dto.getCriteriaId() +
                                " because score " + dto.getScore() + " is at the minimum or maximum of the scale",
                        HttpStatus.BAD_REQUEST) {};
            }
        }
    }

    private void checkScoringComplete(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        Team team = teamRepository.findById(submission.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", submission.getTeamId()));
        long totalAssignedJudges = judgeAssignmentService
                .getEligibleJudgeUserIds(submission.getRoundId(), team.getTrackId(), team.getGroupId())
                .size();
        int completedJudges = judgeScoreRepository.countBySubmissionIdAndStatus(
                submissionId, ScoreStatus.COMPLETED);

        if (totalAssignedJudges > 0 && completedJudges >= totalAssignedJudges) {
            eventPublisher.publishEvent(new ScoringCompletedEvent(submissionId, (int) totalAssignedJudges));
        }
    }

    JudgeScore getJudgeScore(UUID id) {
        return judgeScoreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JudgeScore", "id", id));
    }

    private JudgeScoreResponse toResponse(JudgeScore score) {
        Map<UUID, String> criteriaNames = eventPublicService.getCriteriaByRound(score.getRoundId())
                .stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getName));

        UserSnapshot judge = userPublicService.findById(score.getJudgeUserId()).orElse(null);

        List<ScoreDetailResponse> details = score.getDetails().stream()
                .map(d -> ScoreDetailResponse.builder()
                        .id(d.getId())
                        .criteriaId(d.getCriteriaId())
                        .criteriaName(criteriaNames.getOrDefault(d.getCriteriaId(), "Unknown"))
                        .score(d.getScore())
                        .build())
                .toList();

        List<CommentResponse> comments = score.getComments().stream()
                .map(c -> CommentResponse.builder()
                        .id(c.getId())
                        .criteriaId(c.getCriteriaId())
                        .criteriaName(criteriaNames.getOrDefault(c.getCriteriaId(), "Unknown"))
                        .comment(c.getComment())
                        .build())
                .toList();

        return JudgeScoreResponse.builder()
                .id(score.getId())
                .judgeUserId(score.getJudgeUserId())
                .judgeFullName(judge != null ? judge.getFullName() : null)
                .submissionId(score.getSubmissionId())
                .roundId(score.getRoundId())
                .status(score.getStatus())
                .startedAt(score.getStartedAt())
                .completedAt(score.getCompletedAt())
                .details(details)
                .comments(comments)
                .build();
    }
}
