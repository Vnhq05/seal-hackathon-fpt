package com.sealhackathon.progress.service;

import com.sealhackathon.submission.domain.SubmissionVersion;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SubmissionProgressCalculator {

    public static final int REQUIRED_PARTS = 3;

    /**
     * Three equal parts: Slide, GitHub/source, Other (any otherUrl / legacy demoUrl / any attachment).
     * Percentages: 0 / 33.33 / 66.66 / 100.
     */
    public ProgressParts calculate(List<SubmissionVersion> versions) {
        if (versions == null || versions.isEmpty()) {
            return new ProgressParts(0, 0.0);
        }

        boolean hasSlide = false;
        boolean hasSource = false;
        boolean hasOther = false;

        for (SubmissionVersion version : versions) {
            if (isNonBlank(version.getSlideUrl())) {
                hasSlide = true;
            }
            if (isNonBlank(version.getGithubUrl())) {
                hasSource = true;
            }
            if (isNonBlank(version.getOtherUrl())
                    || isNonBlank(version.getDemoUrl())
                    || (version.getAttachments() != null && !version.getAttachments().isEmpty())) {
                hasOther = true;
            }
        }

        int submittedParts = countTrue(hasSlide, hasSource, hasOther);
        return new ProgressParts(submittedParts, percentForParts(submittedParts));
    }

    public static double percentForParts(int submittedParts) {
        return switch (submittedParts) {
            case 0 -> 0.0;
            case 1 -> 33.33;
            case 2 -> 66.66;
            default -> 100.0;
        };
    }

    private static int countTrue(boolean... flags) {
        int count = 0;
        for (boolean flag : flags) {
            if (flag) {
                count++;
            }
        }
        return count;
    }

    private static boolean isNonBlank(String value) {
        return value != null && !value.isBlank();
    }

    public record ProgressParts(int submittedParts, double submissionProgressPercent) {}
}
