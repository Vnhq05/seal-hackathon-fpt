package com.sealhackathon.ranking.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable once created. Marks the moment results become visible.
 *
 * BR-51  Rankings only visible after Coordinator/Admin publishes.
 * BR-52  Email sent to all team leaders after publish.
 * BR-56  disputeDeadline = publishedAt + 24 hours.
 *        After deadline, results are final.
 *
 * References Round by ID — cross-module.
 * References User (publisher) by ID — cross-module.
 */
@Entity
@Table(name = "published_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublishedResult extends BaseEntity {

    // ── Cross-module reference to Round ──
    @NotNull
    @Column(name = "round_id", nullable = false, unique = true)
    private UUID roundId;

    // ── Cross-module reference to User (Coordinator/Admin who published) ──
    @NotNull
    @Column(name = "published_by", nullable = false)
    private UUID publishedBy;

    @NotNull
    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    // ── BR-56: publishedAt + 24h ──
    @NotNull
    @Column(name = "dispute_deadline", nullable = false)
    private LocalDateTime disputeDeadline;
}
