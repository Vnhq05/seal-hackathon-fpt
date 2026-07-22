package com.sealhackathon.progress.service;

import com.sealhackathon.submission.domain.SubmissionVersion;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SubmissionProgressCalculator {

    public static final int REQUIRED_PARTS = 4;
    public static final int PERCENT_PER_PART = 25;

    public ProgressParts calculate(List<SubmissionVersion> versions) {
        if (versions == null || versions.isEmpty()) {
            return new ProgressParts(0, 0);
        }

        boolean hasSlide = false;
        boolean hasSource = false;
        boolean hasDemo = false;
        boolean hasPdf = false;

        for (SubmissionVersion version : versions) {
            if (isNonBlank(version.getSlideUrl())) {
                hasSlide = true;
            }
            if (isNonBlank(version.getGithubUrl())) {
                hasSource = true;
            }
            if (isNonBlank(version.getDemoUrl())) {
                hasDemo = true;
            }
            if (version.getAttachments() != null && !version.getAttachments().isEmpty()) {
                hasPdf = true;
            }
        }

        int submittedParts = countTrue(hasSlide, hasSource, hasDemo, hasPdf);
        int percent = submittedParts * PERCENT_PER_PART;
        return new ProgressParts(submittedParts, percent);
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

    public record ProgressParts(int submittedParts, int submissionProgressPercent) {}
}
