package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.ScheduleGate;
import com.sealhackathon.event.domain.enums.ScheduleType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventScheduleResponse {

    private UUID id;
    private UUID eventId;
    private ScheduleType type;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private ScheduleGate gate;
    private Integer sortOrder;
}
