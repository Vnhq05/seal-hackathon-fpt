package com.sealhackathon.team.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentResponse {

    private UUID id;
    private UUID userId;
    private UUID eventId;
    private EnrollmentStatus status;
    private LocalDateTime enrolledAt;
    private String userFullName;
    private String userEmail;
    private String userStudentId;
    private String userUniversityName;
    @Getter(onMethod_ = {@JsonProperty("isLookingForTeam")})
    private boolean isLookingForTeam;
    private HackathonSkillRole preferredRole;
}
