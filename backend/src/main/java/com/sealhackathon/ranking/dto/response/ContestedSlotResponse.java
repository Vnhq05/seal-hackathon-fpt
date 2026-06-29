package com.sealhackathon.ranking.dto.response;

import com.sealhackathon.ranking.domain.enums.ContestedSlotType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestedSlotResponse {

    private UUID id;
    private UUID trackId;
    private String trackName;
    private ContestedSlotType slotType;
    private Integer slotIndex;
    private boolean needsPenaltyEvaluation;
    private List<ContestedTeamResponse> teams;
}
