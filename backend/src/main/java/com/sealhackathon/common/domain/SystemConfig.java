package com.sealhackathon.common.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "system_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemConfig extends BaseEntity {

    @NotNull
    @Min(1)
    @Column(name = "min_team_members", nullable = false)
    @Builder.Default
    private Integer minTeamMembers = 3;

    @NotNull
    @Min(1)
    @Column(name = "max_team_members", nullable = false)
    @Builder.Default
    private Integer maxTeamMembers = 5;

    @Column(name = "default_rules", length = 4000)
    private String defaultRules;
}
