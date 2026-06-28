package com.sealhackathon.event.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.TrackAssignRequest;
import com.sealhackathon.team.dto.request.TrackDrawRequest;
import com.sealhackathon.team.dto.response.TrackAssignmentResponse;
import com.sealhackathon.team.dto.response.TrackDrawResultResponse;
import com.sealhackathon.team.service.TrackAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/tracks")
@RequiredArgsConstructor
@Tag(name = "Track Assignment", description = "Coordinator track assignment and draw")
@SecurityRequirement(name = "bearerAuth")
public class TrackAssignmentController {

    private final TrackAssignmentService trackAssignmentService;
    private final AuthPublicService authPublicService;

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Manually assign teams to tracks")
    public ResponseEntity<ApiResponse<List<TrackAssignmentResponse>>> assignTracks(
            @PathVariable UUID eventId,
            @Valid @RequestBody TrackAssignRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        List<TrackAssignmentResponse> result = trackAssignmentService.assignTracks(eventId, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Tracks assigned", result));
    }

    @PostMapping("/draw")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Randomly draw unassigned teams into tracks")
    public ResponseEntity<ApiResponse<TrackDrawResultResponse>> drawTracks(
            @PathVariable UUID eventId,
            @RequestBody(required = false) TrackDrawRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        TrackDrawResultResponse result = trackAssignmentService.drawTracks(eventId, userId);
        return ResponseEntity.ok(ApiResponse.success("Track draw completed", result));
    }
}
