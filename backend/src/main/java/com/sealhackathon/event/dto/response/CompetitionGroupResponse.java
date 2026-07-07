package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.AssignmentScope;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionGroupResponse {

    private UUID id;
    private UUID trackId;
    private String name;
}
