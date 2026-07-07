package com.sealhackathon.progress.dto.response;

import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
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
public class TeamProgressResponse {

    private UUID teamId;
    private String teamName;
    private UUID roundId;
    private ProgressRiskLevel riskLevel;
    private List<ProgressRiskReason> reasons;
    private LocalDateTime lastSubmittedAt;
    private int totalVersions;
    private long hoursUntilDeadline;
}
