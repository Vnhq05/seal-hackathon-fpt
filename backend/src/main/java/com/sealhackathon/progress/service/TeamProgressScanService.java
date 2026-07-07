package com.sealhackathon.progress.service;

import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.progress.config.ProgressProperties;
import com.sealhackathon.progress.domain.TeamProgressAlert;
import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
import com.sealhackathon.progress.event.TeamProgressAlertEvent;
import com.sealhackathon.progress.repository.TeamProgressAlertRepository;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import com.sealhackathon.ranking.repository.AdvancementRepository;
import com.sealhackathon.ranking.service.FinalistSelectionService;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamProgressScanService {

    private final RoundRepository roundRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository submissionVersionRepository;
    private final TeamRepository teamRepository;
    private final TeamProgressAlertRepository teamProgressAlertRepository;
    private final TeamProgressEvaluationService evaluationService;
    private final FormatRuleEngine formatRuleEngine;
    private final FinalistSelectionService finalistSelectionService;
    private final AdvancementRepository advancementRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ProgressProperties progressProperties;
    private final Clock clock;

    @Transactional
    public void scanActiveRounds() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<Round> rounds = roundRepository.findActiveForProgressScan(now);
        log.debug("Team progress scan: {} active round(s)", rounds.size());

        for (Round round : rounds) {
            scanRound(round);
        }
    }

    private void scanRound(Round round) {
        UUID eventId = round.getHackathonEvent().getId();
        UUID roundId = round.getId();
        boolean sealFormat = formatRuleEngine.isSealFormat(eventId);
        RoundSnapshot roundSnapshot = toRoundSnapshot(round);

        List<Submission> submissions = submissionRepository.findByRoundId(roundId);
        Map<UUID, Submission> submissionByTeamId = submissions.stream()
                .collect(Collectors.toMap(Submission::getTeamId, Function.identity()));

        Map<UUID, SubmissionVersion> latestBySubmissionId = submissionVersionRepository
                .findLatestVersionsByRoundId(roundId).stream()
                .collect(Collectors.toMap(v -> v.getSubmission().getId(), Function.identity()));

        Round previousRound = findPreviousRound(eventId, round.getRoundNumber());

        for (Team team : teamRepository.findByEventId(eventId)) {
            if (!isTeamEligibleForRound(team, round, eventId, previousRound)) {
                continue;
            }

            Submission submission = submissionByTeamId.get(team.getId());
            SubmissionVersion latest = submission != null
                    ? latestBySubmissionId.get(submission.getId())
                    : null;
            int totalVersions = latest != null ? latest.getVersionNumber() : 0;

            TeamProgressEvaluationService.EvaluationResult evaluation = evaluationService.evaluate(
                    submission, latest, totalVersions, roundSnapshot, sealFormat);

            TeamProgressAlert existing = teamProgressAlertRepository
                    .findByTeamIdAndRoundId(team.getId(), roundId)
                    .orElse(null);

            LocalDateTime now = LocalDateTime.now(clock);
            boolean publish = shouldPublishAlert(evaluation, existing, now);
            if (publish) {
                eventPublisher.publishEvent(new TeamProgressAlertEvent(
                        eventId,
                        team.getId(),
                        roundId,
                        List.copyOf(evaluation.reasons()),
                        evaluation.riskLevel()));
            }

            upsertAlert(team.getId(), roundId, evaluation, existing, publish, now);
        }
    }

    boolean isTeamEligibleForRound(Team team, Round round, UUID eventId, Round previousRound) {
        if (team.getStatus() == TeamStatus.DISBANDED) {
            return false;
        }
        if (round.getRoundType() == RoundType.FINAL
                && !finalistSelectionService.isFinalist(eventId, team.getId())) {
            return false;
        }
        if (previousRound != null) {
            return advancementRepository.findByTeamIdAndRoundId(team.getId(), previousRound.getId())
                    .map(advancement -> advancement.getStatus() != AdvancementStatus.ELIMINATED)
                    .orElse(true);
        }
        return true;
    }

    public Round findPreviousRound(UUID eventId, int roundNumber) {
        if (roundNumber <= 1) {
            return null;
        }
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundNumber() == roundNumber - 1)
                .findFirst()
                .orElse(null);
    }

    boolean shouldPublishAlert(TeamProgressEvaluationService.EvaluationResult evaluation,
                               TeamProgressAlert existing,
                               LocalDateTime now) {
        if (evaluation.riskLevel() == ProgressRiskLevel.OK) {
            return false;
        }
        if (existing == null || existing.getLastAlertedAt() == null) {
            return true;
        }
        if (isRiskEscalated(existing.getRiskLevel(), evaluation.riskLevel())) {
            return true;
        }
        if (!sameReasonSet(existing.getReasonList(), evaluation.reasons())) {
            return true;
        }
        long hoursSinceLast = Duration.between(existing.getLastAlertedAt(), now).toHours();
        return hoursSinceLast >= progressProperties.getCooldownHours();
    }

    private boolean isRiskEscalated(ProgressRiskLevel previous, ProgressRiskLevel current) {
        return riskOrdinal(current) > riskOrdinal(previous);
    }

    private int riskOrdinal(ProgressRiskLevel level) {
        return switch (level) {
            case OK -> 0;
            case AT_RISK -> 1;
            case CRITICAL -> 2;
        };
    }

    private boolean sameReasonSet(List<ProgressRiskReason> a, List<ProgressRiskReason> b) {
        return new HashSet<>(a).equals(new HashSet<>(b));
    }

    private void upsertAlert(UUID teamId,
                             UUID roundId,
                             TeamProgressEvaluationService.EvaluationResult evaluation,
                             TeamProgressAlert existing,
                             boolean published,
                             LocalDateTime now) {
        TeamProgressAlert alert = existing != null ? existing : TeamProgressAlert.builder()
                .teamId(teamId)
                .roundId(roundId)
                .build();

        alert.setRiskLevel(evaluation.riskLevel());
        alert.setReasonList(evaluation.reasons());
        if (published) {
            alert.setLastAlertedAt(now);
        }
        teamProgressAlertRepository.save(alert);
    }

    private RoundSnapshot toRoundSnapshot(Round round) {
        return RoundSnapshot.builder()
                .id(round.getId())
                .eventId(round.getHackathonEvent().getId())
                .roundNumber(round.getRoundNumber())
                .name(round.getName())
                .startDate(round.getStartDate())
                .endDate(round.getEndDate())
                .submissionDeadline(round.getSubmissionDeadline())
                .slideDeadline(round.getSlideDeadline())
                .scoringDeadline(round.getScoringDeadline())
                .advancementCutoff(round.getAdvancementCutoff())
                .roundWeight(round.getRoundWeight())
                .roundType(round.getRoundType())
                .advancementRule(round.getAdvancementRule())
                .build();
    }
}
