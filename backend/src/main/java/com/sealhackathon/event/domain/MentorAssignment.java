package com.sealhackathon.event.domain;

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
 * BR-14  Mentors are assigned per track (support teams in their track).
 *        Notification sent on assignment.
 *
 * References User (mentor) by ID — cross-module, no JPA relationship.
 */
@Entity
@Table(name = "mentor_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id", "track_id", "mentor_user_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorAssignment extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private HackathonEvent hackathonEvent;

    @NotNull
    @Column(name = "mentor_user_id", nullable = false)
    private UUID mentorUserId;

    @NotNull
    @Column(name = "track_id", nullable = false)
    private UUID trackId;

    @NotNull
    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
}
