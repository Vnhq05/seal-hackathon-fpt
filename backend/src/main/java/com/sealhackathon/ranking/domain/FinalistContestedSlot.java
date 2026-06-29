package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.ranking.domain.enums.ContestedSlotType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "finalist_contested_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalistContestedSlot extends BaseEntity {

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "track_id")
    private UUID trackId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", nullable = false)
    private ContestedSlotType slotType;

    @NotNull
    @Column(name = "slot_index", nullable = false)
    private Integer slotIndex;

    @NotNull
    @Column(name = "needs_penalty_evaluation", nullable = false)
    @Builder.Default
    private boolean needsPenaltyEvaluation = true;

    @NotNull
    @Column(name = "resolved", nullable = false)
    @Builder.Default
    private boolean resolved = false;

    @OneToMany(mappedBy = "contestedSlot", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<FinalistContestedSlotTeam> teams = new ArrayList<>();
}
