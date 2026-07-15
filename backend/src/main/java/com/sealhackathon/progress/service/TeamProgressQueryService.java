package com.sealhackathon.progress.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.service.EventOwnershipGuard;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.dto.response.TeamProgressResponse;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamProgressQueryService {

    private final RoundRepository roundRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository submissionVersionRepository;
    private final TeamRepository teamRepository;
    private final TeamPublicService teamPublicService;
    private final TeamProgressEvaluationService evaluationService;
    private final TeamProgressScanService teamProgressScanService;
    private final FormatRuleEngine formatRuleEngine;
    private final EventOwnershipGuard eventOwnershipGuard;

    @Transactional(readOnly = true)
    public List<TeamProgressResponse> getProgressByRound(UUID eventId,
                                                         UUID roundId,
                                                         UUID requesterId,
                                                         UserType requesterRole) {
        Round round = loadRound(eventId, roundId);

        if (requesterRole == UserType.EVENT_COORDINATOR) {
            eventOwnershipGuard.enforceEventOwnership(eventId);
        }

        List<TeamProgressResponse> all = buildProgressForRound(round);
        return filterByRole(all, round, eventId, requesterId, requesterRole);
    }

    @Transactional(readOnly = true)
    public List<TeamProgressResponse> getMentorAtRiskTeams(UUID mentorId, UUID eventId) {
        Set<UUID> mentorTeamIds = teamPublicService.getTeamsByMentor(mentorId, eventId).stream()
                .map(TeamSnapshot::getId)
                .collect(Collectors.toSet());

        Round currentRound = findCurrentScannableRound(eventId);
        if (currentRound == null) {
            return List.of();
        }

        return buildProgressForRound(currentRound).stream()
                .filter(p -> mentorTeamIds.contains(p.getTeamId()))
                .filter(p -> p.getRiskLevel() != ProgressRiskLevel.OK)
                .filter(p -> p.getHoursUntilDeadline() >= 0)
                .toList();
    }

    private List<TeamProgressResponse> buildProgressForRound(Round round) {
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

        Round previousRound = teamProgressScanService.findPreviousRound(eventId, round.getRoundNumber());

        List<TeamProgressResponse> results = new ArrayList<>();
        for (Team team : teamRepository.findByEventId(eventId)) {
            if (!teamProgressScanService.isTeamEligibleForRound(team, round, eventId, previousRound)) {
                continue;
            }

            Submission submission = submissionByTeamId.get(team.getId());
            SubmissionVersion latest = submission != null
                    ? latestBySubmissionId.get(submission.getId())
                    : null;
            int totalVersions = latest != null ? latest.getVersionNumber() : 0;

            TeamProgressEvaluationService.EvaluationResult evaluation = evaluationService.evaluate(
                    submission, latest, totalVersions, roundSnapshot, sealFormat);

            results.add(TeamProgressResponse.builder()
                    .teamId(team.getId())
                    .teamName(team.getName())
                    .roundId(roundId)
                    .riskLevel(evaluation.riskLevel())
                    .reasons(List.copyOf(evaluation.reasons()))
                    .lastSubmittedAt(evaluation.lastSubmittedAt())
                    .totalVersions(evaluation.totalVersions())
                    .hoursUntilDeadline(evaluation.hoursUntilDeadline())
                    .build());
        }
        return results;
    }

    private List<TeamProgressResponse> filterByRole(List<TeamProgressResponse> all,
                                                    Round round,
                                                    UUID eventId,
                                                    UUID requesterId,
                                                    UserType requesterRole) {
        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return all;
        }

        if (requesterRole == UserType.FPT_STUDENT || requesterRole == UserType.EXTERNAL_STUDENT) {
            TeamSnapshot team = teamPublicService.getTeamByParticipantAndEvent(requesterId, eventId)
                    .orElseThrow(() -> new BusinessException(
                            "You are not a member of any team in this event",
                            HttpStatus.FORBIDDEN) {});
            return all.stream()
                    .filter(p -> p.getTeamId().equals(team.getId()))
                    .toList();
        }

        if (requesterRole == UserType.LECTURER) {
            Set<UUID> allowedTeamIds = new HashSet<>();
            teamPublicService.getTeamsByMentor(requesterId, eventId).stream()
                    .map(TeamSnapshot::getId)
                    .forEach(allowedTeamIds::add);

            return all.stream()
                    .filter(p -> allowedTeamIds.contains(p.getTeamId()))
                    .toList();
        }

        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    private Round loadRound(UUID eventId, UUID roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        if (!round.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("Round", "id", roundId);
        }
        return round;
    }

    private Round findCurrentScannableRound(UUID eventId) {
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getScoringDeadline().isAfter(java.time.LocalDateTime.now()))
                .findFirst()
                .orElse(null);
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
