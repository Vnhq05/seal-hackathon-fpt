package com.sealhackathon.event.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.repository.HackathonEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SealEventFormatIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HackathonEventRepository eventRepository;

    @Test
    @WithMockUser(roles = "SYSTEM_ADMIN")
    void createSealEvent_appliesTemplate() throws Exception {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("SEAL Test Spring")
                .season("SPRING")
                .year(2026)
                .startDate(LocalDate.of(2026, 4, 12))
                .endDate(LocalDate.of(2026, 4, 12))
                .registrationDeadline(LocalDate.of(2026, 3, 25))
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .build();

        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.competitionFormat").value("SEAL_RAG_2026"))
                .andExpect(jsonPath("$.data.trackCount").value(3))
                .andExpect(jsonPath("$.data.roundCount").value(2));

        var saved = eventRepository.findAll().stream()
                .filter(e -> e.getName().equals("SEAL Test Spring"))
                .findFirst()
                .orElseThrow();

        assertThat(saved.getCompetitionFormat()).isEqualTo(CompetitionFormat.SEAL_RAG_2026);
        assertThat(saved.getTracks()).hasSize(3);
        assertThat(saved.getTracks().get(0).getTopic()).isNotBlank();
        assertThat(saved.getRounds()).hasSize(2);
        assertThat(saved.getRounds().get(0).getRoundType()).isEqualTo(RoundType.PRELIMINARY);
        assertThat(saved.getRounds().get(1).getRoundType()).isEqualTo(RoundType.FINAL);
        assertThat(saved.getPrizes()).hasSize(4);
    }
}
