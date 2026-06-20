package com.sealhackathon.judging.dto.snapshot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreDetailSnapshot {

    private UUID criteriaId;
    private Integer score;
}
