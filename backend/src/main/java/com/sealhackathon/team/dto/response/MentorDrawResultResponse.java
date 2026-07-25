package com.sealhackathon.team.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorDrawResultResponse {

    private List<MentorTeamAssignmentResponse> assignments;
    private int assignedCount;
    private int unassignedCount;
    private String message;
}
