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
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationDeadline;
    private EventStatus status;
}
