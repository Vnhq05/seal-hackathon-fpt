package com.sealhackathon.event.dto.snapshot;

import com.sealhackathon.event.domain.enums.AdvancementRule;
import com.sealhackathon.event.domain.enums.RoundType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoundSnapshot {

    private UUID id;
    private UUID eventId;
    private Integer roundNumber;
    private String name;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime submissionDeadline;
    private LocalDateTime slideDeadline;
    private LocalDateTime scoringDeadline;
    private Integer advancementCutoff;
    private Integer roundWeight;
    private RoundType roundType;
    private AdvancementRule advancementRule;
}
