package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.AssignmentScope;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncompleteAssignmentScopeResponse {

    private AssignmentScope scope;
    private UUID trackId;
    private String trackName;
    private UUID groupId;
    private String groupName;
    private int judgeCount;
    private int minJudgesRequired;
}
