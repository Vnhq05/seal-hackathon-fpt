package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "finalist_contested_slot_teams", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"contested_slot_id", "team_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalistContestedSlotTeam extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contested_slot_id", nullable = false)
    private FinalistContestedSlot contestedSlot;

    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "final_score", precision = 7, scale = 4)
    private BigDecimal finalScore;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}
