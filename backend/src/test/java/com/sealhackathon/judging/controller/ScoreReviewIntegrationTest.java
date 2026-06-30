package com.sealhackathon.judging.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.ScoreReviewRequestRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
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
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScoreReviewIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private CriteriaRepository criteriaRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    @Autowired private JudgeScoreRepository judgeScoreRepository;
    @Autowired private ScoreReviewRequestRepository scoreReviewRequestRepository;

    private UUID eventId;
    private UUID roundId;
    private UUID teamId;
    private UUID submissionId;
    private UUID criteriaId;
    private User judge1;
    private User judge2;
    private User judge3;
    private User unassignedJudge;

    @BeforeEach
    void setUp() {
        scoreReviewRequestRepository.deleteAll();
        judgeScoreRepository.deleteAll();
        teamJudgeAssignmentRepository.deleteAll();
        submissionRepository.deleteAll();
        criteriaRepository.deleteAll();
        roundRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        judge1 = createUser("judge1@test.com", com.sealhackathon.common.enums.UserType.LECTURER,
                com.sealhackathon.common.enums.AccountStatus.ACTIVE);
        judge2 = createUser("judge2@test.com", com.sealhackathon.common.enums.UserType.LECTURER,
                com.sealhackathon.common.enums.AccountStatus.ACTIVE);
        judge3 = createUser("judge3@test.com", com.sealhackathon.common.enums.UserType.LECTURER,
                com.sealhackathon.common.enums.AccountStatus.ACTIVE);
        unassignedJudge = createUser("other@test.com", com.sealhackathon.common.enums.UserType.LECTURER,
                com.sealhackathon.common.enums.AccountStatus.ACTIVE);

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Deviation Event")
                .season("Summer").year(2026)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 1))
                .status(EventStatus.ACTIVE)
                .build());
        eventId = event.getId();

        Round round = roundRepository.save(Round.builder()
                .hackathonEvent(event)
                .roundNumber(1).name("Round 1")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 12, 31, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 12, 15, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 12, 30, 23, 59))
                .advancementCutoff(3)
                .build());
        roundId = round.getId();

        Criteria criteria = criteriaRepository.save(Criteria.builder()
                .round(round).name("Overall").weight(100).sortOrder(1)
                .minScore(1).maxScore(5).build());
        criteriaId = criteria.getId();

        Team team = teamRepository.save(Team.builder()
                .eventId(eventId).name("Team Alpha")
                .leaderId(UUID.randomUUID()).status(TeamStatus.CONFIRMED).build());
        teamId = team.getId();

        Submission submission = submissionRepository.save(Submission.builder()
                .teamId(teamId).roundId(roundId)
                .submittedBy(team.getLeaderId())
                .status(SubmissionStatus.SUBMITTED).build());
        submissionId = submission.getId();

        for (User judge : List.of(judge1, judge2, judge3)) {
            teamJudgeAssignmentRepository.save(TeamJudgeAssignment.builder()
                    .teamId(teamId)
                    .roundId(roundId)
                    .judgeUserId(judge.getId())
                    .assignedAt(LocalDateTime.now())
                    .build());
        }
    }

    @Test
    void getByTeam_shouldReturn403_whenJudgeNotAssigned() throws Exception {
        mockMvc.perform(get("/api/rounds/" + roundId + "/submissions/team/" + teamId)
                        .header("Authorization", "Bearer " + tokenFor(unassignedJudge)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getByTeam_shouldReturn200_whenJudgeAssigned() throws Exception {
        mockMvc.perform(get("/api/rounds/" + roundId + "/submissions/team/" + teamId)
                        .header("Authorization", "Bearer " + tokenFor(judge1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(submissionId.toString()));
    }

    @Test
    void scoringComplete_shouldCreateOpenReview_whenDeviationAtOrAbove25() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        var review = scoreReviewRequestRepository.findBySubmissionId(submissionId);
        assertThat(review).isPresent();
        assertThat(review.get().getStatus()).isEqualTo(ScoreReviewStatus.OPEN);
        assertThat(review.get().getDeviationValue().doubleValue()).isGreaterThanOrEqualTo(25.0);

        User admin = createAdmin();
        mockMvc.perform(get("/api/events/" + eventId + "/score-reviews")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status").value("OPEN"));
    }

    @Test
    void scoringComplete_shouldNotCreateReview_whenDeviationBelow25() throws Exception {
        submitScore(judge1, 5, "Great");
        submitScore(judge2, 4, "Good");
        submitScore(judge3, 4, "Solid");

        assertThat(scoreReviewRequestRepository.findBySubmissionId(submissionId)).isEmpty();
    }

    @Test
    void getReviewDetail_shouldReturnJudgeScores_forCoordinator() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        UUID reviewId = scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .orElseThrow().getId();
        User coordinator = createCoordinator();

        mockMvc.perform(get("/api/events/" + eventId + "/score-reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.judgeScores", hasSize(3)))
                .andExpect(jsonPath("$.data.deviationValue").value(org.hamcrest.Matchers.greaterThanOrEqualTo(25.0)));
    }

    @Test
    void getReviewDetail_shouldReturn200_forAssignedJudge() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        UUID reviewId = scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .orElseThrow().getId();

        mockMvc.perform(get("/api/events/" + eventId + "/score-reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenFor(judge1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.judgeScores", hasSize(3)));
    }

    @Test
    void getReviewDetail_shouldReturn403_forUnassignedJudge() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        UUID reviewId = scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .orElseThrow().getId();

        mockMvc.perform(get("/api/events/" + eventId + "/score-reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenFor(unassignedJudge)))
                .andExpect(status().isForbidden());
    }

    @Test
    void resolveReview_shouldCloseOpenReview_forCoordinator() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        UUID reviewId = scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .orElseThrow().getId();
        User coordinator = createCoordinator();

        mockMvc.perform(patch("/api/events/" + eventId + "/score-reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenFor(coordinator))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"RESOLVED","resolutionNote":"Judges aligned after discussion"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RESOLVED"))
                .andExpect(jsonPath("$.data.resolutionNote").value("Judges aligned after discussion"));

        assertThat(scoreReviewRequestRepository.findById(reviewId).orElseThrow().getStatus())
                .isEqualTo(ScoreReviewStatus.RESOLVED);
    }

    @Test
    void resolveReview_shouldReturn403_forJudge() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        UUID reviewId = scoreReviewRequestRepository.findBySubmissionId(submissionId)
                .orElseThrow().getId();

        mockMvc.perform(patch("/api/events/" + eventId + "/score-reviews/" + reviewId)
                        .header("Authorization", "Bearer " + tokenFor(judge1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void judgeRequest_shouldCreateOpenReview_whenNoReviewExists() throws Exception {
        submitScore(judge1, 4, "Good work overall");
        submitScore(judge2, 4, "Solid submission");
        submitScore(judge3, 3, "Acceptable quality");

        mockMvc.perform(post("/api/events/" + eventId + "/score-reviews/judge-request")
                        .header("Authorization", "Bearer " + tokenFor(judge1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","note":"Please re-examine the scoring spread for this team."}
                                """, submissionId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.resolutionNote")
                        .value("Please re-examine the scoring spread for this team."));

        assertThat(scoreReviewRequestRepository.findBySubmissionId(submissionId)).isPresent();
    }

    @Test
    void judgeRequest_shouldReturn409_whenOpenReviewExists() throws Exception {
        submitScore(judge1, 5, "Excellent");
        submitScore(judge2, 5, "Top marks");
        submitScore(judge3, 1, "Poor fit");

        mockMvc.perform(post("/api/events/" + eventId + "/score-reviews/judge-request")
                        .header("Authorization", "Bearer " + tokenFor(judge1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","note":"Please re-examine the scoring spread for this team."}
                                """, submissionId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message")
                        .value("A deviation review is already open for this submission."));
    }

    @Test
    void judgeRequest_shouldReturn403_forUnassignedJudge() throws Exception {
        submitScore(judge1, 4, "Good work overall");
        submitScore(judge2, 4, "Solid submission");
        submitScore(judge3, 3, "Acceptable quality");

        mockMvc.perform(post("/api/events/" + eventId + "/score-reviews/judge-request")
                        .header("Authorization", "Bearer " + tokenFor(unassignedJudge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","note":"Please re-examine the scoring spread for this team."}
                                """, submissionId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void judgeRequest_shouldReopenResolvedReview() throws Exception {
        submitScore(judge1, 4, "Good work overall");
        submitScore(judge2, 4, "Solid submission");
        submitScore(judge3, 3, "Acceptable quality");

        UUID reviewId = scoreReviewRequestRepository.save(
                com.sealhackathon.judging.domain.ScoreReviewRequest.builder()
                        .eventId(eventId)
                        .roundId(roundId)
                        .teamId(teamId)
                        .submissionId(submissionId)
                        .deviationValue(java.math.BigDecimal.valueOf(20))
                        .minJudgeScore(java.math.BigDecimal.valueOf(60))
                        .maxJudgeScore(java.math.BigDecimal.valueOf(80))
                        .status(ScoreReviewStatus.RESOLVED)
                        .resolvedAt(LocalDateTime.now())
                        .resolutionNote("Previously closed")
                        .build()
        ).getId();

        mockMvc.perform(post("/api/events/" + eventId + "/score-reviews/judge-request")
                        .header("Authorization", "Bearer " + tokenFor(judge1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","note":"Requesting another review after discussion."}
                                """, submissionId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andExpect(jsonPath("$.data.resolutionNote")
                        .value("Requesting another review after discussion."));

        assertThat(scoreReviewRequestRepository.findById(reviewId).orElseThrow().getStatus())
                .isEqualTo(ScoreReviewStatus.OPEN);
    }

    private void submitScore(User judge, int score, String comment) throws Exception {
        mockMvc.perform(post("/api/rounds/" + roundId + "/scoring")
                        .header("Authorization", "Bearer " + tokenFor(judge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"submissionId":"%s","complete":true,"scores":[
                                  {"criteriaId":"%s","score":%d,"comment":"%s"}
                                ]}
                                """, submissionId, criteriaId, score, comment)))
                .andExpect(status().isCreated());
    }
}
