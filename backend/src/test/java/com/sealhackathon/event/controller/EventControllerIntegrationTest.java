package com.sealhackathon.event.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class EventControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private HackathonEventRepository eventRepository;

    @Override
    protected void cleanDatabase() {
        eventRepository.deleteAll();
        super.cleanDatabase();
    }

    // ── BR-08: Coordinator creates event ──

    @Test
    void createEvent_shouldReturn201_asCoordinator() throws Exception {
        User coord = createCoordinator();

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(coord))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Hackathon 2026","season":"Summer","year":2026,
                                 "startDate":"2026-07-01","endDate":"2026-08-31",
                                 "registrationOpenDate":"2026-06-01",
                                 "registrationDeadline":"2026-06-30"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name", is("Hackathon 2026")))
                .andExpect(jsonPath("$.data.status", is("OPEN")));
    }

    // ── BR-10: Duplicate event name ──

    @Test
    void createEvent_shouldReturn409_whenNameDuplicate() throws Exception {
        User admin = createAdmin();
        createEvent("Duplicate");

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Duplicate","season":"Fall","year":2026,
                                 "startDate":"2026-09-01","endDate":"2026-11-30",
                                 "registrationDeadline":"2026-08-31"}
                                """))
                .andExpect(status().isConflict());
    }

    // ── BR-08: No edits after activation ──

    @Test
    void updateEvent_shouldReturn400_whenActive() throws Exception {
        User admin = createAdmin();
        HackathonEvent event = createEvent("Active Event");
        event.setStartDate(LocalDate.now().minusDays(1));
        event.setEndDate(LocalDate.now().plusDays(60));
        event.setRegistrationOpenDate(LocalDate.now().minusDays(30));
        event.setRegistrationDeadline(LocalDate.now().minusDays(2));
        eventRepository.save(event);

        mockMvc.perform(put("/api/events/" + event.getId())
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Changed","season":"Fall","year":2026,
                                 "startDate":"2026-09-01","endDate":"2026-11-30",
                                 "registrationOpenDate":"2026-08-01",
                                 "registrationDeadline":"2026-08-31"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ── Security: Student cannot create events ──

    @Test
    void createEvent_shouldReturn403_forStudent() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"X","season":"S","year":2026,
                                 "startDate":"2026-07-01","endDate":"2026-08-31",
                                 "registrationDeadline":"2026-06-30"}
                                """))
                .andExpect(status().isForbidden());
    }

    // ── Activation flow ──

    @Test
    void activateEvent_shouldReturnResolvedStatus_duringRegistrationPeriod() throws Exception {
        User admin = createAdmin();
        HackathonEvent event = createEvent("To Publish");
        event.getTracks().add(Track.builder()
                .hackathonEvent(event)
                .name("Main")
                .maxTeams(20)
                .build());
        event.getRounds().add(Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round 1")
                .startDate(LocalDateTime.now().plusDays(3))
                .endDate(LocalDateTime.now().plusDays(10))
                .submissionDeadline(LocalDateTime.now().plusDays(10))
                .scoringDeadline(LocalDateTime.now().plusDays(11))
                .advancementCutoff(8)
                .roundWeight(100)
                .build());
        event.setRegistrationOpenDate(LocalDate.now().minusDays(1));
        event.setStartDate(LocalDate.now().plusDays(2));
        event.setEndDate(LocalDate.now().plusDays(30));
        event.setRegistrationDeadline(LocalDate.now().plusDays(1));
        eventRepository.save(event);

        mockMvc.perform(post("/api/events/" + event.getId() + "/activate")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("OPEN")));
    }

    // ── List events ──

    @Test
    void listEvents_shouldReturnAll() throws Exception {
        User admin = createAdmin();
        createEvent("E1");
        createEvent("E2");

        mockMvc.perform(get("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(2)));
    }

    private HackathonEvent createEvent(String name) {
        return eventRepository.save(HackathonEvent.builder()
                .name(name)
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .registrationOpenDate(LocalDate.of(2026, 6, 1))
                .registrationDeadline(LocalDate.of(2026, 6, 30))
                .build());
    }
}
