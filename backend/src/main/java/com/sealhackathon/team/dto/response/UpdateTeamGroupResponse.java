package com.sealhackathon.team.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

import com.sealhackathon.event.dto.response.IncompleteAssignmentScopeResponse;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamGroupResponse {

    private UUID teamId;
    private UUID groupId;
    private String groupName;
    private String warning;
    private List<IncompleteAssignmentScopeResponse> incompleteScopes;
}
