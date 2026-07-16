package com.sealhackathon.progress.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TeamProgressControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private MentorTeamRepository mentorTeamRepository;

    private UUID eventId;
    private UUID roundId;
    private User coordinator;
    private User mentor;
    private User student;
    private User otherStudent;
    private Team team;
    private Team otherTeam;

    @BeforeEach
    void setUp() {
        coordinator = createCoordinator();
        mentor = createMentor();
        student = createStudent();
        otherStudent = createUser("other@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Progress Event")
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 12, 1))
                .status(EventStatus.ACTIVE)
                .build());
        eventId = event.getId();

        Round round = roundRepository.save(Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Preliminary")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 12, 30, 23, 59))
                .submissionDeadline(LocalDateTime.now().plusDays(2))
                .scoringDeadline(LocalDateTime.now().plusDays(5))
                .advancementCutoff(3)
                .build());
        roundId = round.getId();

        team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name("Mentor Team")
                .leaderId(student.getId())
                .status(TeamStatus.CONFIRMED)
                .build());

        otherTeam = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name("Other Team")
                .leaderId(otherStudent.getId())
                .status(TeamStatus.CONFIRMED)
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .eventId(team.getEventId())
                .userId(student.getId())
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build());

        teamMemberRepository.save(TeamMember.builder()
                .team(otherTeam)
                .eventId(otherTeam.getEventId())
                .userId(otherStudent.getId())
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build());

        mentorTeamRepository.save(MentorTeam.builder()
                .mentorUserId(mentor.getId())
                .team(team)
                .assignedAt(LocalDateTime.now())
                .build());

        assignEventOwner(eventId, coordinator.getId());
    }

    @Test
    void getProgress_shouldReturnAllTeams_forCoordinator() throws Exception {
        mockMvc.perform(get("/api/events/" + eventId + "/rounds/" + roundId + "/progress")
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    void getProgress_shouldReturnMentorTeamsOnly_forLecturer() throws Exception {
        mockMvc.perform(get("/api/events/" + eventId + "/rounds/" + roundId + "/progress")
                        .header("Authorization", "Bearer " + tokenFor(mentor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].teamName", is("Mentor Team")));
    }

    @Test
    void getProgress_shouldReturnOwnTeamOnly_forStudent() throws Exception {
        mockMvc.perform(get("/api/events/" + eventId + "/rounds/" + roundId + "/progress")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].teamId", is(team.getId().toString())));
    }

    @Test
    void getProgress_shouldReturn403_forUnrelatedCoordinator() throws Exception {
        User otherCoord = createUser("other-coord@test.com", UserType.EVENT_COORDINATOR, AccountStatus.ACTIVE);
        mockMvc.perform(get("/api/events/" + eventId + "/rounds/" + roundId + "/progress")
                        .header("Authorization", "Bearer " + tokenFor(otherCoord)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMentorAtRisk_shouldReturn403_forStudent() throws Exception {
        mockMvc.perform(get("/api/mentor/teams/at-risk")
                        .param("eventId", eventId.toString())
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isForbidden());
    }
}
