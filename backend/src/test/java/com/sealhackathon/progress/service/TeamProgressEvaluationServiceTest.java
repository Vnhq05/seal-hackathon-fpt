package com.sealhackathon.progress.service;

import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.progress.config.ProgressProperties;
import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TeamProgressEvaluationServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime DEADLINE = LocalDateTime.of(2026, 7, 10, 23, 59);

    private ProgressProperties properties;
    private TeamProgressEvaluationService service;

    @BeforeEach
    void setUp() {
        properties = new ProgressProperties();
        setField(properties, "alertLeadTimeHours", 6);
        setField(properties, "stalledHours", 24);
        setField(properties, "cooldownHours", 12);
    }

    @Test
    void evaluate_notStarted_whenNoSubmissionNearDeadline() {
        Clock clock = fixedAt(DEADLINE.minusHours(5));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(null, null, 0, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.CRITICAL);
        assertThat(result.reasons()).containsExactly(ProgressRiskReason.NOT_STARTED);
    }

    @Test
    void evaluate_ok_whenDeadlineHasPassedEvenIfNotStarted() {
        Clock clock = fixedAt(DEADLINE.plusHours(1));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(null, null, 0, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.OK);
        assertThat(result.reasons()).isEmpty();
    }

    @Test
    void evaluate_slideOnlyPastGate_forSealPreliminary() {
        LocalDateTime slideDeadline = LocalDateTime.of(2026, 7, 10, 10, 0);
        Clock clock = fixedAt(DEADLINE.minusHours(3));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = RoundSnapshot.builder()
                .id(UUID.randomUUID())
                .eventId(UUID.randomUUID())
                .roundNumber(1)
                .roundType(RoundType.PRELIMINARY)
                .submissionDeadline(DEADLINE)
                .slideDeadline(slideDeadline)
                .scoringDeadline(DEADLINE.plusDays(2))
                .build();

        Submission submission = Submission.builder()
                .status(SubmissionStatus.SUBMITTED)
                .build();
        SubmissionVersion latest = SubmissionVersion.builder()
                .slideUrl("https://slides.example.com/deck")
                .submittedAt(slideDeadline.minusHours(1))
                .attachments(Collections.emptyList())
                .build();

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(submission, latest, 1, round, true);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.CRITICAL);
        assertThat(result.reasons()).contains(ProgressRiskReason.SLIDE_ONLY_PAST_GATE);
    }

    @Test
    void evaluate_ok_whenOutsideAlertLeadWindowEvenIfRisky() {
        Clock clock = fixedAt(DEADLINE.minusDays(2));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);
        Submission submission = Submission.builder().status(SubmissionStatus.SUBMITTED).build();
        SubmissionVersion latest = SubmissionVersion.builder()
                .githubUrl("https://github.com/org/repo")
                .submittedAt(DEADLINE.minusDays(3))
                .attachments(Collections.emptyList())
                .build();

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(submission, latest, 1, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.OK);
        assertThat(result.reasons()).isEmpty();
    }

    @Test
    void evaluate_singleVersionLastMinute() {
        Clock clock = fixedAt(DEADLINE.minusHours(3));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);
        Submission submission = Submission.builder().status(SubmissionStatus.SUBMITTED).build();
        SubmissionVersion latest = SubmissionVersion.builder()
                .githubUrl("https://github.com/org/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .submittedAt(DEADLINE.minusHours(4))
                .attachments(Collections.emptyList())
                .build();

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(submission, latest, 1, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.AT_RISK);
        assertThat(result.reasons()).contains(ProgressRiskReason.SINGLE_VERSION_LAST_MINUTE);
    }

    @Test
    void evaluate_stalled_whenNoRecentVersionWithin48hOfDeadline() {
        Clock clock = fixedAt(DEADLINE.minusHours(3));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);
        Submission submission = Submission.builder().status(SubmissionStatus.SUBMITTED).build();
        SubmissionVersion latest = SubmissionVersion.builder()
                .githubUrl("https://github.com/org/repo")
                .submittedAt(DEADLINE.minusHours(60))
                .attachments(Collections.emptyList())
                .build();

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(submission, latest, 2, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.AT_RISK);
        assertThat(result.reasons()).contains(ProgressRiskReason.STALLED);
    }

    @Test
    void evaluate_missingAttachment_whenSubmittedWithEmptyAttachments() {
        Clock clock = fixedAt(DEADLINE.minusHours(3));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);
        Submission submission = Submission.builder().status(SubmissionStatus.SUBMITTED).build();
        SubmissionVersion latest = SubmissionVersion.builder()
                .githubUrl("https://github.com/org/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .submittedAt(DEADLINE.minusHours(4))
                .attachments(Collections.emptyList())
                .build();

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(submission, latest, 2, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.AT_RISK);
        assertThat(result.reasons()).contains(ProgressRiskReason.MISSING_ATTACHMENT);
    }

    @Test
    void evaluate_ok_whenHealthyProgress() {
        Clock clock = fixedAt(DEADLINE.minusDays(3));
        service = new TeamProgressEvaluationService(properties, clock);

        RoundSnapshot round = preliminaryRound(DEADLINE);
        Submission submission = Submission.builder().status(SubmissionStatus.SCORED).build();
        SubmissionVersion latest = SubmissionVersion.builder()
                .githubUrl("https://github.com/org/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .submittedAt(DEADLINE.minusDays(1))
                .attachments(Collections.emptyList())
                .build();

        TeamProgressEvaluationService.EvaluationResult result =
                service.evaluate(submission, latest, 2, round, false);

        assertThat(result.riskLevel()).isEqualTo(ProgressRiskLevel.OK);
        assertThat(result.reasons()).isEmpty();
    }

    private RoundSnapshot preliminaryRound(LocalDateTime submissionDeadline) {
        return RoundSnapshot.builder()
                .id(UUID.randomUUID())
                .eventId(UUID.randomUUID())
                .roundNumber(1)
                .roundType(RoundType.PRELIMINARY)
                .submissionDeadline(submissionDeadline)
                .scoringDeadline(submissionDeadline.plusDays(2))
                .build();
    }

    private Clock fixedAt(LocalDateTime dateTime) {
        Instant instant = dateTime.atZone(ZONE).toInstant();
        return Clock.fixed(instant, ZONE);
    }

    private static void setField(Object target, String fieldName, int value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
