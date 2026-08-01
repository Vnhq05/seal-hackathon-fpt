package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {

    private UUID id;
    private String name;
    private String season;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationDeadline;
    private LocalDate registrationOpenDate;
    private EventStatus status;
    /** True when admin/coordinator set sticky COMPLETED (not date-derived). */
    private boolean staffCompleted;
    /** True when admin/coordinator made the live leaderboard / results public. */
    private boolean leaderboardPublic;
    /** True while OPEN or APPROVED score-deviation reviews remain on the event. */
    private boolean hasActiveScoreReviews;
    /**
     * Students (leader/member) may see Results & Awards only when staff closed the event,
     * made results public, and score reviews have reached consensus.
     */
    private boolean studentResultsVisible;
    private String description;
    private String location;
    private String format;
    /** Public path to optional event avatar; null when not set. */
    private String avatarUrl;
    private CompetitionFormat competitionFormat;
    private Integer minTeam;
    private Integer maxTeam;
    private Integer semesterMin;
    private Integer semesterMax;
    private UUID scoringTemplateId;
    /** Per-criterion score ceiling (1–N). Allowed: 5, 10, 100. */
    private Integer scoreScaleMax;
    private String tiebreakerCriteria;
    private List<UUID> tiebreakerCriterionIds;
    private int roundCount;
    private int mentorCount;
    private int judgeCount;
    /** Number of teams currently registered for this event. */
    private int teamCount;
    private int trackCount;
    private List<TrackResponse> tracks;
    private List<PrizeResponse> prizes;
    private List<HonoredGuestResponse> honoredGuests;
    /** Event-level judges (public: name only). */
    private List<EventStaffPublicResponse> judges;
    /** Event-level mentors (public: name only). */
    private List<EventStaffPublicResponse> mentors;
    private LocalDateTime createdAt;
}
