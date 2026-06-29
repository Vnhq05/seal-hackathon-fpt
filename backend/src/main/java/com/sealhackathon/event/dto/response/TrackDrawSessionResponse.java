package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.DrawSessionStatus;
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
public class TrackDrawSessionResponse {

    private UUID sessionId;
    private UUID eventId;
    private DrawSessionStatus status;
    private UUID currentTeamId;
    private String currentTeamName;
    private int currentIndex;
    private int totalTeams;
    private LocalDateTime scheduledAt;
    private LocalDateTime openedAt;
    private List<AvailableTrackSlotResponse> availableTracks;
}
