package com.sealhackathon.progress.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.progress.domain.enums.ProgressRiskLevel;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Dedup/cooldown record for team progress alerts — not a full alert history.
 */
@Entity
@Table(name = "team_progress_alerts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "round_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamProgressAlert extends BaseEntity {

    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private ProgressRiskLevel riskLevel;

    @Column(name = "reasons", length = 500)
    private String reasons;

    @Column(name = "last_alerted_at")
    private LocalDateTime lastAlertedAt;

    public List<ProgressRiskReason> getReasonList() {
        if (reasons == null || reasons.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(reasons.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(ProgressRiskReason::valueOf)
                .collect(Collectors.toList());
    }

    public void setReasonList(List<ProgressRiskReason> reasonList) {
        if (reasonList == null || reasonList.isEmpty()) {
            this.reasons = null;
        } else {
            this.reasons = reasonList.stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
        }
    }
}
