package com.sealhackathon.audit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Aggregate Root — Audit Context. IMMUTABLE.
 *
 * Does NOT extend BaseEntity: audit logs have no updatedAt/updatedBy
 * because they are never updated. The repository exposes save() only —
 * no update or delete methods.
 *
 * BR-53  Logs: score CRUD, submission status, ranking, user role,
 *        account approval. Fields: actorId, action, targetId,
 *        oldValue, newValue, timestamp, ipAddress.
 * BR-54  Append-only. No UPDATE/DELETE via API, UI, or repository.
 * BR-55  Only System Admin can export (CSV/JSON). Export itself logged.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_actor_id", columnList = "actor_id"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "target_id")
    private UUID targetId;

    @Size(max = 100)
    @Column(name = "target_type")
    private String targetType;

    // ── JSON string of previous state ──
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    // ── JSON string of new state ──
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @NotNull
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Size(max = 45)
    @Column(name = "ip_address")
    private String ipAddress;
}
