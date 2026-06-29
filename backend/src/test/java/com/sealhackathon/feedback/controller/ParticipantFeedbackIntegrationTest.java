package com.sealhackathon.feedback.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.feedback.repository.ParticipantFeedbackRepository;
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
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ParticipantFeedbackIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private ParticipantFeedbackRepository feedbackRepository;

    private User coordinator;
    private User student;
    private User formingStudent;
    private UUID completedEventId;
    private UUID activeEventId;
    private UUID confirmedTeamId;

    @BeforeEach
    void setUp() {
        feedbackRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        coordinator = createCoordinator();
        student = createStudent();
        formingStudent = createUser("forming@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        completedEventId = seedEvent("Completed Event", LocalDate.of(2026, 4, 10), LocalDate.of(2026, 4, 12),
                EventStatus.ACTIVE, coordinator.getEmail());
        activeEventId = seedEvent("Active Event", LocalDate.of(2026, 6, 1), LocalDate.of(2026, 12, 31),
                EventStatus.ACTIVE, coordinator.getEmail());

        confirmedTeamId = seedConfirmedTeam(completedEventId, "Team Alpha", student);
        seedFormingTeam(activeEventId, "Team Forming", formingStudent);
    }

    @Test
    void submitFeedback_shouldSucceed_whenEventCompletedAndTeamConfirmed() throws Exception {
        mockMvc.perform(post("/api/events/" + completedEventId + "/participant-feedback")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"overallRating":4,"comment":"Great event!"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.overallRating", is(4)))
                .andExpect(jsonPath("$.data.comment", is("Great event!")))
                .andExpect(jsonPath("$.data.teamId", is(confirmedTeamId.toString())));

        mockMvc.perform(get("/api/events/" + completedEventId + "/participant-feedback/me")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId", is(student.getId().toString())));
    }

    @Test
    void submitFeedback_shouldReturn400_whenEventNotCompleted() throws Exception {
        mockMvc.perform(post("/api/events/" + activeEventId + "/participant-feedback")
                        .header("Authorization", "Bearer " + tokenFor(formingStudent))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"overallRating":5,"comment":"Too early"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submitFeedback_shouldReturn400_whenTeamNotConfirmed() throws Exception {
        UUID formingTeamId = seedFormingTeam(completedEventId, "Team Forming 2", formingStudent);

        mockMvc.perform(post("/api/events/" + completedEventId + "/participant-feedback")
                        .header("Authorization", "Bearer " + tokenFor(formingStudent))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"overallRating":3}
                                """))
                .andExpect(status().isBadRequest());

        org.assertj.core.api.Assertions.assertThat(formingTeamId).isNotNull();
    }

    @Test
    void submitFeedback_shouldReturn409_onDuplicate() throws Exception {
        submitFeedback(student, completedEventId, 5, "First");

        mockMvc.perform(post("/api/events/" + completedEventId + "/participant-feedback")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"overallRating":2,"comment":"Second"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void getMyFeedback_shouldReturn404_beforeSubmit() throws Exception {
        mockMvc.perform(get("/api/events/" + completedEventId + "/participant-feedback/me")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isNotFound());
    }

    @Test
    void coordinatorCanListAndSummarizeFeedback() throws Exception {
        submitFeedback(student, completedEventId, 4, "Nice");

        mockMvc.perform(get("/api/events/" + completedEventId + "/participant-feedback")
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()", is(1)))
                .andExpect(jsonPath("$.data[0].teamName", is("Team Alpha")));

        mockMvc.perform(get("/api/events/" + completedEventId + "/participant-feedback/summary")
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCount", is(1)))
                .andExpect(jsonPath("$.data.averageRating", is(4.0)))
                .andExpect(jsonPath("$.data.ratingDistribution['4']", is(1)));
    }

    private void submitFeedback(User user, UUID eventId, int rating, String comment) throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/participant-feedback")
                        .header("Authorization", "Bearer " + tokenFor(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"overallRating":%d,"comment":"%s"}
                                """, rating, comment)))
                .andExpect(status().isCreated());
    }

    private UUID seedEvent(String name, LocalDate start, LocalDate end, EventStatus status, String createdBy) {
        HackathonEvent event = HackathonEvent.builder()
                .name(name)
                .season("SPRING")
                .year(2026)
                .startDate(start)
                .endDate(end)
                .registrationDeadline(start.minusDays(2))
                .status(status)
                .build();
        event.setCreatedBy(createdBy);
        event = eventRepository.save(event);
        return event.getId();
    }

    private UUID seedConfirmedTeam(UUID eventId, String name, User leader) {
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
        return team.getId();
    }

    private UUID seedFormingTeam(UUID eventId, String name, User leader) {
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
        return team.getId();
    }
}
