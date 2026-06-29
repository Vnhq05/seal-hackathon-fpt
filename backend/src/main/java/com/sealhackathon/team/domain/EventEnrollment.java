package com.sealhackathon.team.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
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

@Entity
@Table(name = "event_enrollments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "event_id"})
}, indexes = {
        @Index(name = "idx_enrollment_event_id", columnList = "event_id"),
        @Index(name = "idx_enrollment_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventEnrollment extends BaseEntity {

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.PENDING;

    @NotNull
    @Column(name = "enrolled_at", nullable = false)
    @Builder.Default
    private LocalDateTime enrolledAt = LocalDateTime.now();

    @Column(name = "is_looking_for_team", nullable = false)
    @Builder.Default
    private boolean isLookingForTeam = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_role", length = 30)
    private HackathonSkillRole preferredRole;
}
