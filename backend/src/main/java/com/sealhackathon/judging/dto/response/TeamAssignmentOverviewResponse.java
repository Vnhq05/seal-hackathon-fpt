package com.sealhackathon.judging.dto.response;

import com.sealhackathon.event.dto.response.EventJudgeResponse;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
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
public class TeamAssignmentOverviewResponse {

    private UUID teamId;
    private String teamName;
    private UUID trackId;
    private String trackName;
    private int memberCount;
    private UUID mentorUserId;
    private String mentorFullName;
    private SubmissionStatus submissionStatus;
    private List<TeamJudgeAssignmentResponse> judges;
    private int judgeCount;
}
