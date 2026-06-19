package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
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

import java.util.UUID;

/**
 * BR-49  Top N teams (N = advancementCutoff) marked ADVANCED;
 *        remaining teams marked ELIMINATED.
 *
 * One record per (team, round).
 * References Team and Round by ID — cross-module.
 */
@Entity
@Table(name = "advancements", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "round_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Advancement extends BaseEntity {

    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @NotNull
    @Column(name = "round_id", nullable = false)
    private UUID roundId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AdvancementStatus status;
}
