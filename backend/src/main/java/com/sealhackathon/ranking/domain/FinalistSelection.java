package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "finalist_selections", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "team_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalistSelection extends BaseEntity {

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @NotNull
    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "track_id")
    private UUID trackId;

    @NotNull
    @Min(1)
    @Column(name = "preliminary_rank", nullable = false)
    private Integer preliminaryRank;

    @Size(max = 500)
    @Column(name = "selected_reason", length = 500)
    private String selectedReason;

    @NotNull
    @Column(name = "selected_at", nullable = false)
    private LocalDateTime selectedAt;
}
