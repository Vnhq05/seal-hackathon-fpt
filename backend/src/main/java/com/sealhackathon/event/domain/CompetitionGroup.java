package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "competition_groups", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"track_id", "name"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetitionGroup extends BaseEntity {

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @NotNull
    @Column(name = "track_id", nullable = false)
    private UUID trackId;

    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;

    /** Soft capacity label for the group (actual assignment may be size or size-1 when balanced). */
    @NotNull
    @Column(name = "max_teams", nullable = false)
    private Integer maxTeams;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}
