package com.sealhackathon.ranking.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RankingControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private CriteriaRepository criteriaRepository;
    @Autowired private RankingRepository rankingRepository;
    @Autowired private PublishedResultRepository publishedResultRepository;

    private UUID roundId;
    private UUID eventId;

    @BeforeEach
    void setUp() {
        publishedResultRepository.deleteAll();
        rankingRepository.deleteAll();
        criteriaRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Ranking Event").season("Summer").year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 1))
                .status(EventStatus.ACTIVE).build());
        eventId = event.getId();

        Round round = roundRepository.save(Round.builder()
                .hackathonEvent(event).roundNumber(1).name("Final")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 8, 31, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 8, 15, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 8, 30, 23, 59))
                .advancementCutoff(3).build());
        roundId = round.getId();

        criteriaRepository.save(Criteria.builder()
                .round(round).name("Technical").weight(100).sortOrder(1).build());
    }

    // ── Get rankings (empty) ──

    @Test
    void getRankings_shouldReturnEmpty_whenNoScores() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(get("/api/rounds/" + roundId + "/rankings")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()", is(0)));
    }

    // ── BR-51: Publish requires admin/coordinator (via LiveScoreController) ──

    @Test
    void publish_shouldReturn403_forStudent() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/events/" + eventId + "/leaderboard/publish")
                        .param("roundId", roundId.toString())
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isForbidden());
    }

    // ── BR-51: Cannot publish without rankings ──

    @Test
    void publish_shouldReturn400_whenNoRankings() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(post("/api/events/" + eventId + "/leaderboard/publish")
                        .param("roundId", roundId.toString())
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isBadRequest());
    }

    // ── Security: recalculate requires admin ──

    @Test
    void recalculate_shouldReturn403_forJudge() throws Exception {
        User judge = createJudge();

        mockMvc.perform(post("/api/rounds/" + roundId + "/rankings/recalculate")
                        .header("Authorization", "Bearer " + tokenFor(judge)))
                .andExpect(status().isForbidden());
    }

    @Test
    void recalculate_shouldSucceed_forAdmin() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(post("/api/rounds/" + roundId + "/rankings/recalculate")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk());
    }
}
