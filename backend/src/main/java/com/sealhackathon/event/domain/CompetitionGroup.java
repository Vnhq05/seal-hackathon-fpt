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
    @Column(name = "track_id", nullable = false)
    private UUID trackId;

    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;
}
