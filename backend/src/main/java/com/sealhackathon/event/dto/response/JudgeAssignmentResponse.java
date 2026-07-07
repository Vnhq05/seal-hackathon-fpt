package com.sealhackathon.event.dto.response;

import com.sealhackathon.event.domain.enums.AssignmentScope;
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
public class JudgeAssignmentResponse {

    private UUID id;
    private UUID roundId;
    private AssignmentScope scope;
    private UUID trackId;
    private String trackName;
    private UUID groupId;
    private String groupName;
    private UUID judgeUserId;
    private String judgeFullName;
    private String judgeEmail;
    private boolean active;
    private LocalDateTime assignedAt;
    private LocalDateTime deactivatedAt;
    private String deactivationReason;
    private Integer expectedTeamCount;
    private Integer expectedSubmissionCount;
    private boolean conflictRisk;
    private String warning;
    private List<IncompleteAssignmentScopeResponse> incompleteScopes;
}
