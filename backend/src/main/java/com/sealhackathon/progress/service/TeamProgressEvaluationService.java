package com.sealhackathon.progress.service;

import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.progress.config.ProgressProperties;
import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TeamProgressEvaluationService {

    static final int STALLED_DEADLINE_WINDOW_HOURS = 48;

    private final ProgressProperties progressProperties;
    private final Clock clock;

    public EvaluationResult evaluate(Submission submission,
                                     SubmissionVersion latestVersion,
                                     int totalVersions,
                                     RoundSnapshot round,
                                     boolean sealFormat) {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime submissionDeadline = round.getSubmissionDeadline();
        long hoursUntilDeadline = submissionDeadline != null
                ? Duration.between(now, submissionDeadline).toHours()
                : Long.MAX_VALUE;
        LocalDateTime lastSubmittedAt = latestVersion != null ? latestVersion.getSubmittedAt() : null;

        // Alerts only apply while the submission window is still open.
        if (submissionDeadline != null && !now.isBefore(submissionDeadline)) {
            return new EvaluationResult(
                    ProgressRiskLevel.OK, List.of(), totalVersions, lastSubmittedAt, hoursUntilDeadline);
        }

        // And only inside the lead-time window before the deadline (default 6h).
        LocalDateTime leadThreshold = submissionDeadline != null
                ? submissionDeadline.minusHours(progressProperties.getAlertLeadTimeHours())
                : null;
        if (leadThreshold != null && now.isBefore(leadThreshold)) {
            return new EvaluationResult(
                    ProgressRiskLevel.OK, List.of(), totalVersions, lastSubmittedAt, hoursUntilDeadline);
        }

        List<ProgressRiskReason> reasons = new ArrayList<>();

        boolean notStarted = submission == null
                || (submission.getStatus() == SubmissionStatus.DRAFT && totalVersions == 0);
        if (notStarted) {
            reasons.add(ProgressRiskReason.NOT_STARTED);
        }

        if (sealFormat
                && round.getRoundType() == RoundType.PRELIMINARY
                && round.getSlideDeadline() != null
                && now.isAfter(round.getSlideDeadline())
                && latestVersion != null
                && latestVersion.getSlideUrl() != null
                && latestVersion.getGithubUrl() == null
                && latestVersion.getDemoUrl() == null) {
            reasons.add(ProgressRiskReason.SLIDE_ONLY_PAST_GATE);
        }

        if (totalVersions == 1
                && latestVersion != null
                && leadThreshold != null
                && !latestVersion.getSubmittedAt().isBefore(leadThreshold)) {
            reasons.add(ProgressRiskReason.SINGLE_VERSION_LAST_MINUTE);
        }

        LocalDateTime stalledCutoff = now.minusHours(progressProperties.getStalledHours());
        if (totalVersions >= 1
                && latestVersion != null
                && latestVersion.getSubmittedAt().isBefore(stalledCutoff)
                && submissionDeadline != null
                && now.isBefore(submissionDeadline)
                && hoursUntilDeadline <= STALLED_DEADLINE_WINDOW_HOURS) {
            reasons.add(ProgressRiskReason.STALLED);
        }

        if (submission != null
                && submission.getStatus() == SubmissionStatus.SUBMITTED
                && latestVersion != null
                && (latestVersion.getAttachments() == null || latestVersion.getAttachments().isEmpty())) {
            reasons.add(ProgressRiskReason.MISSING_ATTACHMENT);
        }

        ProgressRiskLevel riskLevel = resolveRiskLevel(reasons);

        return new EvaluationResult(riskLevel, reasons, totalVersions, lastSubmittedAt, hoursUntilDeadline);
    }

    private ProgressRiskLevel resolveRiskLevel(List<ProgressRiskReason> reasons) {
        if (reasons.isEmpty()) {
            return ProgressRiskLevel.OK;
        }
        Set<ProgressRiskReason> critical = EnumSet.of(
                ProgressRiskReason.NOT_STARTED,
                ProgressRiskReason.SLIDE_ONLY_PAST_GATE);
        if (reasons.stream().anyMatch(critical::contains)) {
            return ProgressRiskLevel.CRITICAL;
        }
        return ProgressRiskLevel.AT_RISK;
    }

    public record EvaluationResult(
            ProgressRiskLevel riskLevel,
            List<ProgressRiskReason> reasons,
            int totalVersions,
            LocalDateTime lastSubmittedAt,
            long hoursUntilDeadline) {}
}
