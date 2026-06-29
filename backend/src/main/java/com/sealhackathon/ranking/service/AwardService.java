package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.PrizeRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.ranking.domain.ParticipationCertificate;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.TeamAward;
import com.sealhackathon.ranking.dto.response.AwardAssignmentResultResponse;
import com.sealhackathon.ranking.dto.response.ParticipationCertificateResponse;
import com.sealhackathon.ranking.dto.response.ParticipationCertificateSummaryResponse;
import com.sealhackathon.ranking.dto.response.TeamAwardResponse;
import com.sealhackathon.ranking.repository.ParticipationCertificateRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.ranking.repository.TeamAwardRepository;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.repository.TeamMemberRepository;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AwardService {

    private static final List<PrizeRank> AWARD_ORDER = List.of(
            PrizeRank.FIRST, PrizeRank.SECOND, PrizeRank.THIRD, PrizeRank.CONSOLATION);

    private final TeamAwardRepository teamAwardRepository;
    private final ParticipationCertificateRepository participationCertificateRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final PrizeRepository prizeRepository;
    private final TeamPublicService teamPublicService;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;

    @Transactional
    public AwardAssignmentResultResponse assignAwardsFromFinalRanking(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        Round finalRound = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundType() == RoundType.FINAL)
                .findFirst()
                .orElseGet(() -> {
                    List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
                    if (rounds.isEmpty()) {
                        throw new BusinessException("No rounds configured", HttpStatus.BAD_REQUEST);
                    }
                    return rounds.get(rounds.size() - 1);
                });

        int latestVersion = rankingRepository.findMaxVersionByRoundId(finalRound.getId());
        if (latestVersion == 0) {
            throw new BusinessException("Final rankings not yet calculated", HttpStatus.BAD_REQUEST);
        }

        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(finalRound.getId(), latestVersion);

        List<Prize> prizes = prizeRepository.findByHackathonEventId(eventId);
        Map<PrizeRank, Prize> prizeByRank = prizes.stream()
                .collect(Collectors.toMap(Prize::getRank, Function.identity(), (a, b) -> a));

        teamAwardRepository.deleteByEventId(eventId);
        teamAwardRepository.flush();

        List<TeamAwardResponse> teamAwards = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < Math.min(AWARD_ORDER.size(), rankings.size()); i++) {
            PrizeRank rank = AWARD_ORDER.get(i);
            Prize prize = prizeByRank.get(rank);
            if (prize == null) continue;

            Ranking ranking = rankings.get(i);
            TeamAward award = teamAwardRepository.save(TeamAward.builder()
                    .eventId(eventId)
                    .teamId(ranking.getTeamId())
                    .prizeId(prize.getId())
                    .awardedAt(now)
                    .build());
            teamAwards.add(toTeamAwardResponse(award, prize));
        }

        List<ParticipationCertificateResponse> participationCertificates =
                issueParticipationCertificates(eventId, now);

        return AwardAssignmentResultResponse.builder()
                .teamAwards(teamAwards)
                .participationCertificatesIssued(participationCertificates.size())
                .participationCertificates(participationCertificates)
                .build();
    }

    @Transactional(readOnly = true)
    public List<TeamAwardResponse> getAwards(UUID eventId) {
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
    public ParticipationCertificateResponse getMyParticipationCertificate(UUID eventId, UUID userId) {
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

        return ParticipationCertificateSummaryResponse.builder()
                .eventId(eventId)
                .issuedCount(participationCertificateRepository.countByEventId(eventId))
                .build();
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

    private int rankOrder(PrizeRank rank) {
        if (rank == null) return 99;
        int idx = AWARD_ORDER.indexOf(rank);
        return idx >= 0 ? idx : 99;
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
                .prizeLabel(prize != null ? prize.getLabel() : null)
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
