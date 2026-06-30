package com.sealhackathon.judging.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.JudgeComment;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.JudgeScoreDetail;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.ScoreDetailDto;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.CommentResponse;
import com.sealhackathon.judging.dto.response.JudgeScoringAssignmentResponse;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.dto.response.ScoreDetailResponse;
import com.sealhackathon.judging.event.ScoreChangeDetail;
import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.judging.event.ScoreDeletedEvent;
import com.sealhackathon.judging.event.ScoreUpdatedEvent;
import com.sealhackathon.judging.event.ScoringCompletedEvent;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.domain.Submission;
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

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamRepository teamRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final ConflictDetectionService conflictDetectionService;
    private final ScoreReviewService scoreReviewService;
    private final EventPublicService eventPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final TeamPublicService teamPublicService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public JudgeScoreResponse submitScore(UUID judgeId, UUID roundId,
                                          ScoreSubmissionRequest request) {
        UUID submissionId = request.getSubmissionId();
        boolean completing = request.getComplete() == null || Boolean.TRUE.equals(request.getComplete());

        conflictDetectionService.checkConflict(judgeId, submissionId);
        assertScoringWindowOpen(roundId);

        if (!isJudgeAssignedToTeam(judgeId, submissionId, roundId)) {
            throw new BusinessException("You are not assigned to score this team for this round",
                    HttpStatus.FORBIDDEN) {};
        }

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
            if (score.getStatus() == ScoreStatus.LOCKED) {
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

        if (score.getStatus() == ScoreStatus.LOCKED) {
            throw new BusinessException("Score is locked and cannot be modified",
                    HttpStatus.BAD_REQUEST) {};
        }

        assertScoringWindowOpen(score.getRoundId());
        conflictDetectionService.checkConflict(judgeId, score.getSubmissionId());

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
    public List<JudgeScoringAssignmentResponse> getMyScoringAssignments(UUID judgeId) {
        List<TeamJudgeAssignment> assignments = teamJudgeAssignmentRepository.findByJudgeUserId(judgeId);
        return assignments.stream()
                .filter(a -> roundRepository.existsById(a.getRoundId())
                        && teamRepository.existsById(a.getTeamId()))
                .map(a -> buildScoringAssignment(judgeId, a))
                .toList();
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
        if (requesterRole == UserType.LECTURER
                && !isJudgeAssignedToTeam(requesterId, submissionId, roundId)) {
            throw new BusinessException(
                    "You are not assigned to score this team for this round",
                    HttpStatus.FORBIDDEN) {};
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

    private JudgeScoringAssignmentResponse buildScoringAssignment(UUID judgeId, TeamJudgeAssignment a) {
        Team team = teamRepository.findById(a.getTeamId()).orElse(null);
        Round round = roundRepository.findById(a.getRoundId()).orElse(null);
        HackathonEvent event = team != null
                ? eventRepository.findById(team.getEventId()).orElse(null) : null;
        Track track = team != null && team.getTrackId() != null
                ? trackRepository.findById(team.getTrackId()).orElse(null) : null;

        Submission submission = submissionRepository
                .findByTeamIdAndRoundId(a.getTeamId(), a.getRoundId()).orElse(null);

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

        boolean mentorConflict = teamPublicService.isMentorOfTeam(judgeId, a.getTeamId());
        boolean hasOpenReview = submission != null
                && scoreReviewService.hasOpenReview(submission.getId());
        UUID openReviewId = hasOpenReview && submission != null
                ? scoreReviewService.findOpenReviewId(submission.getId()).orElse(null)
                : null;

        return JudgeScoringAssignmentResponse.builder()
                .teamId(a.getTeamId())
                .teamName(team != null ? team.getName() : "Unknown")
                .roundId(a.getRoundId())
                .roundName(round != null ? round.getName() : "Unknown")
                .eventId(event != null ? event.getId() : null)
                .eventName(event != null ? event.getName() : null)
                .trackId(team != null ? team.getTrackId() : null)
                .trackName(track != null ? track.getName() : null)
                .submissionId(submission != null ? submission.getId() : null)
                .scoringStatus(scoringStatus)
                .scoringDeadline(round != null ? round.getScoringDeadline() : null)
                .conflictOfInterest(mentorConflict)
                .conflictReason(mentorConflict ? "MENTOR_OF_TEAM" : null)
                .hasOpenScoreReview(hasOpenReview)
                .openScoreReviewId(openReviewId)
                .build();
    }

    private boolean isJudgeAssignedToTeam(UUID judgeId, UUID submissionId, UUID roundId) {
        UUID teamId = submissionPublicService.getSubmission(submissionId)
                .map(s -> s.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        return teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(
                teamId, roundId, judgeId);
    }

    private void assertScoreReadAccess(JudgeScore score, UUID requesterId, UserType requesterRole) {
        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return;
        }
        if (requesterRole == UserType.LECTURER && !score.getJudgeUserId().equals(requesterId)) {
            throw new BusinessException("You can only view your own scores", HttpStatus.FORBIDDEN) {};
        }
    }

    private void assertScoringWindowOpen(UUID roundId) {
        LocalDateTime scoringDeadline = eventPublicService.getScoringDeadline(roundId);
        if (LocalDateTime.now().isAfter(scoringDeadline)) {
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

        long totalAssignedJudges = teamJudgeAssignmentRepository.countByTeamIdAndRoundId(
                submission.getTeamId(), submission.getRoundId());
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
