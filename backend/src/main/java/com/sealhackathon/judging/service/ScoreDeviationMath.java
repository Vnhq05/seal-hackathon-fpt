package com.sealhackathon.judging.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Percent-of-scale deviation and Cohen's d vs the majority (near-max) cluster.
 */
final class ScoreDeviationMath {

    private ScoreDeviationMath() {}

    /** weightedScore / scoreScaleMax × 100 */
    static BigDecimal toPercent(BigDecimal weightedScore, int scoreScaleMax) {
        return weightedScore.multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(scoreScaleMax), 2, RoundingMode.HALF_UP);
    }

    /**
     * Majority = judges whose gap from max percent is ≤ deviation threshold.
     * Cohen's d is against that cluster (leave-one-out if the judge is in it).
     */
    static BigDecimal cohenDVsMajority(List<BigDecimal> allPercents, int index,
                                       BigDecimal maxPct, BigDecimal deviationThreshold) {
        List<Integer> majorityIdx = new ArrayList<>();
        for (int i = 0; i < allPercents.size(); i++) {
            BigDecimal gap = maxPct.subtract(allPercents.get(i));
            if (gap.compareTo(deviationThreshold) <= 0) {
                majorityIdx.add(i);
            }
        }
        if (majorityIdx.isEmpty()) {
            return null;
        }

        List<BigDecimal> majorityScores = majorityIdx.stream()
                .map(allPercents::get)
                .toList();

        boolean inMajority = majorityIdx.contains(index);
        if (inMajority) {
            int localIndex = majorityIdx.indexOf(index);
            return leaveOneOutCohenD(majorityScores, localIndex);
        }
        return effectSizeAgainstGroup(allPercents.get(index), majorityScores);
    }

    /**
     * Leave-one-out Cohen's d: (x_i − mean_others) / sample_sd_others.
     * Null when SD is undefined or zero while x differs from the others' mean.
     */
    static BigDecimal leaveOneOutCohenD(List<BigDecimal> allPercents, int index) {
        List<BigDecimal> others = new ArrayList<>(allPercents.size() - 1);
        for (int j = 0; j < allPercents.size(); j++) {
            if (j != index) {
                others.add(allPercents.get(j));
            }
        }
        return effectSizeAgainstGroup(allPercents.get(index), others);
    }

    static BigDecimal effectSizeAgainstGroup(BigDecimal xi, List<BigDecimal> group) {
        if (group == null || group.isEmpty()) {
            return null;
        }

        BigDecimal sum = group.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal mean = sum.divide(BigDecimal.valueOf(group.size()), 6, RoundingMode.HALF_UP);

        if (group.size() == 1) {
            if (xi.compareTo(mean) == 0) {
                return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            }
            return null;
        }

        BigDecimal sqSum = BigDecimal.ZERO;
        for (BigDecimal v : group) {
            BigDecimal diff = v.subtract(mean);
            sqSum = sqSum.add(diff.multiply(diff));
        }
        BigDecimal variance = sqSum.divide(BigDecimal.valueOf(group.size() - 1), 8, RoundingMode.HALF_UP);
        if (variance.compareTo(BigDecimal.ZERO) == 0) {
            if (xi.compareTo(mean) == 0) {
                return BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);
            }
            return null;
        }

        double sd = Math.sqrt(variance.doubleValue());
        if (sd == 0.0) {
            return null;
        }
        return xi.subtract(mean)
                .divide(BigDecimal.valueOf(sd), 4, RoundingMode.HALF_UP);
    }

    static boolean isFlaggedByGap(BigDecimal gapFromMaxPct, BigDecimal deviationThreshold) {
        return gapFromMaxPct.compareTo(deviationThreshold) > 0;
    }

    static BigDecimal consensusIndex(int flaggedCount, int totalJudges) {
        if (totalJudges <= 0) {
            return null;
        }
        return BigDecimal.ONE
                .subtract(BigDecimal.valueOf(flaggedCount)
                        .divide(BigDecimal.valueOf(totalJudges), 4, RoundingMode.HALF_UP))
                .setScale(4, RoundingMode.HALF_UP);
    }
}
