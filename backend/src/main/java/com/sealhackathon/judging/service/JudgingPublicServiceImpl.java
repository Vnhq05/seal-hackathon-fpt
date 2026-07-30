package com.sealhackathon.judging.service;

import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.dto.snapshot.ScoreDetailSnapshot;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.ScoreReviewRequestRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JudgingPublicServiceImpl implements JudgingPublicService {

    private static final List<ScoreReviewStatus> ACTIVE_REVIEW_STATUSES =
            List.of(ScoreReviewStatus.OPEN, ScoreReviewStatus.APPROVED);

    private final JudgeScoreRepository judgeScoreRepository;
    private final ScoreReviewRequestRepository scoreReviewRequestRepository;
    private final JudgeAssignmentService judgeAssignmentService;
    private final RoundRepository roundRepository;
    private final TeamRepository teamRepository;

    @Override
    @Transactional(readOnly = true)
    public List<JudgeScoreSnapshot> getScoresBySubmission(UUID submissionId) {
        return judgeScoreRepository.findBySubmissionId(submissionId).stream()
                .map(this::toSnapshot)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JudgeScoreSnapshot> getScoresByRound(UUID roundId) {
        return judgeScoreRepository.findByRoundId(roundId).stream()
                .map(this::toSnapshot)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public int getScoreCountBySubmission(UUID submissionId) {
        return judgeScoreRepository.countBySubmissionIdAndStatus(submissionId, ScoreStatus.COMPLETED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScoreDetailSnapshot> getDetailedScores(UUID submissionId) {
        return judgeScoreRepository.findBySubmissionId(submissionId).stream()
                .flatMap(score -> score.getDetails().stream())
                .map(d -> ScoreDetailSnapshot.builder()
                        .criteriaId(d.getCriteriaId())
                        .score(d.getScore())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFullyScored(UUID submissionId, int minJudges) {
        int completed = judgeScoreRepository.countBySubmissionIdAndStatus(
                submissionId, ScoreStatus.COMPLETED);
        return completed >= minJudges;
    }

    @Override
    @Transactional(readOnly = true)
    public int countCompletedScores(UUID submissionId) {
        return judgeScoreRepository.countBySubmissionIdAndStatus(submissionId, ScoreStatus.COMPLETED)
                + judgeScoreRepository.countBySubmissionIdAndStatus(submissionId, ScoreStatus.LOCKED);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAssignedJudges(UUID teamId, UUID roundId) {
        return teamRepository.findById(teamId)
                .map(team -> (long) judgeAssignmentService.getEffectiveJudgeUserIdsForTeam(
                        roundId, teamId, team.getTrackId(), team.getGroupId()).size())
                .orElse(0L);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsLockedScoreByRound(UUID roundId) {
        return judgeScoreRepository.existsByRoundIdAndStatus(roundId, ScoreStatus.LOCKED);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Integer> countCompletedScoresByRound(UUID roundId) {
        return judgeScoreRepository.countByRoundIdGroupBySubmission(
                        roundId, List.of(ScoreStatus.COMPLETED, ScoreStatus.LOCKED))
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> ((Number) row[1]).intValue()));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, Long> countAssignedJudgesByRound(UUID roundId) {
        return roundRepository.findById(roundId)
                .map(round -> {
                    List<Team> teams = teamRepository.findByEventId(round.getHackathonEvent().getId());
                    return judgeAssignmentService.countEffectiveJudgesByTeam(roundId, teams);
                })
                .orElseGet(Map::of);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveScoreReviews(UUID eventId) {
        return scoreReviewRequestRepository.existsByEventIdAndStatusIn(eventId, ACTIVE_REVIEW_STATUSES);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasActiveScoreReviewsForRound(UUID roundId) {
        return scoreReviewRequestRepository.existsByRoundIdAndStatusIn(roundId, ACTIVE_REVIEW_STATUSES);
    }

    private JudgeScoreSnapshot toSnapshot(JudgeScore score) {
        List<ScoreDetailSnapshot> details = score.getDetails().stream()
                .map(d -> ScoreDetailSnapshot.builder()
                        .criteriaId(d.getCriteriaId())
                        .score(d.getScore())
                        .build())
                .toList();

        return JudgeScoreSnapshot.builder()
                .id(score.getId())
                .judgeUserId(score.getJudgeUserId())
                .submissionId(score.getSubmissionId())
                .roundId(score.getRoundId())
                .status(score.getStatus())
                .details(details)
                .build();
    }
}
