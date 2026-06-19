package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.event.domain.enums.EventStatus;
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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Aggregate Root — Event Management Context.
 *
 * BR-08  Coordinator / Admin create and configure events.
 *        No edits after Active without audit justification.
 * BR-10  Event name unique system-wide.
 */
@Entity
@Table(name = "hackathon_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HackathonEvent extends BaseEntity {

    // ── BR-10: unique event name ──
    @NotBlank
    @Size(max = 255)
    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @NotBlank
    @Size(max = 50)
    @Column(name = "season", nullable = false)
    private String season;

    @NotNull
    @Column(name = "year", nullable = false)
    private Integer year;

    // ── BR-09: all rounds must fall within [startDate, endDate] ──
    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // ── BR-15: team registration closes at this deadline ──
    @NotNull
    @Column(name = "registration_deadline", nullable = false)
    private LocalDate registrationDeadline;

    // ── BR-08: Draft → Active → Completed | Cancelled ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.DRAFT;

    // ── Child entities: rounds belong to this event ──
    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Round> rounds = new ArrayList<>();

    // ── Child entities: mentor assignments belong to this event ──
    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MentorAssignment> mentorAssignments = new ArrayList<>();
}
