package com.sealhackathon.event.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackDrawSessionRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TrackDrawSessionIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private TrackDrawSessionRepository drawSessionRepository;

    private User admin;
    private User leader1;
    private User leader2;
    private User nonLeader;
    private UUID eventId;
    private UUID team1Id;
    private UUID team2Id;
    private UUID trackAId;
    private UUID trackBId;

    @BeforeEach
    void setUp() throws Exception {
        drawSessionRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        eventRepository.deleteAll();
        super.cleanDatabase();

        admin = createAdmin();
        leader1 = createUser("leader1@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        leader2 = createUser("leader2@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        nonLeader = createUser("member@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);

        eventId = createSealEvent();
        team1Id = createTeam(leader1, "Team Alpha");
        team2Id = createTeam(leader2, "Team Beta");
        trackAId = listTrackId(0);
        trackBId = listTrackId(1);
    }

    @Test
    void fullDrawFlow_openSelfDrawTopicLock() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/tracks/draw-session/open")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andExpect(jsonPath("$.data.currentTeamId", is(team1Id.toString())))
                .andExpect(jsonPath("$.data.totalTeams", is(2)));

        mockMvc.perform(post("/api/events/" + eventId + "/teams/" + team1Id + "/track/draw")
                        .header("Authorization", "Bearer " + tokenFor(leader1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trackId\":\"" + trackAId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.method", is("SELF_DRAW")))
                .andExpect(jsonPath("$.data.trackId", is(trackAId.toString())));

        mockMvc.perform(get("/api/events/" + eventId + "/tracks/draw-session")
                        .header("Authorization", "Bearer " + tokenFor(leader2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentTeamId", is(team2Id.toString())));

        mockMvc.perform(post("/api/events/" + eventId + "/teams/" + team2Id + "/track/draw")
                        .header("Authorization", "Bearer " + tokenFor(leader2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trackId\":\"" + trackBId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.method", is("SELF_DRAW")));

        mockMvc.perform(get("/api/events/" + eventId + "/tracks/draw-session")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CLOSED")));

        mockMvc.perform(put("/api/events/" + eventId + "/tracks/" + trackAId + "/topic")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"Healthcare RAG\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.topic", is("Healthcare RAG")))
                .andExpect(jsonPath("$.data.status", is("OPEN")));

        mockMvc.perform(post("/api/events/" + eventId + "/tracks/lock")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lockedTrackCount", is(3)));

        mockMvc.perform(get("/api/events/" + eventId + "/tracks/" + trackAId)
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("LOCKED")));

        mockMvc.perform(put("/api/events/" + eventId + "/tracks/" + trackAId + "/topic")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"Changed\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void openDrawSession_shouldReturn409_whenSessionAlreadyOpen() throws Exception {
        openDrawSession();

        mockMvc.perform(post("/api/events/" + eventId + "/tracks/draw-session/open")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
    }

    @Test
    void openDrawSession_shouldReturn400_whenAllTeamsAssigned() throws Exception {
        openDrawSession();
        selfDraw(leader1, team1Id, trackAId);
        selfDraw(leader2, team2Id, trackBId);

        mockMvc.perform(post("/api/events/" + eventId + "/tracks/draw-session/open")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void selfDraw_shouldReturn403_whenNotTeamTurn() throws Exception {
        openDrawSession();

        mockMvc.perform(post("/api/events/" + eventId + "/teams/" + team2Id + "/track/draw")
                        .header("Authorization", "Bearer " + tokenFor(leader2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trackId\":\"" + trackBId + "\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void selfDraw_shouldReturn403_whenNotLeader() throws Exception {
        openDrawSession();

        mockMvc.perform(post("/api/events/" + eventId + "/teams/" + team1Id + "/track/draw")
                        .header("Authorization", "Bearer " + tokenFor(nonLeader))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trackId\":\"" + trackAId + "\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void selectTrack_shouldReturn403_forSealFormat() throws Exception {
        mockMvc.perform(put("/api/events/" + eventId + "/teams/" + team1Id + "/track")
                        .header("Authorization", "Bearer " + tokenFor(leader1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trackId\":\"" + trackAId + "\"}"))
                .andExpect(status().isForbidden());
    }

    private UUID createSealEvent() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"SEAL Draw Test","season":"SPRING","year":2026,
                                 "startDate":"2026-04-12","endDate":"2026-04-12",
                                 "registrationOpenDate":"2026-03-01",
                                 "registrationDeadline":"2026-04-10",
                                 "competitionFormat":"SEAL_RAG_2026"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return UUID.fromString(data.get("id").asText());
    }

    private UUID createTeam(User leader, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/events/" + eventId + "/teams")
                        .header("Authorization", "Bearer " + tokenFor(leader))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return UUID.fromString(data.get("id").asText());
    }

    private UUID listTrackId(int index) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/events/" + eventId + "/tracks")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode tracks = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return UUID.fromString(tracks.get(index).get("id").asText());
    }

    private void openDrawSession() throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/tracks/draw-session/open")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    private void selfDraw(User leader, UUID teamId, UUID trackId) throws Exception {
        mockMvc.perform(post("/api/events/" + eventId + "/teams/" + teamId + "/track/draw")
                        .header("Authorization", "Bearer " + tokenFor(leader))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"trackId\":\"" + trackId + "\"}"))
                .andExpect(status().isOk());
    }
}
