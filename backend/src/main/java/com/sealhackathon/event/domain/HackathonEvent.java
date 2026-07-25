package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
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
import java.util.UUID;

/**
 * Aggregate Root — Event Management Context.
 *
 * BR-08  Coordinator / Admin create and configure events.
 *        Edits allowed while event is ongoing; blocked when completed or cancelled.
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

    // ── Business owner. Distinct from BaseEntity.createdBy, which is audit only:
    //    AuditorAware owns that column and overwrites it on insert.
    //    See docs/adr-event-owner-vs-created-by.md. Null = no attributable owner (admin-only). ──
    @Column(name = "owner_user_id")
    private UUID ownerUserId;

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

    @Size(max = 2000)
    @Column(name = "description", length = 2000)
    private String description;

    @Size(max = 500)
    @Column(name = "location")
    private String location;

    @Size(max = 50)
    @Column(name = "format")
    @Builder.Default
    private String format = "OFFLINE";

    @Column(name = "registration_open_date")
    private LocalDate registrationOpenDate;

    /** Public API path to optional event avatar image (e.g. /api/public/files/events/{id}/avatar.webp). */
    @Size(max = 500)
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Min(0)
    @Column(name = "min_team")
    private Integer minTeam;

    @Min(0)
    @Column(name = "max_team")
    private Integer maxTeam;

    @Column(name = "semester_min")
    private Integer semesterMin;

    @Column(name = "semester_max")
    private Integer semesterMax;

    @Column(name = "scoring_template_id")
    private UUID scoringTemplateId;

    /**
     * Per-criterion score ceiling for this event (min is always 1).
     * Allowed values: 5, 10, 100. Default 100.
     */
    @Min(5)
    @Column(name = "score_scale_max", nullable = false)
    @Builder.Default
    private Integer scoreScaleMax = 100;

    @Size(max = 1000)
    @Column(name = "tiebreaker_criteria", length = 1000)
    private String tiebreakerCriteria;

    /** Ordered scoring-template criterion IDs for machine-readable tie-break (BR-47). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "event_tiebreaker_criteria",
            joinColumns = @JoinColumn(name = "event_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "template_criterion_id", nullable = false)
    @Builder.Default
    private List<UUID> tiebreakerCriterionIds = new ArrayList<>();

    @Column(name = "leaderboard_public", nullable = false, columnDefinition = "BIT NOT NULL DEFAULT 0")
    @Builder.Default
    private boolean leaderboardPublic = false;

    // ── BR-08: Draft → Active → Completed | Cancelled ──
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.UPCOMING;

    /** SEAL-specific competition format; GENERIC preserves legacy multi-hackathon behaviour. */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "competition_format", nullable = false)
    @Builder.Default
    private CompetitionFormat competitionFormat = CompetitionFormat.GENERIC;

    // ── Child entities ──
    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Round> rounds = new ArrayList<>();

    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MentorAssignment> mentorAssignments = new ArrayList<>();

    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<EventJudgeAssignment> eventJudgeAssignments = new ArrayList<>();

    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Track> tracks = new ArrayList<>();

    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Prize> prizes = new ArrayList<>();

    @OneToMany(mappedBy = "hackathonEvent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<HonoredGuest> honoredGuests = new ArrayList<>();
}
