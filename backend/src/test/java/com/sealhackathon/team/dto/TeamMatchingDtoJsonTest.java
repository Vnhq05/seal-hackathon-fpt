package com.sealhackathon.team.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.UpdateMatchingProfileRequest;
import com.sealhackathon.team.dto.request.UpdateTeamRecruitmentRequest;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.dto.response.TeamResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TeamMatchingDtoJsonTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    void deserializeUpdateTeamRecruitmentRequest_withIsRecruitingKey() throws Exception {
        UpdateTeamRecruitmentRequest request = objectMapper.readValue(
                "{\"isRecruiting\":true,\"recruitmentNote\":\"Need backend\"}",
                UpdateTeamRecruitmentRequest.class);

        assertThat(request.isRecruiting()).isTrue();
        assertThat(request.getRecruitmentNote()).isEqualTo("Need backend");
    }

    @Test
    void deserializeUpdateTeamRecruitmentRequest_withRecruitingAlias() throws Exception {
        UpdateTeamRecruitmentRequest request = objectMapper.readValue(
                "{\"recruiting\":true}",
                UpdateTeamRecruitmentRequest.class);

        assertThat(request.isRecruiting()).isTrue();
    }

    @Test
    void serializeTeamResponse_usesIsRecruitingKey() throws Exception {
        TeamResponse response = TeamResponse.builder()
                .id(UUID.randomUUID())
                .eventId(UUID.randomUUID())
                .name("Team Alpha")
                .leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING)
                .memberCount(2)
                .minTeamMembers(3)
                .maxTeamMembers(5)
                .canSelectTrack(false)
                .members(List.of())
                .createdAt(LocalDateTime.parse("2026-06-01T09:00:00"))
                .isRecruiting(true)
                .recruitmentNote("Join us")
                .neededRoles(List.of(HackathonSkillRole.BACKEND))
                .build();

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"isRecruiting\":true");
        assertThat(json).doesNotContain("\"recruiting\":");
    }

    @Test
    void deserializeUpdateMatchingProfileRequest_withIsLookingForTeamKey() throws Exception {
        UpdateMatchingProfileRequest request = objectMapper.readValue(
                "{\"isLookingForTeam\":true,\"preferredRole\":\"FRONTEND\"}",
                UpdateMatchingProfileRequest.class);

        assertThat(request.isLookingForTeam()).isTrue();
        assertThat(request.getPreferredRole()).isEqualTo(HackathonSkillRole.FRONTEND);
    }

    @Test
    void deserializeUpdateMatchingProfileRequest_withLookingForTeamAlias() throws Exception {
        UpdateMatchingProfileRequest request = objectMapper.readValue(
                "{\"lookingForTeam\":true}",
                UpdateMatchingProfileRequest.class);

        assertThat(request.isLookingForTeam()).isTrue();
    }

    @Test
    void serializeEnrollmentResponse_usesIsLookingForTeamKey() throws Exception {
        EnrollmentResponse response = EnrollmentResponse.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .eventId(UUID.randomUUID())
                .status(EnrollmentStatus.APPROVED)
                .enrolledAt(LocalDateTime.parse("2026-06-01T08:00:00"))
                .isLookingForTeam(true)
                .preferredRole(HackathonSkillRole.FRONTEND)
                .build();

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"isLookingForTeam\":true");
        assertThat(json).doesNotContain("\"lookingForTeam\":");
    }
}
