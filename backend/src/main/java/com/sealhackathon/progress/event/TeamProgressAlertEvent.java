package com.sealhackathon.progress.event;

import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;

import java.util.List;
import java.util.UUID;

public record TeamProgressAlertEvent(
        UUID eventId,
        UUID teamId,
        UUID roundId,
        List<ProgressRiskReason> reasons,
        ProgressRiskLevel riskLevel) {}
