package com.sealhackathon.judging.dto.response;

import com.sealhackathon.event.dto.response.EventJudgeResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAssignmentsOverviewResponse {

    private UUID eventId;
    private UUID roundId;
    private List<EventJudgeResponse> eligibleJudges;
    private List<TeamAssignmentOverviewResponse> teams;
}
