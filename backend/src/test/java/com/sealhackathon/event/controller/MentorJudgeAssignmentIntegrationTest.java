package com.sealhackathon.event.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.EventJudgeAssignment;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.EventJudgeAssignmentRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MentorJudgeAssignmentIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private TrackRepository trackRepository;
    @Autowired private RoundRepository roundRepository;
    @Autowired private EventJudgeAssignmentRepository eventJudgeRepository;
    @Autowired private MentorAssignmentRepository mentorAssignmentRepository;

    private User admin;
    private User mentor;
    private User judge;
    private UUID eventId;
    private UUID trackId;
    private UUID preliminaryRoundId;
    private UUID finalRoundId;

    @BeforeEach
    void setUp() {
        mentorAssignmentRepository.deleteAll();
        eventJudgeRepository.deleteAll();
        roundRepository.deleteAll();
        trackRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        admin = createAdmin();
        mentor = createUser("mentor@test.com", com.sealhackathon.common.enums.UserType.LECTURER,
                com.sealhackathon.common.enums.AccountStatus.ACTIVE);
        judge = createJudge();

        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Track Assignment Event")
                .season("Summer").year(2026)
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 30))
                .status(EventStatus.OPEN)
                .build());
        eventId = event.getId();

        Track track = trackRepository.save(Track.builder()
                .hackathonEvent(event)
                .name("Software")
                .maxTeams(10)
                .build());
        trackId = track.getId();

        Round preliminary = roundRepository.save(Round.builder()
                .hackathonEvent(event)
                .roundNumber(1).name("Preliminary")
                .roundType(RoundType.PRELIMINARY)
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 14, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 15, 23, 59))
                .advancementCutoff(3)
                .build());
        preliminaryRoundId = preliminary.getId();

        Round finalRound = roundRepository.save(Round.builder()
                .hackathonEvent(event)
                .roundNumber(2).name("Final")
                .roundType(RoundType.FINAL)
                .startDate(LocalDateTime.of(2026, 7, 16, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 20, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 19, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 20, 23, 59))
                .advancementCutoff(1)
                .build());
        finalRoundId = finalRound.getId();

        eventJudgeRepository.save(EventJudgeAssignment.builder()
                .hackathonEvent(event)
                .judgeUserId(judge.getId())
                .assignedAt(LocalDateTime.now())
                .build());
    }

    @Test
    void assignMentor_shouldReturn201_withTrackId() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/tracks/" + trackId + "/mentors")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mentorUserId\":\"" + mentor.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.trackId", is(trackId.toString())))
                .andExpect(jsonPath("$.data.trackName", is("Software")))
                .andExpect(jsonPath("$.data.mentorUserId", is(mentor.getId().toString())));
    }

    @Test
    void listMentors_shouldReturnTrackScopedMentors() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/tracks/" + trackId + "/mentors")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"mentorUserId\":\"" + mentor.getId() + "\"}"))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/events/" + eventId + "/tracks/" + trackId + "/mentors")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].trackId", is(trackId.toString())));
    }

    @Test
    void assignJudge_preliminary_requiresTrackId() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/rounds/" + preliminaryRoundId + "/judges")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"judgeUserId\":\"" + judge.getId() + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void assignJudge_preliminary_shouldSucceed_withTrackId() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/rounds/" + preliminaryRoundId + "/judges")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"judgeUserId\":\"" + judge.getId() + "\",\"trackId\":\"" + trackId + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.trackId", is(trackId.toString())))
                .andExpect(jsonPath("$.data.trackName", is("Software")));
    }

    @Test
    void assignJudge_final_rejectsTrackId() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/rounds/" + finalRoundId + "/judges")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"judgeUserId\":\"" + judge.getId() + "\",\"trackId\":\"" + trackId + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void assignJudge_final_shouldSucceed_withoutTrackId() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/rounds/" + finalRoundId + "/judges")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"judgeUserId\":\"" + judge.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.trackId").value(nullValue()));
    }

    @Test
    void listJudges_preliminary_requiresTrackIdQuery() throws Exception {
        mockMvc.perform(get("/api/events/" + eventId + "/rounds/" + preliminaryRoundId + "/judges")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void oldEventMentorEndpoint_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/events/" + eventId + "/mentors")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isNotFound());
    }
}
