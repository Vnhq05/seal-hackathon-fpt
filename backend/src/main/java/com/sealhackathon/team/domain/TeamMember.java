package com.sealhackathon.team.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
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
 * Child entity of Team aggregate.
 *
 * BR-15  Team size 3–5: enforced by Team aggregate invariant.
 * BR-18  Unique constraint on (event_id, user_id) — one team per event (DB).
 * BR-20  Exactly one LEADER per team (filtered unique index in SQL Server).
 *
 * References User by ID — cross-module, no JPA relationship.
 * event_id is denormalized from Team for race-safe uniqueness.
 */
@Entity
@Table(name = "team_members", uniqueConstraints = {
        @UniqueConstraint(name = "uq_team_member_team_user", columnNames = {"team_id", "user_id"}),
        @UniqueConstraint(name = "uq_team_member_event_user", columnNames = {"event_id", "user_id"})
}, indexes = {
        @Index(name = "idx_team_member_user_id", columnList = "user_id"),
        @Index(name = "idx_team_member_team_id", columnList = "team_id"),
        @Index(name = "idx_team_member_event_id", columnList = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    /** Denormalized from {@link Team#getEventId()} for BR-18 uniqueness. */
    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    // ── Cross-module reference to User ──
    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // ── BR-20: exactly one LEADER per team ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private TeamMemberRole role;

    @NotNull
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;
}
