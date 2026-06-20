package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private EventStatus status;
    private int roundCount;
    private int mentorCount;
    private LocalDateTime createdAt;
}
