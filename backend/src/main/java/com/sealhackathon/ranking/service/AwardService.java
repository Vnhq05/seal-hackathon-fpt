package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.util.PrizeAmountUtils;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.PrizeAssignmentMode;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.PrizeAssignmentMode;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.ranking.dto.request.AssignAwardsRequest;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.PrizeRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.judging.service.JudgingPublicService;
import com.sealhackathon.ranking.domain.ParticipationCertificate;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.TeamAward;
import com.sealhackathon.ranking.dto.request.AssignAwardsRequest;
import com.sealhackathon.ranking.dto.response.AwardAssignmentResultResponse;
import com.sealhackathon.ranking.dto.response.ParticipationCertificateResponse;
import com.sealhackathon.ranking.dto.response.ParticipationCertificateSummaryResponse;
import com.sealhackathon.ranking.dto.response.TeamAwardResponse;
import com.sealhackathon.ranking.dto.response.UserAchievementResponse;
import com.sealhackathon.ranking.repository.ParticipationCertificateRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.ranking.repository.TeamAwardRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AwardService {

    private static final List<PrizeRank> RANK_BASED_ORDER = List.of(
            PrizeRank.FIRST, PrizeRank.SECOND, PrizeRank.THIRD, PrizeRank.CONSOLATION);

    private final TeamAwardRepository teamAwardRepository;
    private final ParticipationCertificateRepository participationCertificateRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final PrizeRepository prizeRepository;
    private final TeamRepository teamRepository;
    private final TeamPublicService teamPublicService;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;
    private final JudgingPublicService judgingPublicService;
    private final AuthPublicService authPublicService;

    @Transactional
    public AwardAssignmentResultResponse assignAwardsFromFinalRanking(UUID eventId, AssignAwardsRequest request) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        List<Prize> prizes = prizeRepository.findByHackathonEventId(eventId);
        if (prizes == null || prizes.isEmpty()) {
            throw new BusinessException(
                    "Configure prizes before assigning awards",
                    HttpStatus.BAD_REQUEST) {};
        }

        Round finalRound = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundType() == RoundType.FINAL)
                .findFirst()
                .orElseGet(() -> {
                    List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
                    if (rounds.isEmpty()) {
                        throw new BusinessException("No rounds configured", HttpStatus.BAD_REQUEST) {};
                    }
                    return rounds.get(rounds.size() - 1);
                });

        int latestVersion = rankingRepository.findMaxVersionByRoundId(finalRound.getId());
        if (latestVersion == 0) {
            throw new BusinessException("Final rankings not yet calculated", HttpStatus.BAD_REQUEST) {};
        }

        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(finalRound.getId(), latestVersion);

        List<Prize> allPrizes = prizeRepository.findByHackathonEventId(eventId);
        List<Prize> rankBasedPrizes = orderRankBasedPrizes(allPrizes);
        List<Prize> manualPrizes = orderManualPrizes(allPrizes);

        if (rankBasedPrizes.isEmpty() && manualPrizes.isEmpty()) {
            throw new BusinessException(
                    "No prizes configured for this event. Add First/Second/Third Prize amounts first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        Map<UUID, UUID> manualTeamByPrize = resolveManualAssignments(eventId, manualPrizes, request);

        teamAwardRepository.deleteByEventId(eventId);
        teamAwardRepository.flush();

        List<TeamAwardResponse> teamAwards = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < Math.min(rankBasedPrizes.size(), rankings.size()); i++) {
            Prize prize = rankBasedPrizes.get(i);
            Ranking ranking = rankings.get(i);
            teamAwards.add(saveAward(eventId, ranking.getTeamId(), prize, now));
        }

        for (Prize prize : manualPrizes) {
            UUID teamId = manualTeamByPrize.get(prize.getId());
            if (teamId == null) continue;
            teamAwards.add(saveAward(eventId, teamId, prize, now));
        }

        List<ParticipationCertificateResponse> participationCertificates =
                issueParticipationCertificates(eventId, now);

        return AwardAssignmentResultResponse.builder()
                .teamAwards(teamAwards)
                .participationCertificatesIssued(participationCertificates.size())
                .participationCertificates(participationCertificates)
                .build();
    }

    private TeamAwardResponse saveAward(UUID eventId, UUID teamId, Prize prize, LocalDateTime now) {
        TeamAward award = teamAwardRepository.save(TeamAward.builder()
                .eventId(eventId)
                .teamId(teamId)
                .prizeId(prize.getId())
                .awardedAt(now)
                .build());
        return toTeamAwardResponse(award, prize);
    }

    private Map<UUID, UUID> resolveManualAssignments(
            UUID eventId,
            List<Prize> manualPrizes,
            AssignAwardsRequest request) {
        Map<UUID, UUID> result = new HashMap<>();
        if (manualPrizes.isEmpty()) {
            return result;
        }

        List<AssignAwardsRequest.ManualPrizeAssignment> assignments =
                request != null && request.getManualAssignments() != null
                        ? request.getManualAssignments()
                        : List.of();

        Map<UUID, Prize> manualById = manualPrizes.stream()
                .collect(Collectors.toMap(Prize::getId, Function.identity()));

        Set<UUID> seenPrizeIds = new HashSet<>();
        for (AssignAwardsRequest.ManualPrizeAssignment assignment : assignments) {
            if (assignment.getPrizeId() == null || assignment.getTeamId() == null) {
                throw new BusinessException(
                        "Manual prize assignments require prizeId and teamId.",
                        HttpStatus.BAD_REQUEST) {};
            }
            if (!manualById.containsKey(assignment.getPrizeId())) {
                throw new BusinessException(
                        "Prize is not a manual (special) award for this event: " + assignment.getPrizeId(),
                        HttpStatus.BAD_REQUEST) {};
            }
            if (!seenPrizeIds.add(assignment.getPrizeId())) {
                throw new BusinessException(
                        "Duplicate manual assignment for prize: " + assignment.getPrizeId(),
                        HttpStatus.BAD_REQUEST) {};
            }
            Team team = teamRepository.findById(assignment.getTeamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team", "id", assignment.getTeamId()));
            if (!eventId.equals(team.getEventId())) {
                throw new BusinessException(
                        "Team does not belong to this event.",
                        HttpStatus.BAD_REQUEST) {};
            }
            if (team.getStatus() == TeamStatus.DISBANDED) {
                throw new BusinessException(
                        "Cannot assign award to a disbanded team.",
                        HttpStatus.BAD_REQUEST) {};
            }
            result.put(assignment.getPrizeId(), assignment.getTeamId());
        }

        List<String> missing = manualPrizes.stream()
                .filter(p -> !result.containsKey(p.getId()))
                .map(this::prizeTitle)
                .toList();
        if (!missing.isEmpty()) {
            throw new BusinessException(
                    "Select a team for each special prize: " + String.join(", ", missing),
                    HttpStatus.BAD_REQUEST) {};
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<TeamAwardResponse> getAwards(UUID eventId) {
        if (!canViewerSeeAwards(eventId)) {
            return List.of();
        }
        return listAwardsUngated(eventId);
    }

    @Transactional(readOnly = true)
    public List<TeamAwardResponse> getPublicAwards(UUID eventId) {
        if (!isStudentResultsVisible(eventId)) {
            return List.of();
        }
        return listAwardsUngated(eventId);
    }

    private List<TeamAwardResponse> listAwardsUngated(UUID eventId) {
        List<Prize> prizes = prizeRepository.findByHackathonEventId(eventId);
        Map<UUID, Prize> prizeMap = prizes.stream()
                .collect(Collectors.toMap(Prize::getId, Function.identity()));

        return teamAwardRepository.findByEventIdOrderByAwardedAtAsc(eventId).stream()
                .map(ta -> toTeamAwardResponse(ta, prizeMap.get(ta.getPrizeId())))
                .sorted(Comparator.comparing(r -> rankOrder(r.getPrizeRank())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParticipationCertificateResponse> getParticipationCertificates(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        return participationCertificateRepository.findByEventIdOrderByIssuedAtAsc(eventId).stream()
                .map(this::toParticipationResponse)
                .sorted(Comparator
                        .comparing(ParticipationCertificateResponse::getTeamName,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                        .thenComparing(ParticipationCertificateResponse::getUserFullName,
                                Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserAchievementResponse> getUserAchievements(UUID userId) {
        List<TeamMember> memberships = teamMemberRepository.findByUserId(userId);
        Set<UUID> memberTeamIds = memberships.stream()
                .map(member -> member.getTeam().getId())
                .collect(Collectors.toCollection(HashSet::new));

        List<TeamAward> awards = memberTeamIds.isEmpty()
                ? List.of()
                : teamAwardRepository.findByTeamIdInOrderByAwardedAtDesc(memberTeamIds);
        List<ParticipationCertificate> certificates =
                participationCertificateRepository.findByUserIdOrderByIssuedAtDesc(userId);

        // Resolve team names from teams table so certificates/awards still show
        // after the student leaves or membership rows are missing.
        Set<UUID> teamIds = new HashSet<>(memberTeamIds);
        awards.forEach(award -> teamIds.add(award.getTeamId()));
        certificates.forEach(certificate -> {
            if (certificate.getTeamId() != null) {
                teamIds.add(certificate.getTeamId());
            }
        });
        Map<UUID, String> teamNames = teamIds.isEmpty()
                ? Map.of()
                : teamRepository.findAllById(teamIds).stream()
                        .collect(Collectors.toMap(Team::getId, Team::getName, (first, ignored) -> first));

        List<UUID> eventIds = new ArrayList<>();
        awards.forEach(award -> eventIds.add(award.getEventId()));
        certificates.forEach(certificate -> eventIds.add(certificate.getEventId()));
        Map<UUID, HackathonEvent> eventsById = eventRepository.findAllById(eventIds).stream()
                .collect(Collectors.toMap(HackathonEvent::getId, Function.identity()));
        Map<UUID, String> eventNames = eventsById.values().stream()
                .collect(Collectors.toMap(HackathonEvent::getId, HackathonEvent::getName));

        Map<UUID, Prize> prizes = new HashMap<>();
        prizeRepository.findAllById(awards.stream().map(TeamAward::getPrizeId).toList())
                .forEach(prize -> prizes.put(prize.getId(), prize));

        boolean staffViewer = isStaffViewer();

        List<UserAchievementResponse> achievements = new ArrayList<>();
        for (TeamAward award : awards) {
            if (!staffViewer && !isStudentResultsVisible(eventsById.get(award.getEventId()))) {
                continue;
            }
            Prize prize = prizes.get(award.getPrizeId());
            achievements.add(UserAchievementResponse.builder()
                    .id(award.getId())
                    .type("TEAM_AWARD")
                    .eventId(award.getEventId())
                    .eventName(eventNames.get(award.getEventId()))
                    .teamId(award.getTeamId())
                    .teamName(teamNames.get(award.getTeamId()))
                    .prizeRank(prize != null ? prize.getRank() : null)
                    .title(prizeTitle(prize))
                    .description(prize != null ? prize.getValue() : null)
                    .achievedAt(award.getAwardedAt())
                    .build());
        }
        for (ParticipationCertificate certificate : certificates) {
            if (!staffViewer && !isStudentResultsVisible(eventsById.get(certificate.getEventId()))) {
                continue;
            }
            achievements.add(UserAchievementResponse.builder()
                    .id(certificate.getId())
                    .type("PARTICIPATION_CERTIFICATE")
                    .eventId(certificate.getEventId())
                    .eventName(eventNames.get(certificate.getEventId()))
                    .teamId(certificate.getTeamId())
                    .teamName(teamNames.get(certificate.getTeamId()))
                    .title("Participation Certificate")
                    .description("Completed the hackathon")
                    .achievedAt(certificate.getIssuedAt())
                    .build());
        }

        return achievements.stream()
                .sorted(Comparator.comparing(
                        UserAchievementResponse::getAchievedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ParticipationCertificateResponse getMyParticipationCertificate(UUID eventId, UUID userId) {
        if (!isStudentResultsVisible(eventId) && !isStaffViewer()) {
            throw new ResourceNotFoundException(
                    "Participation certificate", "eventId/userId", eventId + "/" + userId);
        }
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        ParticipationCertificate certificate = participationCertificateRepository
                .findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Participation certificate", "eventId/userId", eventId + "/" + userId));

        return toParticipationResponse(certificate);
    }

    @Transactional(readOnly = true)
    public ParticipationCertificateSummaryResponse getParticipationCertificateSummary(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (!isStudentResultsVisible(eventId) && !isStaffViewer()) {
            return ParticipationCertificateSummaryResponse.builder()
                    .eventId(eventId)
                    .issuedCount(0)
                    .build();
        }

        return ParticipationCertificateSummaryResponse.builder()
                .eventId(eventId)
                .issuedCount(participationCertificateRepository.countByEventId(eventId))
                .build();
    }

    /**
     * Students see Results & Awards only when the event is staff-COMPLETED,
     * results are public, and there are no active score-deviation reviews.
     */
    boolean isStudentResultsVisible(UUID eventId) {
        return eventRepository.findById(eventId)
                .map(this::isStudentResultsVisible)
                .orElse(false);
    }

    boolean isStudentResultsVisible(HackathonEvent event) {
        if (event == null) {
            return false;
        }
        return event.getStatus() == EventStatus.COMPLETED
                && event.isLeaderboardPublic()
                && !judgingPublicService.hasActiveScoreReviews(event.getId());
    }

    private boolean canViewerSeeAwards(UUID eventId) {
        return isStaffViewer() || isStudentResultsVisible(eventId);
    }

    private boolean isStaffViewer() {
        try {
            UserType role = authPublicService.getCurrentUserRole();
            return role == UserType.SYSTEM_ADMIN || role == UserType.EVENT_COORDINATOR;
        } catch (Exception ignored) {
            return false;
        }
    }

    private List<ParticipationCertificateResponse> issueParticipationCertificates(
            UUID eventId, LocalDateTime issuedAt) {
        List<TeamMember> members = teamMemberRepository.findByEventIdAndTeamStatus(
                eventId, TeamStatus.CONFIRMED);

        participationCertificateRepository.deleteByEventId(eventId);
        participationCertificateRepository.flush();

        List<ParticipationCertificateResponse> results = new ArrayList<>();
        for (TeamMember member : members) {
            ParticipationCertificate certificate = participationCertificateRepository.save(
                    ParticipationCertificate.builder()
                            .eventId(eventId)
                            .userId(member.getUserId())
                            .teamId(member.getTeam().getId())
                            .issuedAt(issuedAt)
                            .build());
            results.add(toParticipationResponse(certificate));
        }
        return results;
    }

    private static final String LEGACY_FREE_TEXT_PRIZE_LABEL = "Prizes";

    private List<Prize> orderRankBasedPrizes(List<Prize> prizes) {
        List<Prize> ordered = new ArrayList<>();
        for (PrizeRank rank : List.of(PrizeRank.FIRST, PrizeRank.SECOND, PrizeRank.THIRD)) {
            prizes.stream()
                    .filter(p -> p.getRank() == rank)
                    .filter(this::hasPositivePrizeAmount)
                    .findFirst()
                    .ifPresent(ordered::add);
        }
        prizes.stream()
                .filter(p -> p.getRank() == PrizeRank.CONSOLATION)
                .filter(p -> !isLegacyFreeTextPrize(p))
                .filter(this::isRankBased)
                .filter(this::hasPositivePrizeAmount)
                .forEach(ordered::add);
        return ordered;
    }

    private List<Prize> orderManualPrizes(List<Prize> prizes) {
        return prizes.stream()
                .filter(p -> p.getRank() == PrizeRank.CONSOLATION)
                .filter(p -> !isLegacyFreeTextPrize(p))
                .filter(p -> !isRankBased(p))
                .filter(this::hasPositivePrizeAmount)
                .toList();
    }

    private boolean isRankBased(Prize prize) {
        if (prize.getRank() == PrizeRank.FIRST
                || prize.getRank() == PrizeRank.SECOND
                || prize.getRank() == PrizeRank.THIRD) {
            return true;
        }
        return prize.getAssignmentMode() == null
                || prize.getAssignmentMode() == PrizeAssignmentMode.RANK_BASED;
    }

    private boolean isLegacyFreeTextPrize(Prize prize) {
        return LEGACY_FREE_TEXT_PRIZE_LABEL.equals(prize.getLabel());
    }

    private boolean hasPositivePrizeAmount(Prize prize) {
        Long amount = PrizeAmountUtils.parsePrizeAmount(prize.getValue());
        return amount != null && amount > 0;
    }

    private int rankOrder(PrizeRank rank) {
        if (rank == null) return 99;
        if (rank == PrizeRank.OTHER) return 50;
        int idx = RANK_BASED_ORDER.indexOf(rank);
        return idx >= 0 ? idx : 99;
    }

    private String prizeTitle(Prize prize) {
        if (prize == null) return "Team Award";
        if (prize.getLabel() != null && !prize.getLabel().isBlank()
                && !LEGACY_FREE_TEXT_PRIZE_LABEL.equals(prize.getLabel())) {
            return prize.getLabel();
        }
        if (prize.getRank() == null) return "Team Award";
        return switch (prize.getRank()) {
            case FIRST -> "First Prize";
            case SECOND -> "Second Prize";
            case THIRD -> "Third Prize";
            case CONSOLATION -> "Encouragement Prize";
            case OTHER -> "Special Prize";
        };
    }

    private TeamAwardResponse toTeamAwardResponse(TeamAward award, Prize prize) {
        String teamName = teamPublicService.getTeam(award.getTeamId())
                .map(TeamSnapshot::getName)
                .orElse(null);
        return TeamAwardResponse.builder()
                .id(award.getId())
                .eventId(award.getEventId())
                .teamId(award.getTeamId())
                .teamName(teamName)
                .prizeId(award.getPrizeId())
                .prizeRank(prize != null ? prize.getRank() : null)
                .prizeLabel(prizeTitle(prize))
                .prizeValue(prize != null ? prize.getValue() : null)
                .awardedAt(award.getAwardedAt())
                .build();
    }

    private ParticipationCertificateResponse toParticipationResponse(ParticipationCertificate certificate) {
        String teamName = teamPublicService.getTeam(certificate.getTeamId())
                .map(TeamSnapshot::getName)
                .orElse(null);
        String userFullName = userPublicService.getUser(certificate.getUserId())
                .map(UserSnapshot::getFullName)
                .orElse(null);
        return ParticipationCertificateResponse.builder()
                .id(certificate.getId())
                .eventId(certificate.getEventId())
                .userId(certificate.getUserId())
                .teamId(certificate.getTeamId())
                .userFullName(userFullName)
                .teamName(teamName)
                .issuedAt(certificate.getIssuedAt())
                .build();
    }
}
