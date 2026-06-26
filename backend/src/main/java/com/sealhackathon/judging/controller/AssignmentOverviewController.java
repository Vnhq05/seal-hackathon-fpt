package com.sealhackathon.judging.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.dto.request.CreateTeamAssignmentsRequest;
import com.sealhackathon.judging.dto.response.EventAssignmentsOverviewResponse;
import com.sealhackathon.judging.dto.response.TeamJudgeAssignmentResponse;
import com.sealhackathon.judging.service.AssignmentOverviewService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Team Judge Assignments", description = "Assign exactly 3 judges per team per round")
public class AssignmentOverviewController {

    private final AssignmentOverviewService assignmentOverviewService;

    @GetMapping("/api/events/{eventId}/assignments")
    @Operation(summary = "List team judge assignments for an event round")
    public ResponseEntity<ApiResponse<EventAssignmentsOverviewResponse>> getAssignments(
            @PathVariable UUID eventId,
            @RequestParam(required = false) String season,
            @RequestParam(required = false) Integer year,
            @RequestParam UUID roundId,
            @RequestParam(required = false) UUID trackId) {
        EventAssignmentsOverviewResponse response = assignmentOverviewService.getEventAssignments(
                eventId, season, year, roundId, trackId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/api/assignments")
    @Operation(summary = "Assign exactly 3 judges to a team for a round")
    public ResponseEntity<ApiResponse<List<TeamJudgeAssignmentResponse>>> assignJudges(
            @Valid @RequestBody CreateTeamAssignmentsRequest request) {
        List<TeamJudgeAssignmentResponse> response = assignmentOverviewService.assignJudges(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Judges assigned", response));
    }

    @DeleteMapping("/api/assignments/{assignmentId}")
    @Operation(summary = "Remove a team judge assignment")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable UUID assignmentId) {
        assignmentOverviewService.deleteAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Assignment removed", null));
    }
}
