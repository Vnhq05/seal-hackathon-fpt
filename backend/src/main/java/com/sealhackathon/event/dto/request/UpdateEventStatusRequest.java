package com.sealhackathon.event.dto.request;

import com.sealhackathon.event.domain.enums.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEventStatusRequest {

    @NotNull(message = "Status is required")
    private EventStatus status;
}
