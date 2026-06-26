package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.PrizeRank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrizeResponse {

    private UUID id;
    private UUID trackId;
    private PrizeRank rank;
    private String value;
    private Integer quantity;
    private String label;
}
