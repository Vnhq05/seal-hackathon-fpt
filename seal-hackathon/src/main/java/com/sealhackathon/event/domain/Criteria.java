package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Child entity of Round (within HackathonEvent aggregate).
 *
 * BR-11  All criteria weights for a round must sum to exactly 100%.
 *        Validated at the service layer before persisting.
 * BR-44  Default criteria: Technical (40%), Innovation (30%),
 *        Presentation Quality (20%), Feasibility (10%).
 */
@Entity
@Table(name = "criteria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Criteria extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id", nullable = false)
    private Round round;

    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 1000)
    @Column(name = "description")
    private String description;

    // ── BR-11: integer percentage, all criteria per round must sum to 100 ──
    @NotNull
    @Min(1)
    @Max(100)
    @Column(name = "weight", nullable = false)
    private Integer weight;

    @NotNull
    @Min(0)
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
