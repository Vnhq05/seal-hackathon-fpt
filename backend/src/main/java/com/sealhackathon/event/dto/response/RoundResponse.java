package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.RoundType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundResponse {

    private UUID id;
    private UUID eventId;
    private Integer roundNumber;
    private String name;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime submissionDeadline;
    private LocalDateTime scoringDeadline;
    private Integer advancementCutoff;
    private Integer roundWeight;
    private RoundType roundType;
    private List<CriteriaResponse> criteria;
    private int judgeCount;
}
