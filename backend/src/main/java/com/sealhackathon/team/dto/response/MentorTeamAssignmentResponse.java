package com.sealhackathon.team.dto.response;

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
public class MentorTeamAssignmentResponse {

    private UUID id;
    private UUID teamId;
    private String teamName;
    private UUID trackId;
    private String trackName;
    private UUID mentorUserId;
    private String mentorFullName;
    private String mentorEmail;
    private LocalDateTime assignedAt;
}
