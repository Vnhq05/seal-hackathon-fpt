package com.sealhackathon.event.dto.request;

import jakarta.validation.Valid;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PublishEventRequest extends CreateEventRequest {

    @Valid
    private List<CreateRoundRequest> rounds;
}
