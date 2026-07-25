package com.sealhackathon.event.dto.response;

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
public class GenerateCompetitionGroupsResponse {

    private int teamsPerGroup;
    private int totalGroupsCreated;
    private int totalTeamsAssigned;
    private List<TrackGroupPlan> tracks;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackGroupPlan {
        private UUID trackId;
        private String trackName;
        private int teamCount;
        private int groupCount;
        private List<GroupSize> groups;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupSize {
        private UUID groupId;
        private String name;
        private int teamCount;
        private List<String> teamNames;
    }
}
