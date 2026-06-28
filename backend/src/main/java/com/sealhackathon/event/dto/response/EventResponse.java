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
    private String description;
    private String location;
    private String format;
    private CompetitionFormat competitionFormat;
    private Integer minTeam;
    private Integer maxTeam;
    private Integer semesterMin;
    private Integer semesterMax;
    private UUID scoringTemplateId;
    private String tiebreakerCriteria;
    private int roundCount;
    private int mentorCount;
    private int trackCount;
    private List<TrackResponse> tracks;
    private List<PrizeResponse> prizes;
    private List<HonoredGuestResponse> honoredGuests;
    private LocalDateTime createdAt;
}
