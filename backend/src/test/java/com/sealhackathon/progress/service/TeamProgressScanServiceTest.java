package com.sealhackathon.progress.service;

import com.sealhackathon.progress.config.ProgressProperties;
import com.sealhackathon.progress.domain.TeamProgressAlert;
import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class TeamProgressScanServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private ProgressProperties properties;
    private TeamProgressScanService scanService;

    @BeforeEach
    void setUp() {
        properties = new ProgressProperties();
        setField(properties, "alertLeadTimeHours", 6);
        setField(properties, "stalledHours", 24);
        setField(properties, "cooldownHours", 12);

        Clock clock = Clock.fixed(
                LocalDateTime.of(2026, 7, 10, 12, 0).atZone(ZONE).toInstant(), ZONE);
        scanService = new TeamProgressScanService(
                null, null, null, null, null, null, null, null, null, null, null, properties, clock);
    }

    @Test
    void shouldPublishAlert_firstTimeAtRisk() {
        var evaluation = new TeamProgressEvaluationService.EvaluationResult(
                ProgressRiskLevel.AT_RISK,
                List.of(ProgressRiskReason.STALLED),
                2,
                LocalDateTime.now(),
                24,
                2);

        assertThat(scanService.shouldPublishAlert(
                evaluation, null, LocalDateTime.of(2026, 7, 10, 12, 0))).isTrue();
    }

    @Test
    void shouldPublishAlert_skipsOkRisk() {
        var evaluation = new TeamProgressEvaluationService.EvaluationResult(
                ProgressRiskLevel.OK, List.of(), 2, LocalDateTime.now(), 48, 4);

        assertThat(scanService.shouldPublishAlert(
                evaluation, null, LocalDateTime.of(2026, 7, 10, 12, 0))).isFalse();
    }

    @Test
    void shouldPublishAlert_skipsWithinCooldown() {
        var evaluation = new TeamProgressEvaluationService.EvaluationResult(
                ProgressRiskLevel.AT_RISK,
                List.of(ProgressRiskReason.STALLED),
                2,
                LocalDateTime.now(),
                24,
                2);

        TeamProgressAlert existing = TeamProgressAlert.builder()
                .teamId(UUID.randomUUID())
                .roundId(UUID.randomUUID())
                .riskLevel(ProgressRiskLevel.AT_RISK)
                .lastAlertedAt(LocalDateTime.of(2026, 7, 10, 6, 0))
                .build();
        existing.setReasonList(List.of(ProgressRiskReason.STALLED));

        assertThat(scanService.shouldPublishAlert(
                evaluation, existing, LocalDateTime.of(2026, 7, 10, 12, 0))).isFalse();
    }

    @Test
    void shouldPublishAlert_whenReasonSetChanges() {
        var evaluation = new TeamProgressEvaluationService.EvaluationResult(
                ProgressRiskLevel.AT_RISK,
                List.of(ProgressRiskReason.STALLED, ProgressRiskReason.SINGLE_VERSION_LAST_MINUTE),
                1,
                LocalDateTime.now(),
                24,
                2);

        TeamProgressAlert existing = TeamProgressAlert.builder()
                .teamId(UUID.randomUUID())
                .roundId(UUID.randomUUID())
                .riskLevel(ProgressRiskLevel.AT_RISK)
                .lastAlertedAt(LocalDateTime.of(2026, 7, 10, 6, 0))
                .build();
        existing.setReasonList(List.of(ProgressRiskReason.STALLED));

        assertThat(scanService.shouldPublishAlert(
                evaluation, existing, LocalDateTime.of(2026, 7, 10, 12, 0))).isTrue();
    }

    @Test
    void shouldPublishAlert_whenRiskEscalates() {
        var evaluation = new TeamProgressEvaluationService.EvaluationResult(
                ProgressRiskLevel.CRITICAL,
                List.of(ProgressRiskReason.NOT_STARTED),
                0,
                null,
                4,
                0);

        TeamProgressAlert existing = TeamProgressAlert.builder()
                .teamId(UUID.randomUUID())
                .roundId(UUID.randomUUID())
                .riskLevel(ProgressRiskLevel.AT_RISK)
                .lastAlertedAt(LocalDateTime.of(2026, 7, 10, 6, 0))
                .build();
        existing.setReasonList(List.of(ProgressRiskReason.STALLED));

        assertThat(scanService.shouldPublishAlert(
                evaluation, existing, LocalDateTime.of(2026, 7, 10, 12, 0))).isTrue();
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
