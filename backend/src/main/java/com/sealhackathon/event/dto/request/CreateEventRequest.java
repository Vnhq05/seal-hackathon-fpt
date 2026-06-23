package com.sealhackathon.event.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEventRequest {

    @NotBlank(message = "Event name is required")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "Season is required")
    @Size(max = 50)
    private String season;

    @NotNull(message = "Year is required")
    private Integer year;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Registration deadline is required")
    private LocalDate registrationDeadline;

    @Size(max = 2000)
    private String description;

    @Size(max = 500)
    private String location;

    @Size(max = 50)
    private String format;

    private LocalDate registrationOpenDate;

    @Min(0)
    private Integer minTeam;

    @Min(0)
    private Integer maxTeam;

    private Integer semesterMin;

    private Integer semesterMax;

    private UUID scoringTemplateId;

    @Size(max = 1000)
    private String tiebreakerCriteria;

    @Valid
    private List<CreateTrackRequest> tracks;

    @Valid
    private List<PrizeRequest> prizes;

    @Valid
    private List<HonoredGuestRequest> honoredGuests;

    private List<UUID> mentorUserIds;

    private List<UUID> judgeUserIds;
}
