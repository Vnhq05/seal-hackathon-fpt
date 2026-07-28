package com.sealhackathon.ranking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdvancementSelectionPreviewResponse {

    public enum Scope {
        GROUP,
        TRACK,
        GLOBAL
    }

    private UUID roundId;
    private String roundName;
    private UUID nextRoundId;
    private String nextRoundName;
    private String nextRoundType;
    private boolean nextIsFinal;
    private Scope scope;
    private Integer topN;
    private String mode;
    private List<SelectedTeam> selected;
    private List<ContestedBucket> contested;
    private int eliminatedCount;
    private boolean confirmed;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SelectedTeam {
        private UUID teamId;
        private String teamName;
        private UUID trackId;
        private String trackName;
        private UUID groupId;
        private String groupName;
        private Integer rank;
        private BigDecimal finalScore;
        private String reason;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContestedBucket {
        private UUID trackId;
        private String trackName;
        private UUID groupId;
        private String groupName;
        private List<SelectedTeam> teams;
    }
}
