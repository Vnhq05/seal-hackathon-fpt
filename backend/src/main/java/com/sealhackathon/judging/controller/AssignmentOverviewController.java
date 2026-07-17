package com.sealhackathon.judging.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.dto.response.EventAssignmentsOverviewResponse;
import com.sealhackathon.judging.service.AssignmentOverviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Assignment Overview", description = "Judge pool coverage per team per round")
public class AssignmentOverviewController {

    private final AssignmentOverviewService assignmentOverviewService;

    @GetMapping("/api/events/{eventId}/assignments")
    @Operation(summary = "List judge pool coverage per team for an event round")
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
}
