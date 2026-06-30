package com.sealhackathon.ranking.dto.response;

import com.sealhackathon.event.domain.enums.RoundType;
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
public class LiveScoreBoard {

    private UUID eventId;
    private String eventName;
    private String season;
    private Integer year;
    private UUID roundId;
    private String roundName;
    private RoundType roundType;
    private List<TrackInfo> tracks;
    private List<LiveScoreEntry> rankings;
    private boolean scoresLocked;
    private boolean resultsPublished;
    private boolean leaderboardPublic;
    private boolean canManageLeaderboard;
    private Integer maxScore;
}
