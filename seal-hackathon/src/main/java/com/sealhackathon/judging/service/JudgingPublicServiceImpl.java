package com.sealhackathon.judging.service;

import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.dto.snapshot.ScoreDetailSnapshot;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JudgingPublicServiceImpl implements JudgingPublicService {

    private final JudgeScoreRepository judgeScoreRepository;

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
