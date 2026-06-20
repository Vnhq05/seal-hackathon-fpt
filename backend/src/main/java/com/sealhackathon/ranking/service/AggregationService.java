package com.sealhackathon.ranking.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.dto.snapshot.JudgeScoreSnapshot;
import com.sealhackathon.judging.dto.snapshot.ScoreDetailSnapshot;
import com.sealhackathon.judging.service.JudgingPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.event.RankingRecalculatedEvent;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AggregationService {

    private final JudgingPublicService judgingPublicService;
    private final EventPublicService eventPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final RankingRepository rankingRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final int TRIMMED_MEAN_THRESHOLD = 5;

    @Transactional
    public List<Ranking> recalculate(UUID roundId) {
        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(roundId);
        Map<UUID, Integer> weightMap = criteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getWeight));

        // BR-50: exclude Pending/NOT_SCORED submissions
        List<SubmissionSnapshot> submissions = submissionPublicService.getSubmissionsByRound(roundId)
                .stream()
                .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED
                        || s.getStatus() == SubmissionStatus.SCORED)
                .toList();

        List<TeamScore> teamScores = new ArrayList<>();

        for (SubmissionSnapshot submission : submissions) {
            List<JudgeScoreSnapshot> scores = judgingPublicService.getScoresBySubmission(submission.getId())
                    .stream()
                    .filter(s -> s.getStatus() == ScoreStatus.COMPLETED || s.getStatus() == ScoreStatus.LOCKED)
                    .toList();

            if (scores.isEmpty()) continue;

            // BR-44, BR-45, BR-46: compute final score
            BigDecimal finalScore = computeFinalScore(scores, weightMap, criteria);

            // BR-47: per-criteria scores for tie-breaking
            Map<UUID, BigDecimal> criteriaScores = computeCriteriaAverages(scores, criteria);
            LocalDateTime submittedAt = submissionPublicService.getSubmittedAt(submission.getId());

            teamScores.add(new TeamScore(
                    submission.getTeamId(), finalScore, criteriaScores, submittedAt, criteria));
        }

        // BR-47: sort with tie-break
        teamScores.sort(buildComparator(criteria));

        // Create new version
        int nextVersion = rankingRepository.findMaxVersionByRoundId(roundId) + 1;
        LocalDateTime now = LocalDateTime.now();

        List<Ranking> rankings = new ArrayList<>();
        for (int i = 0; i < teamScores.size(); i++) {
            TeamScore ts = teamScores.get(i);
            rankings.add(Ranking.builder()
                    .teamId(ts.teamId)
                    .roundId(roundId)
                    .finalScore(ts.finalScore)
                    .rank(i + 1)
                    .version(nextVersion)
                    .calculatedAt(now)
                    .build());
        }

        rankings = rankingRepository.saveAll(rankings);

        eventPublisher.publishEvent(
                new RankingRecalculatedEvent(roundId, nextVersion, rankings.size()));

        return rankings;
    }

    // ── BR-44, BR-45, BR-46 ──
    BigDecimal computeFinalScore(List<JudgeScoreSnapshot> scores,
                                 Map<UUID, Integer> weightMap,
                                 List<CriteriaSnapshot> criteria) {
        BigDecimal total = BigDecimal.ZERO;

        for (CriteriaSnapshot c : criteria) {
            List<Integer> rawScores = scores.stream()
                    .flatMap(s -> s.getDetails().stream())
                    .filter(d -> d.getCriteriaId().equals(c.getId()))
                    .map(ScoreDetailSnapshot::getScore)
                    .toList();

            BigDecimal mean = computeMean(rawScores);
            BigDecimal weight = BigDecimal.valueOf(weightMap.getOrDefault(c.getId(), 0))
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

            total = total.add(mean.multiply(weight));
        }

        return total.setScale(4, RoundingMode.HALF_UP);
    }

    // ── BR-45, BR-46 ──
    BigDecimal computeMean(List<Integer> rawScores) {
        if (rawScores.isEmpty()) return BigDecimal.ZERO;

        List<Integer> sorted = rawScores.stream().sorted().collect(Collectors.toList());

        // BR-46: trimmed mean when ≥ 5 judges
        if (sorted.size() >= TRIMMED_MEAN_THRESHOLD) {
            sorted.remove(0);
            sorted.remove(sorted.size() - 1);
        }

        double sum = sorted.stream().mapToInt(Integer::intValue).sum();
        return BigDecimal.valueOf(sum / sorted.size()).setScale(4, RoundingMode.HALF_UP);
    }

    Map<UUID, BigDecimal> computeCriteriaAverages(List<JudgeScoreSnapshot> scores,
                                                   List<CriteriaSnapshot> criteria) {
        return criteria.stream().collect(Collectors.toMap(
                CriteriaSnapshot::getId,
                c -> {
                    List<Integer> rawScores = scores.stream()
                            .flatMap(s -> s.getDetails().stream())
                            .filter(d -> d.getCriteriaId().equals(c.getId()))
                            .map(ScoreDetailSnapshot::getScore)
                            .toList();
                    return computeMean(rawScores);
                }
        ));
    }

    // ── BR-47: Tie-break order: Technical → Innovation → Presentation → submittedAt ──
    private Comparator<TeamScore> buildComparator(List<CriteriaSnapshot> criteria) {
        Comparator<TeamScore> comp = Comparator.comparing(
                (TeamScore ts) -> ts.finalScore, Comparator.reverseOrder());

        List<CriteriaSnapshot> sorted = criteria.stream()
                .sorted(Comparator.comparingInt(CriteriaSnapshot::getSortOrder))
                .toList();

        for (CriteriaSnapshot c : sorted) {
            comp = comp.thenComparing(
                    ts -> ts.criteriaScores.getOrDefault(c.getId(), BigDecimal.ZERO),
                    Comparator.reverseOrder());
        }

        comp = comp.thenComparing(ts -> ts.submittedAt);

        return comp;
    }

    record TeamScore(UUID teamId, BigDecimal finalScore,
                     Map<UUID, BigDecimal> criteriaScores,
                     LocalDateTime submittedAt,
                     List<CriteriaSnapshot> criteria) {}
}
