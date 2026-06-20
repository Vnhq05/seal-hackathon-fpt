package com.sealhackathon.judging.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class JudgingControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private CriteriaRepository criteriaRepository;
    @Autowired private JudgeAssignmentRepository judgeAssignmentRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private SubmissionRepository submissionRepository;

    private UUID roundId;
    private UUID submissionId;
    private UUID criteriaId;
    private User judge;

    @BeforeEach
    void setUp() {
        submissionRepository.deleteAll();
        judgeAssignmentRepository.deleteAll();
        criteriaRepository.deleteAll();
        roundRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        judge = createJudge();

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Scoring Event")
                .season("Summer").year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 1))
                .status(EventStatus.ACTIVE)
                .build());

        Round round = roundRepository.save(Round.builder()
                .hackathonEvent(event)
                .roundNumber(1).name("Round 1")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 8, 31, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 8, 15, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 12, 30, 23, 59))
                .advancementCutoff(3)
                .build());
        roundId = round.getId();

        Criteria criteria = criteriaRepository.save(Criteria.builder()
                .round(round).name("Technical").weight(100).sortOrder(1).build());
        criteriaId = criteria.getId();

        judgeAssignmentRepository.save(JudgeAssignment.builder()
                .round(round).judgeUserId(judge.getId())
                .assignedAt(LocalDateTime.now()).build());

        Team team = teamRepository.save(Team.builder()
                .eventId(event.getId()).name("Team A")
                .leaderId(UUID.randomUUID()).status(TeamStatus.CONFIRMED).build());

        Submission submission = submissionRepository.save(Submission.builder()
                .teamId(team.getId()).roundId(roundId)
                .submittedBy(team.getLeaderId())
                .status(SubmissionStatus.SUBMITTED).build());
        submissionId = submission.getId();
    }

    // ── BR-35: Submit score ──

    @Test
    void submitScore_shouldReturn201_whenValid() throws Exception {
        mockMvc.perform(post("/api/rounds/" + roundId + "/scoring")
                        .header("Authorization", "Bearer " + tokenFor(judge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","scores":[
                                  {"criteriaId":"%s","score":85}
                                ]}
                                """, submissionId, criteriaId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));
    }

    // ── BR-36: Comment required for extreme scores ──

    @Test
    void submitScore_shouldReturn400_whenLowScoreWithoutComment() throws Exception {
        mockMvc.perform(post("/api/rounds/" + roundId + "/scoring")
                        .header("Authorization", "Bearer " + tokenFor(judge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","scores":[
                                  {"criteriaId":"%s","score":30}
                                ]}
                                """, submissionId, criteriaId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        org.hamcrest.Matchers.containsString("Comment is required")));
    }

    @Test
    void submitScore_shouldSucceed_whenExtremeScoreHasComment() throws Exception {
        mockMvc.perform(post("/api/rounds/" + roundId + "/scoring")
                        .header("Authorization", "Bearer " + tokenFor(judge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","scores":[
                                  {"criteriaId":"%s","score":95,"comment":"Outstanding work"}
                                ]}
                                """, submissionId, criteriaId)))
                .andExpect(status().isCreated());
    }

    // ── Security: Student cannot score ──

    @Test
    void submitScore_shouldReturn403_forStudent() throws Exception {
        User student = createStudent();

        mockMvc.perform(post("/api/rounds/" + roundId + "/scoring")
                        .header("Authorization", "Bearer " + tokenFor(student))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","scores":[
                                  {"criteriaId":"%s","score":70}
                                ]}
                                """, submissionId, criteriaId)))
                .andExpect(status().isForbidden());
    }

    // ── BR-35: Score out of range ──

    @Test
    void submitScore_shouldReturn400_whenScoreOutOfRange() throws Exception {
        mockMvc.perform(post("/api/rounds/" + roundId + "/scoring")
                        .header("Authorization", "Bearer " + tokenFor(judge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","scores":[
                                  {"criteriaId":"%s","score":150}
                                ]}
                                """, submissionId, criteriaId)))
                .andExpect(status().isBadRequest());
    }
}
