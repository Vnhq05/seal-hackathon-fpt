package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OpenTrackDrawSessionRequest {

    private LocalDateTime scheduledAt;

    /** Optional explicit draw order; defaults to all unassigned teams by creation time. */
    private List<UUID> drawOrder;
}
