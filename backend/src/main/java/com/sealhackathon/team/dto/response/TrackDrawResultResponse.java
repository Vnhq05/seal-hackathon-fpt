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
public class TrackDrawResultResponse {

    private List<TrackAssignmentResponse> assignments;
    private int unassignedCount;
}
