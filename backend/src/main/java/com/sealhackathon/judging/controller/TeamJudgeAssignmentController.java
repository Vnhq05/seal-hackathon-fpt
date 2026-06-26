package com.sealhackathon.judging.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.dto.request.AssignJudgeToTeamRequest;
import com.sealhackathon.judging.dto.response.TeamJudgeAssignmentResponse;
import com.sealhackathon.judging.service.TeamJudgeAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/rounds/{roundId}/teams/{teamId}/judges")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
@Tag(name = "Team Judge Assignment", description = "Assign judges to teams (max 3 per team per round)")
@SecurityRequirement(name = "bearerAuth")
public class TeamJudgeAssignmentController {

    private final TeamJudgeAssignmentService assignmentService;

    @PostMapping
    @Operation(summary = "Assign a judge to a team for a round")
    public ResponseEntity<ApiResponse<TeamJudgeAssignmentResponse>> assignJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID teamId,
            @Valid @RequestBody AssignJudgeToTeamRequest request) {
        TeamJudgeAssignmentResponse response = assignmentService.assignJudgeToTeam(
                eventId, roundId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Judge assigned to team", response));
    }

    @GetMapping
    @Operation(summary = "List judges assigned to a team for a round")
    public ResponseEntity<ApiResponse<List<TeamJudgeAssignmentResponse>>> getAssignments(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID teamId) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getAssignmentsForTeam(roundId, teamId)));
    }

    @DeleteMapping("/{assignmentId}")
    @Operation(summary = "Remove a judge assignment from a team")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID teamId,
            @PathVariable UUID assignmentId) {
        assignmentService.removeAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Judge assignment removed", null));
    }
}
