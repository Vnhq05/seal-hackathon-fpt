package com.sealhackathon.ranking.dto.response;

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
public class PublishedResultResponse {

    private UUID id;
    private UUID roundId;
    private UUID publishedBy;
    private LocalDateTime publishedAt;
    private LocalDateTime disputeDeadline;
    private List<RankingResponse> rankings;
    private List<AdvancementResponse> advancements;
}
