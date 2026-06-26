package com.sealhackathon.team.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TeamControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;

    private UUID eventId;

    @BeforeEach
    void setUp() {
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Test Event")
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 12, 1))
                .status(EventStatus.ACTIVE)
                .build());
        eventId = event.getId();
    }

    // ── BR-15, BR-16: Create team ──

    @Test
    void createTeam_shouldReturn400_whenNameMissing() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTeam_shouldReturn201_andStatusForming() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alpha"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name", is("Alpha")))
                .andExpect(jsonPath("$.data.status", is("FORMING")))
                .andExpect(jsonPath("$.data.memberCount", is(1)));
    }

    // ── BR-19: Duplicate team name ──

    @Test
    void createTeam_shouldReturn409_whenNameDuplicate() throws Exception {
        User s1 = createUser("s1@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        User s2 = createUser("s2@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                .header("Authorization", "Bearer " + tokenFor(s1))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"TakenName"}
                        """));

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                        .header("Authorization", "Bearer " + tokenFor(s2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"TakenName"}
                                """))
                .andExpect(status().isConflict());
    }

    // ── BR-18: One team per event ──

    @Test
    void createTeam_shouldReturn409_whenAlreadyInTeam() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                .header("Authorization", "Bearer " + tokenFor(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"First"}
                        """));

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Second"}
                                """))
                .andExpect(status().isConflict());
    }

    // ── Get my team ──

    @Test
    void getMyTeam_shouldReturnTeam_afterCreation() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/events/" + eventId + "/teams")
                .header("Authorization", "Bearer " + tokenFor(student))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"MyTeam"}
                        """));

        mockMvc.perform(get("/api/events/" + eventId + "/teams/my-team")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("MyTeam")));
    }
}
