package com.sealhackathon.event.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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

    @Test
    void updateEventStatus_shouldTransitionToClosedRegistration() throws Exception {
        User admin = createAdmin();
        HackathonEvent event = createEvent("Status Flow");
        event.setRegistrationOpenDate(LocalDate.now().minusDays(1));
        event.setStartDate(LocalDate.now().plusDays(2));
        event.setEndDate(LocalDate.now().plusDays(30));
        event.setRegistrationDeadline(LocalDate.now().plusDays(1));
        eventRepository.save(event);

        mockMvc.perform(patch("/api/events/" + event.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED_REGISTRATION\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED_REGISTRATION")));
    }

    @Test
    void updateEventStatus_shouldReturn400_forInvalidTransition() throws Exception {
        User admin = createAdmin();
        HackathonEvent event = createEvent("Invalid Transition");
        event.setRegistrationOpenDate(LocalDate.now().plusDays(5));
        event.setStartDate(LocalDate.now().plusDays(10));
        event.setEndDate(LocalDate.now().plusDays(40));
        event.setRegistrationDeadline(LocalDate.now().plusDays(8));
        event.setStatus(EventStatus.UPCOMING);
        eventRepository.save(event);

        mockMvc.perform(patch("/api/events/" + event.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SCORING\"}"))
                .andExpect(status().isBadRequest());
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

    @Test
    void listEvents_shouldReturnOnlyOwnedEvents_forCoordinator() throws Exception {
        User coordinator = createCoordinator();
        User otherCoordinator = createUser("other-coord@test.com", UserType.EVENT_COORDINATOR, AccountStatus.ACTIVE);

        HackathonEvent owned = createEvent("Owned Event");
        owned.setCreatedBy(coordinator.getEmail());
        eventRepository.save(owned);

        HackathonEvent foreign = createEvent("Foreign Event");
        foreign.setCreatedBy(otherCoordinator.getEmail());
        eventRepository.save(foreign);

        mockMvc.perform(get("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Owned Event")));
    }

    @Test
    void createEvent_shouldAssignCoordinatorOwner_whenAdminSpecifiesEmail() throws Exception {
        User admin = createAdmin();
        User coordinator = createCoordinator();

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"SEAL Hackathon Spring","season":"Spring","year":2026,
                                 "startDate":"2026-04-12","endDate":"2026-04-12",
                                 "registrationOpenDate":"2026-03-01",
                                 "registrationDeadline":"2026-03-25",
                                 "coordinatorEmail":"%s"}
                                """.formatted(coordinator.getEmail())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", is(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("SEAL Hackathon Spring")));
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
