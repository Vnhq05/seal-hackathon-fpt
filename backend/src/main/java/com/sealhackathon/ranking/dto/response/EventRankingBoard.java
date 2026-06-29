package com.sealhackathon.ranking.dto.response;

import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.response.TrackResponse;
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
public class EventRankingBoard {

    private UUID eventId;
    private String eventName;
    private String season;
    private Integer year;
    private UUID roundId;
    private String roundName;
    private RoundType roundType;
    private List<TrackResponse> tracks;
    private List<RankingResponse> rankings;
}
