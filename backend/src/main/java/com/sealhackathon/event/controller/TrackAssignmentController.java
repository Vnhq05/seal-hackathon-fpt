package com.sealhackathon.event.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.OpenTrackDrawSessionRequest;
import com.sealhackathon.event.dto.response.TrackDrawSessionResponse;
import com.sealhackathon.event.dto.response.TrackLockResponse;
import com.sealhackathon.event.service.TrackDrawSessionService;
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
import org.springframework.web.bind.annotation.GetMapping;
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
    private final TrackDrawSessionService trackDrawSessionService;
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

    @PostMapping("/draw-session/open")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Open track self-draw session (SEAL format, Day 1)")
    public ResponseEntity<ApiResponse<TrackDrawSessionResponse>> openDrawSession(
            @PathVariable UUID eventId,
            @RequestBody(required = false) OpenTrackDrawSessionRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        TrackDrawSessionResponse result = trackDrawSessionService.openDrawSession(eventId, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Track draw session opened", result));
    }

    @GetMapping("/draw-session")
    @Operation(summary = "Get current track draw session state")
    public ResponseEntity<ApiResponse<TrackDrawSessionResponse>> getDrawSession(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(trackDrawSessionService.getDrawSession(eventId)));
    }

    @PostMapping("/lock")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Lock all tracks after Day 1 assignment")
    public ResponseEntity<ApiResponse<TrackLockResponse>> lockTracks(@PathVariable UUID eventId) {
        TrackLockResponse result = trackDrawSessionService.lockAllTracks(eventId);
        return ResponseEntity.ok(ApiResponse.success("All tracks locked", result));
    }
}
