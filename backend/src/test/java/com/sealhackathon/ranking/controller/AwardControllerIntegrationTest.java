package com.sealhackathon.ranking.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.PrizeRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.repository.ParticipationCertificateRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.ranking.repository.TeamAwardRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AwardControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private PrizeRepository prizeRepository;
    @Autowired private RankingRepository rankingRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private TeamAwardRepository teamAwardRepository;
    @Autowired private ParticipationCertificateRepository participationCertificateRepository;

    private User admin;
    private User leader1;
    private User leader2;
    private User member1;
    private User formingLeader;
    private UUID eventId;
    private UUID team1Id;
    private UUID team2Id;

    @BeforeEach
    void setUp() {
        participationCertificateRepository.deleteAll();
        teamAwardRepository.deleteAll();
        rankingRepository.deleteAll();
        prizeRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        admin = createAdmin();
        leader1 = createUser("leader1@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        leader2 = createUser("leader2@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        member1 = createUser("member1@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        formingLeader = createUser("forming@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Awards Event")
                .season("SPRING")
                .year(2026)
                .startDate(LocalDate.of(2026, 4, 12))
                .endDate(LocalDate.of(2026, 4, 12))
                .registrationDeadline(LocalDate.of(2026, 4, 10))
                .status(EventStatus.ACTIVE)
                .build());
        eventId = event.getId();

        seedPrizes(event);
        UUID finalRoundId = seedFinalRound(event);
        team1Id = seedConfirmedTeam("Team Alpha", leader1, member1);
        team2Id = seedConfirmedTeam("Team Beta", leader2, null);
        seedFormingTeam("Team Forming", formingLeader);
        seedRankings(finalRoundId, team1Id, team2Id);
    }

    @Test
    void assignAwards_shouldAssignTeamAwardsAndParticipationCertificates() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/awards/assign")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.teamAwards.length()", is(2)))
                .andExpect(jsonPath("$.data.teamAwards[0].prizeRank", is("FIRST")))
                .andExpect(jsonPath("$.data.teamAwards[1].prizeRank", is("SECOND")))
                .andExpect(jsonPath("$.data.participationCertificatesIssued", is(3)));

        mockMvc.perform(get("/api/events/" + eventId + "/awards/participation")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(3)));

        mockMvc.perform(get("/api/public/events/" + eventId + "/awards/participation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.issuedCount", is(3)));

        mockMvc.perform(get("/api/events/" + eventId + "/awards/participation/me")
                        .header("Authorization", "Bearer " + tokenFor(leader1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId", is(leader1.getId().toString())))
                .andExpect(jsonPath("$.data.teamId", is(team1Id.toString())));

        mockMvc.perform(get("/api/events/" + eventId + "/awards/participation/me")
                        .header("Authorization", "Bearer " + tokenFor(formingLeader)))
                .andExpect(status().isNotFound());
    }

    @Test
    void assignAwards_shouldBeIdempotentOnReassign() throws Exception {
        assignAwards();

        mockMvc.perform(post("/api/events/" + eventId + "/awards/assign")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.participationCertificatesIssued", is(3)));

        long awardCount = teamAwardRepository.findByEventIdOrderByAwardedAtAsc(eventId).size();
        long certCount = participationCertificateRepository.countByEventId(eventId);
        org.assertj.core.api.Assertions.assertThat(awardCount).isEqualTo(2);
        org.assertj.core.api.Assertions.assertThat(certCount).isEqualTo(3);
    }

    @Test
    void assignAwards_shouldReturn400_whenNoFinalRankings() throws Exception {
        rankingRepository.deleteAll();

        mockMvc.perform(post("/api/events/" + eventId + "/awards/assign")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isBadRequest());
    }

    private void assignAwards() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/awards/assign")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.participationCertificatesIssued", greaterThanOrEqualTo(1)));
    }

    private void seedPrizes(HackathonEvent event) {
        for (PrizeRank rank : new PrizeRank[] {
                PrizeRank.FIRST, PrizeRank.SECOND, PrizeRank.THIRD, PrizeRank.CONSOLATION }) {
            prizeRepository.save(Prize.builder()
                    .hackathonEvent(event)
                    .rank(rank)
                    .value(switch (rank) {
                        case FIRST -> "7000000";
                        case SECOND -> "5000000";
                        case THIRD -> "3000000";
                        case CONSOLATION -> "1500000";
                    })
                    .quantity(1)
                    .label(rank.name())
                    .build());
        }
    }

    private UUID seedFinalRound(HackathonEvent event) {
        Round round = roundRepository.save(Round.builder()
                .hackathonEvent(event)
                .roundNumber(2)
                .name("Final")
                .roundType(RoundType.FINAL)
                .startDate(LocalDateTime.of(2026, 4, 12, 15, 30))
                .endDate(LocalDateTime.of(2026, 4, 12, 17, 0))
                .submissionDeadline(LocalDateTime.of(2026, 4, 12, 15, 0))
                .scoringDeadline(LocalDateTime.of(2026, 4, 12, 17, 0))
                .advancementCutoff(2)
                .build());
        return round.getId();
    }

    private UUID seedConfirmedTeam(String name, User leader, User extraMember) {
        Team team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name(name)
                .leaderId(leader.getId())
                .status(TeamStatus.CONFIRMED)
                .build());
        teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .userId(leader.getId())
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build());
        if (extraMember != null) {
            teamMemberRepository.save(TeamMember.builder()
                    .team(team)
                    .userId(extraMember.getId())
                    .role(TeamMemberRole.MEMBER)
                    .joinedAt(LocalDateTime.now())
                    .build());
        }
        return team.getId();
    }

    private void seedFormingTeam(String name, User leader) {
        Team team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name(name)
                .leaderId(leader.getId())
                .status(TeamStatus.FORMING)
                .build());
        teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .userId(leader.getId())
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build());
    }

    private void seedRankings(UUID finalRoundId, UUID firstTeamId, UUID secondTeamId) {
        LocalDateTime now = LocalDateTime.now();
        rankingRepository.save(Ranking.builder()
                .teamId(firstTeamId)
                .roundId(finalRoundId)
                .finalScore(new BigDecimal("95.0000"))
                .rank(1)
                .version(1)
                .calculatedAt(now)
                .build());
        rankingRepository.save(Ranking.builder()
                .teamId(secondTeamId)
                .roundId(finalRoundId)
                .finalScore(new BigDecimal("88.0000"))
                .rank(2)
                .version(1)
                .calculatedAt(now)
                .build());
    }
}
