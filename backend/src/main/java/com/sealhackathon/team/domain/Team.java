package com.sealhackathon.team.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.domain.enums.TrackAssignmentMethod;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root — Team Management Context.
 *
 * BR-15  Team size 3–5 members.
 * BR-18  One participant → one team per event.
 * BR-19  Team name unique per event.
 * BR-20  Exactly one leader per team.
 * BR-22  Status transitions: FORMING → CONFIRMED (at 3–5 members).
 *
 * References HackathonEvent by ID — cross-module, no JPA relationship.
 * References User (leader) by ID — cross-module, no JPA relationship.
 */
@Entity
@Table(name = "teams", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "name"})
}, indexes = {
        @Index(name = "idx_team_event_id", columnList = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team extends BaseEntity {

    // ── Cross-module reference to HackathonEvent ──
    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    // ── BR-19: unique per event ──
    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false)
    private String name;

    // ── BR-20: exactly one leader, cross-module ref to User ──
    @NotNull
    @Column(name = "leader_id", nullable = false)
    private UUID leaderId;

    // ── BR-22: FORMING → CONFIRMED when 3-5 members ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private TeamStatus status = TeamStatus.FORMING;

    @Column(name = "track_id")
    private UUID trackId;

    @Column(name = "track_assigned_at")
    private java.time.LocalDateTime trackAssignedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "track_assignment_method")
    private TrackAssignmentMethod trackAssignmentMethod;

    @Column(name = "track_assigned_by")
    private UUID trackAssignedBy;

    // ── Child entities ──
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TeamMember> members = new ArrayList<>();
}
