package com.sealhackathon.judging.dto.response;

import com.sealhackathon.judging.domain.enums.ScoreStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeScoreResponse {

    private UUID id;
    private UUID judgeUserId;
    private String judgeFullName;
    private UUID submissionId;
    private UUID roundId;
    private ScoreStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<ScoreDetailResponse> details;
    private List<CommentResponse> comments;
}
