package com.sealhackathon.event.dto.snapshot;

import com.sealhackathon.event.domain.enums.EventStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventSnapshot {

    private UUID id;
    private String name;
    private String season;
    private Integer year;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationDeadline;
    private LocalDate registrationOpenDate;
    private EventStatus status;
    private Integer semesterMin;
    private Integer semesterMax;

    public boolean isActive() {
        return status == EventStatus.ACTIVE;
    }

    public boolean isOpenForEnrollment() {
        return status == EventStatus.OPEN || status == EventStatus.ACTIVE;
    }
}
