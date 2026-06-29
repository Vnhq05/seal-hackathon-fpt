package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.DrawSessionStatus;
import com.sealhackathon.event.domain.enums.TrackStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableTrackSlotResponse {

    private UUID trackId;
    private String name;
    private TrackStatus status;
    private int remainingSlots;
}
