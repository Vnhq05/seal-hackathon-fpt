package com.sealhackathon.event.dto.snapshot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriteriaSnapshot {

    private UUID id;
    private String name;
    private Integer weight;
    private Integer sortOrder;
    private Integer minScore;
    private Integer maxScore;
}
