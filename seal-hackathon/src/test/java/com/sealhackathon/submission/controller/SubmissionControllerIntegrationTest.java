package com.sealhackathon.submission.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
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
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SubmissionControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private SubmissionRepository submissionRepository;

    private UUID roundId;
    private User leader;

    @BeforeEach
    void setUp() {
        submissionRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        roundRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        leader = createUser("leader@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Submit Event").season("Summer").year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 12, 1))
                .status(EventStatus.ACTIVE).build());

        Round round = roundRepository.save(Round.builder()
                .hackathonEvent(event).roundNumber(1).name("R1")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 12, 30, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 12, 29, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 12, 30, 23, 59))
                .advancementCutoff(3).build());
        roundId = round.getId();

        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId()).name("Team Submit")
                .leaderId(leader.getId()).status(TeamStatus.CONFIRMED).build());

        teamMemberRepository.save(TeamMember.builder()
                .team(team).userId(leader.getId())
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now()).build());
    }

    // ── BR-25: Happy path submission ──

    @Test
    void submit_shouldReturn201_whenValid() throws Exception {
        MockMultipartFile pdf = new MockMultipartFile(
                "pdf", "report.pdf", "application/pdf", new byte[1024]);

        MockMultipartFile submission = new MockMultipartFile(
                "submission", "", "application/json",
                """
                {"githubUrl":"https://github.com/user/repo",
                 "demoUrl":"https://youtube.com/watch?v=abc","pdfPageCount":2}
                """.getBytes());

        mockMvc.perform(multipart("/api/rounds/" + roundId + "/submissions")
                        .file(pdf)
                        .file(submission)
                        .header("Authorization", "Bearer " + tokenFor(leader)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("SUBMITTED")));
    }

    // ── BR-31: Non-leader cannot submit ──

    @Test
    void submit_shouldReturn403_whenNotLeader() throws Exception {
        User member = createUser("member@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        MockMultipartFile pdf = new MockMultipartFile(
                "pdf", "doc.pdf", "application/pdf", new byte[100]);
        MockMultipartFile submission = new MockMultipartFile(
                "submission", "", "application/json",
                """
                {"githubUrl":"https://github.com/u/r",
                 "demoUrl":"https://youtube.com/watch?v=x","pdfPageCount":1}
                """.getBytes());

        mockMvc.perform(multipart("/api/rounds/" + roundId + "/submissions")
                        .file(pdf)
                        .file(submission)
                        .header("Authorization", "Bearer " + tokenFor(member)))
                .andExpect(status().isForbidden());
    }
}
