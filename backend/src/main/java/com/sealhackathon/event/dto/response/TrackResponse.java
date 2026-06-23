package com.sealhackathon.event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackResponse {

    private UUID id;
    private UUID eventId;
    private String name;
    private String description;
    private Integer maxTeams;
    private UUID scoringTemplateId;
}
