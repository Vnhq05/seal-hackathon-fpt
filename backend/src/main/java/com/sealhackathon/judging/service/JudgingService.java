package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.JudgeComment;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.JudgeScoreDetail;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.request.ScoreDetailDto;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.CommentResponse;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.dto.response.ScoreDetailResponse;
import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.judging.event.ScoreDeletedEvent;
import com.sealhackathon.judging.event.ScoreUpdatedEvent;
import com.sealhackathon.judging.event.ScoringCompletedEvent;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JudgingService {

    private final JudgeScoreRepository judgeScoreRepository;
    private final ConflictDetectionService conflictDetectionService;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    private static final int SCORING_TIMER_HOURS = 2;

    // ── BR-34, BR-35, BR-36, BR-37: Submit scores ──
    @Transactional
    public JudgeScoreResponse submitScore(UUID judgeId, UUID roundId,
                                          ScoreSubmissionRequest request) {
        UUID submissionId = request.getSubmissionId();

        // BR-34: conflict of interest
        conflictDetectionService.checkConflict(judgeId, submissionId);

        // BR-40: check scoring deadline
        LocalDateTime scoringDeadline = eventPublicService.getScoringDeadline(roundId);
        if (LocalDateTime.now().isAfter(scoringDeadline)) {
            throw new BusinessException("Scoring deadline has passed", HttpStatus.BAD_REQUEST) {};
        }

        // Validate judge is assigned to this round
        if (!eventPublicService.isJudgeAssignedToRound(judgeId, roundId)) {
            throw new BusinessException("You are not assigned to judge this round",
                    HttpStatus.FORBIDDEN) {};
        }

        // Validate criteria match round's criteria
        List<CriteriaSnapshot> roundCriteria = eventPublicService.getCriteriaByRound(roundId);
        validateCriteriaMatch(request.getScores(), roundCriteria);

        // BR-36: validate comments for extreme scores
        validateExtremeScoreComments(request.getScores());

        // Check if already scored
        var existing = judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, submissionId);

        if (existing.isPresent()) {
            return updateExistingScore(existing.get(), request, roundCriteria);
        } else {
            return createNewScore(judgeId, roundId, request, roundCriteria);
        }
    }

    // ── BR-39: Update score before deadline ──
    @Transactional
    public JudgeScoreResponse updateScore(UUID judgeId, UUID judgeScoreId,
                                          ScoreSubmissionRequest request) {
        JudgeScore score = getJudgeScore(judgeScoreId);

        if (!score.getJudgeUserId().equals(judgeId)) {
            throw new BusinessException("You can only update your own scores",
                    HttpStatus.FORBIDDEN) {};
        }

        // BR-40: check locked
        if (score.getStatus() == ScoreStatus.LOCKED) {
            throw new BusinessException("Score is locked and cannot be modified",
                    HttpStatus.BAD_REQUEST) {};
        }

        // BR-37: check 2h timer
        if (score.getStartedAt().plusHours(SCORING_TIMER_HOURS).isBefore(LocalDateTime.now())) {
            throw new BusinessException("2-hour scoring timer has expired",
                    HttpStatus.BAD_REQUEST) {};
        }

        // BR-40: check scoring deadline
        LocalDateTime deadline = eventPublicService.getScoringDeadline(score.getRoundId());
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new BusinessException("Scoring deadline has passed", HttpStatus.BAD_REQUEST) {};
        }

        List<CriteriaSnapshot> roundCriteria = eventPublicService.getCriteriaByRound(score.getRoundId());
        validateCriteriaMatch(request.getScores(), roundCriteria);
        validateExtremeScoreComments(request.getScores());

        return updateExistingScore(score, request, roundCriteria);
    }

    // ── BR-40: Lock all scores after deadline (called by scheduler or manually) ──
    @Transactional
    public int lockScoresForRound(UUID roundId) {
        return judgeScoreRepository.updateStatusByRoundId(
                roundId, ScoreStatus.COMPLETED, ScoreStatus.LOCKED);
    }

    // ── Admin delete score ──
    @Transactional
    public void deleteScore(UUID judgeScoreId) {
        JudgeScore score = getJudgeScore(judgeScoreId);
        UUID submissionId = score.getSubmissionId();

        judgeScoreRepository.delete(score);

        eventPublisher.publishEvent(new ScoreDeletedEvent(
                judgeScoreId, score.getJudgeUserId(), submissionId, score.getRoundId()));
    }

    // ── Read endpoints ──

    @Transactional(readOnly = true)
    public JudgeScoreResponse getScoreById(UUID judgeScoreId) {
        return toResponse(getJudgeScore(judgeScoreId));
    }

    @Transactional(readOnly = true)
    public List<JudgeScoreResponse> getScoresBySubmission(UUID submissionId) {
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

    // ═══ Private helpers ═══

    private JudgeScoreResponse createNewScore(UUID judgeId, UUID roundId,
                                               ScoreSubmissionRequest request,
                                               List<CriteriaSnapshot> roundCriteria) {
        JudgeScore score = JudgeScore.builder()
                .judgeUserId(judgeId)
                .submissionId(request.getSubmissionId())
                .roundId(roundId)
                .status(ScoreStatus.COMPLETED)
                .startedAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .build();

        Map<UUID, String> criteriaNames = roundCriteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getName));

        List<JudgeScoreDetail> details = new ArrayList<>();
        List<JudgeComment> comments = new ArrayList<>();

        for (ScoreDetailDto dto : request.getScores()) {
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
        score = judgeScoreRepository.save(score);

        eventPublisher.publishEvent(new ScoreCreatedEvent(
                score.getId(), judgeId, request.getSubmissionId(), roundId));

        checkScoringComplete(request.getSubmissionId());

        return toResponse(score);
    }

    private JudgeScoreResponse updateExistingScore(JudgeScore score,
                                                    ScoreSubmissionRequest request,
                                                    List<CriteriaSnapshot> roundCriteria) {
        List<UUID> changedCriteria = new ArrayList<>();

        Map<UUID, JudgeScoreDetail> existingDetails = score.getDetails().stream()
                .collect(Collectors.toMap(JudgeScoreDetail::getCriteriaId, d -> d));

        Map<UUID, JudgeComment> existingComments = score.getComments().stream()
                .collect(Collectors.toMap(JudgeComment::getCriteriaId, c -> c));

        for (ScoreDetailDto dto : request.getScores()) {
            JudgeScoreDetail detail = existingDetails.get(dto.getCriteriaId());
            if (detail != null) {
                if (!detail.getScore().equals(dto.getScore())) {
                    detail.setScore(dto.getScore());
                    changedCriteria.add(dto.getCriteriaId());
                }
            } else {
                score.getDetails().add(JudgeScoreDetail.builder()
                        .judgeScore(score)
                        .criteriaId(dto.getCriteriaId())
                        .score(dto.getScore())
                        .build());
                changedCriteria.add(dto.getCriteriaId());
            }

            JudgeComment comment = existingComments.get(dto.getCriteriaId());
            if (dto.getComment() != null && !dto.getComment().isBlank()) {
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

        score.setCompletedAt(LocalDateTime.now());
        score.setStatus(ScoreStatus.COMPLETED);
        score = judgeScoreRepository.save(score);

        if (!changedCriteria.isEmpty()) {
            eventPublisher.publishEvent(new ScoreUpdatedEvent(
                    score.getId(), score.getJudgeUserId(),
                    score.getSubmissionId(), score.getRoundId(), changedCriteria));
        }

        return toResponse(score);
    }

    private void validateCriteriaMatch(List<ScoreDetailDto> scores,
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

        if (scores.size() != roundCriteria.size()) {
            throw new BusinessException(
                    "Must provide scores for all " + roundCriteria.size() + " criteria. Got: " + scores.size(),
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateExtremeScoreComments(List<ScoreDetailDto> scores) {
        for (ScoreDetailDto dto : scores) {
            if ((dto.getScore() < 50 || dto.getScore() > 90)
                    && (dto.getComment() == null || dto.getComment().isBlank())) {
                throw new BusinessException(
                        "Comment is required for criteria " + dto.getCriteriaId() +
                                " because score " + dto.getScore() + " is below 50 or above 90",
                        HttpStatus.BAD_REQUEST) {};
            }
        }
    }

    private void checkScoringComplete(UUID submissionId) {
        int totalJudges = judgeScoreRepository.countBySubmissionId(submissionId);
        int completedJudges = judgeScoreRepository.countBySubmissionIdAndStatus(
                submissionId, ScoreStatus.COMPLETED);

        if (completedJudges > 0 && completedJudges == totalJudges) {
            eventPublisher.publishEvent(new ScoringCompletedEvent(submissionId, totalJudges));
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
