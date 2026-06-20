package com.sealhackathon.judging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDetailResponse {

    private UUID id;
    private UUID criteriaId;
    private String criteriaName;
    private Integer score;
}
