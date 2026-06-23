package com.sealhackathon.event.dto.response;

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
public class ScoringTemplateResponse {

    private UUID id;
    private String name;
    private String description;
    private List<CriterionResponse> criteria;
    private LocalDateTime createdAt;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CriterionResponse {
        private UUID id;
        private String name;
        private String description;
        private Integer weight;
        private Integer sortOrder;
    }
}
