package com.sealhackathon.ranking.service;

import com.sealhackathon.event.dto.snapshot.CriteriaSnapshot;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
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
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
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

    @Transactional
    public List<Ranking> recalculate(UUID roundId) {
        List<CriteriaSnapshot> criteria = eventPublicService.getCriteriaByRound(roundId);
        Map<UUID, Integer> weightMap = criteria.stream()
                .collect(Collectors.toMap(CriteriaSnapshot::getId, CriteriaSnapshot::getWeight));

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

            BigDecimal roundScore = computeRoundScore(scores, weightMap, criteria);
            Map<UUID, BigDecimal> criteriaAverages = computeCriteriaAverages(scores, criteria);
            List<BigDecimal> judgeWeightedScores = scores.stream()
                    .map(j -> computeWeightedJudgeScore(j, weightMap, criteria))
                    .toList();
            BigDecimal scoreDeviation = computeScoreDeviation(judgeWeightedScores);
            LocalDateTime submittedAt = submissionPublicService.getSubmittedAt(submission.getId());

            teamScores.add(new TeamScore(
                    submission.getTeamId(), roundScore, criteriaAverages, scoreDeviation, submittedAt, criteria));
        }

        String tiebreakerCriteria = eventPublicService.getRound(roundId)
                .flatMap(round -> eventPublicService.getEvent(round.getEventId()))
                .map(EventSnapshot::getTiebreakerCriteria)
                .orElse(null);

        teamScores.sort(buildComparator(criteria, tiebreakerCriteria));

        int nextVersion = rankingRepository.findMaxVersionByRoundId(roundId) + 1;
        LocalDateTime now = LocalDateTime.now();

        List<Ranking> rankings = new ArrayList<>();
        for (int i = 0; i < teamScores.size(); i++) {
            TeamScore ts = teamScores.get(i);
            int rank;
            if (i == 0) {
                rank = 1;
            } else {
                TeamScore prev = teamScores.get(i - 1);
                rank = ts.roundScore.compareTo(prev.roundScore) == 0
                        ? rankings.get(i - 1).getRank()
                        : i + 1;
            }
            rankings.add(Ranking.builder()
                    .teamId(ts.teamId)
                    .roundId(roundId)
                    .finalScore(ts.roundScore)
                    .rank(rank)
                    .version(nextVersion)
                    .calculatedAt(now)
                    .build());
        }

        rankings = rankingRepository.saveAll(rankings);

        eventPublisher.publishEvent(
                new RankingRecalculatedEvent(roundId, nextVersion, rankings.size()));

        return rankings;
    }

    /**
     * WeightedJudgeScore = Σ(criterionScore × criterionWeight / 100)
     */
    BigDecimal computeWeightedJudgeScore(JudgeScoreSnapshot judgeScore,
                                         Map<UUID, Integer> weightMap,
                                         List<CriteriaSnapshot> criteria) {
        BigDecimal total = BigDecimal.ZERO;
        for (CriteriaSnapshot c : criteria) {
            int score = judgeScore.getDetails().stream()
                    .filter(d -> d.getCriteriaId().equals(c.getId()))
                    .map(ScoreDetailSnapshot::getScore)
                    .findFirst()
                    .orElse(0);
            BigDecimal weight = BigDecimal.valueOf(weightMap.getOrDefault(c.getId(), 0))
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
            total = total.add(BigDecimal.valueOf(score).multiply(weight));
        }
        return total.setScale(4, RoundingMode.HALF_UP);
    }

    /**
     * RoundScore = mean of weighted judge scores (trimmed when >= 5 judges per BR-46).
     */
    BigDecimal computeRoundScore(List<JudgeScoreSnapshot> scores,
                                 Map<UUID, Integer> weightMap,
                                 List<CriteriaSnapshot> criteria) {
        if (scores.isEmpty()) return BigDecimal.ZERO;

        List<BigDecimal> weightedScores = scores.stream()
                .map(j -> computeWeightedJudgeScore(j, weightMap, criteria))
                .sorted()
                .collect(Collectors.toList());

        if (weightedScores.size() >= 5) {
            weightedScores = weightedScores.subList(1, weightedScores.size() - 1);
        }

        BigDecimal sum = weightedScores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(weightedScores.size()), 4, RoundingMode.HALF_UP);
    }

    /**
     * FinalScore = Σ(RoundScore × RoundWeight / 100) across all rounds with rankings.
     */
    public BigDecimal computeEventFinalScore(UUID teamId, UUID eventId) {
        List<RoundSnapshot> rounds = eventPublicService.getRoundsByEvent(eventId);
        BigDecimal total = BigDecimal.ZERO;

        for (RoundSnapshot round : rounds) {
            int version = rankingRepository.findMaxVersionByRoundId(round.getId());
            if (version == 0) continue;

            var rankingOpt = rankingRepository.findByRoundIdAndVersionOrderByRankAsc(round.getId(), version).stream()
                    .filter(r -> r.getTeamId().equals(teamId))
                    .findFirst();

            if (rankingOpt.isPresent()) {
                int weight = round.getRoundWeight() != null ? round.getRoundWeight() : 100;
                BigDecimal roundWeight = BigDecimal.valueOf(weight)
                        .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
                total = total.add(rankingOpt.get().getFinalScore().multiply(roundWeight));
            }
        }

        return total.setScale(4, RoundingMode.HALF_UP);
    }

    /** @deprecated Use {@link #computeRoundScore} — kept for tests migrating from old API. */
    @Deprecated
    BigDecimal computeFinalScore(List<JudgeScoreSnapshot> scores,
                                 Map<UUID, Integer> weightMap,
                                 List<CriteriaSnapshot> criteria) {
        return computeRoundScore(scores, weightMap, criteria);
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
                    return simpleMean(rawScores);
                }
        ));
    }

    BigDecimal simpleMean(List<Integer> rawScores) {
        if (rawScores.isEmpty()) return BigDecimal.ZERO;
        double sum = rawScores.stream().mapToInt(Integer::intValue).sum();
        return BigDecimal.valueOf(sum / rawScores.size()).setScale(4, RoundingMode.HALF_UP);
    }

    BigDecimal computeScoreDeviation(List<BigDecimal> judgeWeightedScores) {
        if (judgeWeightedScores.size() <= 1) return BigDecimal.ZERO;

        double mean = judgeWeightedScores.stream()
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        double variance = judgeWeightedScores.stream()
                .mapToDouble(s -> Math.pow(s.doubleValue() - mean, 2))
                .average()
                .orElse(0.0);

        return BigDecimal.valueOf(Math.sqrt(variance)).setScale(4, RoundingMode.HALF_UP);
    }

    /**
     * Tie-break: criteria per event tiebreaker config → lower deviation → earlier submit.
     */
    private Comparator<TeamScore> buildComparator(List<CriteriaSnapshot> criteria, String tiebreakerCriteria) {
        Comparator<TeamScore> comp = Comparator.comparing(
                (TeamScore ts) -> ts.roundScore, Comparator.reverseOrder());

        List<CriteriaSnapshot> sorted;
        if (tiebreakerCriteria != null && !tiebreakerCriteria.isBlank()) {
            List<String> order = Arrays.stream(tiebreakerCriteria.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();

            Map<String, Integer> nameOrder = new HashMap<>();
            for (int i = 0; i < order.size(); i++) {
                nameOrder.put(order.get(i).toLowerCase(), i);
            }

            sorted = criteria.stream()
                    .sorted(Comparator.comparingInt(c ->
                            nameOrder.getOrDefault(c.getName().toLowerCase(), Integer.MAX_VALUE)))
                    .toList();
        } else {
            sorted = criteria.stream()
                    .sorted(Comparator.comparingInt(CriteriaSnapshot::getSortOrder))
                    .toList();
        }

        for (CriteriaSnapshot c : sorted) {
            comp = comp.thenComparing(
                    ts -> ts.criteriaAverages.getOrDefault(c.getId(), BigDecimal.ZERO),
                    Comparator.reverseOrder());
        }

        comp = comp.thenComparing(ts -> ts.scoreDeviation);
        comp = comp.thenComparing(ts -> ts.submittedAt);

        return comp;
    }

    record TeamScore(UUID teamId, BigDecimal roundScore,
                     Map<UUID, BigDecimal> criteriaAverages,
                     BigDecimal scoreDeviation,
                     LocalDateTime submittedAt,
                     List<CriteriaSnapshot> criteria) {}
}
