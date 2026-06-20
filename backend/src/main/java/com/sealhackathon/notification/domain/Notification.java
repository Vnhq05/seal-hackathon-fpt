package com.sealhackathon.notification.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.notification.domain.enums.NotificationType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
 * Aggregate Root — Notification Context.
 * Created by NotificationEventListener in response to domain events.
 *
 * Supports: account approval, team registration, submission created,
 * judge assigned, results published, etc.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @NotBlank
    @Size(max = 255)
    @Column(name = "title", nullable = false)
    private String title;

    @NotBlank
    @Size(max = 2000)
    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Size(max = 100)
    @Column(name = "reference_type")
    private String referenceType;

    // ── Child: one recipient row per user × channel ──
    @OneToMany(mappedBy = "notification", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<NotificationRecipient> recipients = new ArrayList<>();
}
