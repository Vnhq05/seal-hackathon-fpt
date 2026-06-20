package com.sealhackathon.judging.dto.snapshot;

import com.sealhackathon.judging.domain.enums.ScoreStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JudgeScoreSnapshot {

    private UUID id;
    private UUID judgeUserId;
    private UUID submissionId;
    private UUID roundId;
    private ScoreStatus status;
    private List<ScoreDetailSnapshot> details;
}
