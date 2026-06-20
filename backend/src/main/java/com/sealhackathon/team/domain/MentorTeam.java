package com.sealhackathon.team.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Links a Mentor to a Team within an event.
 *
 * BR-23  Mentor-team assignment.
 * BR-34  Conflict of interest: judge who is also a mentor of a team
 *        cannot score that team. Judging module queries this via
 *        TeamPublicService.isMentorOfTeam().
 *
 * References User (mentor) by ID — cross-module, no JPA relationship.
 */
@Entity
@Table(name = "mentor_teams", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"mentor_user_id", "team_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorTeam extends BaseEntity {

    // ── Cross-module reference to User (mentor) ──
    @NotNull
    @Column(name = "mentor_user_id", nullable = false)
    private UUID mentorUserId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @NotNull
    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
}
