package com.sealhackathon.team.dto.response;

import com.sealhackathon.team.domain.enums.TrackAssignmentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackAssignmentResponse {

    private UUID teamId;
    private UUID trackId;
    private String trackName;
    private TrackAssignmentMethod method;
}
