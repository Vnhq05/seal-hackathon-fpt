package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.event.domain.enums.DrawSessionStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "track_draw_sessions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"event_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackDrawSession extends BaseEntity {

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private DrawSessionStatus status = DrawSessionStatus.OPEN;

    @NotNull
    @Column(name = "current_index", nullable = false)
    @Builder.Default
    private Integer currentIndex = 0;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "opened_by")
    private UUID openedBy;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("queueOrder ASC")
    @Builder.Default
    private List<TrackDrawQueueItem> queue = new ArrayList<>();
}
