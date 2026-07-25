package com.sealhackathon.ranking.service;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Computes how many teams advance from a bucket (group / track / global pool)
 * based on pool size and hidden config — not entered on the round form.
 *
 * N = clamp(ceil(T * ratio), min, max), then min(N, T).
 */
@Component
@Getter
public class AdvancementCutoffCalculator {

    @Value("${app.hackathon.advancement.auto:true}")
    private boolean autoEnabled;

    @Value("${app.hackathon.advancement.ratio:0.25}")
    private double ratio;

    @Value("${app.hackathon.advancement.min-per-bucket:1}")
    private int minPerBucket;

    @Value("${app.hackathon.advancement.max-per-bucket:10}")
    private int maxPerBucket;

    /**
     * @param teamCount number of eligible teams in the bucket (group/track/global)
     * @return number that should advance from that bucket (at least 1 when teamCount &gt; 0)
     */
    public int compute(int teamCount) {
        if (teamCount <= 0) {
            return 0;
        }
        if (!autoEnabled) {
            return Math.min(Math.max(minPerBucket, 1), teamCount);
        }
        int raw = (int) Math.ceil(teamCount * ratio);
        int n = Math.max(minPerBucket, Math.min(maxPerBucket, raw));
        return Math.min(n, teamCount);
    }
}
