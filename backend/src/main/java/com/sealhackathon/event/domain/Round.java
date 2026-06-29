package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.domain.enums.RoundType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Child entity of HackathonEvent aggregate.
 *
 * BR-09  Round dates must be within [event.startDate, event.endDate].
 *        No two rounds in the same event may overlap.
 * BR-11  Criteria weights for this round must sum to 100%.
 * BR-12  advancementCutoff = top N teams advance to next round.
 */
@Entity
@Table(name = "rounds", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "round_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Round extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private HackathonEvent hackathonEvent;

    @NotNull
    @Min(1)
    @Column(name = "round_number", nullable = false)
    private Integer roundNumber;

    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;

    // ── BR-09: must be within parent event date range ──
    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    // ── BR-32: no submissions accepted after this deadline ──
    @NotNull
    @Column(name = "submission_deadline", nullable = false)
    private LocalDateTime submissionDeadline;

    /** SEAL format: slide must be submitted before this time (e.g. 10:00 Day 2). */
    @Column(name = "slide_deadline")
    private LocalDateTime slideDeadline;

    // ── BR-40: scores locked after this deadline ──
    @NotNull
    @Column(name = "scoring_deadline", nullable = false)
    private LocalDateTime scoringDeadline;

    // ── BR-12: top N teams advance ──
    @NotNull
    @Min(1)
    @Column(name = "advancement_cutoff", nullable = false)
    private Integer advancementCutoff;

    @NotNull
    @Min(1)
    @Column(name = "round_weight", nullable = false, columnDefinition = "INT NOT NULL DEFAULT 100")
    @Builder.Default
    private Integer roundWeight = 100;

    @Enumerated(EnumType.STRING)
    @Column(name = "round_type")
    private RoundType roundType;

    @Enumerated(EnumType.STRING)
    @Column(name = "advancement_rule")
    private AdvancementRule advancementRule;

    // ── Child: criteria for this round ──
    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Criteria> criteria = new ArrayList<>();

    // ── Child: judge assignments for this round ──
    @OneToMany(mappedBy = "round", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<JudgeAssignment> judgeAssignments = new ArrayList<>();
}
