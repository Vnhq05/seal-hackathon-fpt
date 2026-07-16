package com.sealhackathon.event.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.PrizeRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SealEventFormatIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private TrackRepository trackRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private CriteriaRepository criteriaRepository;
    @Autowired private PrizeRepository prizeRepository;

    @Test
    @WithMockUser(roles = "SYSTEM_ADMIN")
    void createSealEvent_appliesTemplate() throws Exception {
        LocalDate regOpen = LocalDate.now().minusDays(1);
        LocalDate regClose = LocalDate.now().plusDays(28);
        LocalDate start = regClose.plusDays(1);
        LocalDate end = start.plusDays(1);

        CreateEventRequest request = CreateEventRequest.builder()
                .name("SEAL Test Spring")
                .season("SPRING")
                .year(LocalDate.now().getYear())
                .startDate(start)
                .endDate(end)
                .registrationOpenDate(regOpen)
                .registrationDeadline(regClose)
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .build();

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.competitionFormat").value("SEAL_RAG_2026"))
                .andExpect(jsonPath("$.data.trackCount").value(3))
                .andExpect(jsonPath("$.data.roundCount").value(2));

        UUID eventId = eventRepository.findAll().stream()
                .filter(e -> e.getName().equals("SEAL Test Spring"))
                .findFirst()
                .orElseThrow()
                .getId();

        assertThat(eventRepository.findById(eventId).orElseThrow().getCompetitionFormat())
                .isEqualTo(CompetitionFormat.SEAL_RAG_2026);

        List<Track> tracks = trackRepository.findByHackathonEventId(eventId);
        assertThat(tracks).hasSize(3);
        assertThat(tracks.get(0).getTopic()).isNull();

        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        assertThat(rounds).hasSize(2);
        assertThat(rounds.get(0).getRoundType()).isEqualTo(RoundType.PRELIMINARY);
        assertThat(rounds.get(0).getAdvancementRule()).isEqualTo(AdvancementRule.PER_TRACK_TOP_N);
        assertThat(rounds.get(0).getSlideDeadline()).isNotNull();
        assertThat(rounds.get(1).getRoundType()).isEqualTo(RoundType.FINAL);
        assertThat(rounds.get(1).getAdvancementRule()).isEqualTo(AdvancementRule.FINALIST_POOL);

        assertThat(prizeRepository.findByHackathonEventId(eventId)).hasSize(4);

        Round preliminary = rounds.get(0);
        Round finalRound = rounds.get(1);

        List<Criteria> preCriteria = criteriaRepository.findByRoundIdOrderBySortOrderAsc(preliminary.getId());
        List<Criteria> finalCriteria = criteriaRepository.findByRoundIdOrderBySortOrderAsc(finalRound.getId());
        assertThat(preCriteria).hasSize(5);
        assertThat(finalCriteria).hasSize(5);

        List<Integer> preWeights = preCriteria.stream().map(Criteria::getWeight).toList();
        assertThat(preWeights).containsExactly(30, 30, 15, 15, 10);

        List<Integer> finalWeights = finalCriteria.stream().map(Criteria::getWeight).toList();
        assertThat(finalWeights).containsExactly(30, 20, 20, 20, 10);

        preCriteria.forEach(c -> {
            assertThat(c.getMinScore()).isEqualTo(1);
            assertThat(c.getMaxScore()).isEqualTo(5);
        });
        finalCriteria.forEach(c -> {
            assertThat(c.getMinScore()).isEqualTo(1);
            assertThat(c.getMaxScore()).isEqualTo(5);
        });

        Set<String> preNames = preCriteria.stream().map(Criteria::getName).collect(Collectors.toSet());
        Set<String> finalNames = finalCriteria.stream().map(Criteria::getName).collect(Collectors.toSet());
        assertThat(preNames).doesNotContainAnyElementsOf(finalNames);
    }
}
