package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.AssignTrackTopicRequest;
import com.sealhackathon.event.dto.request.CreateTrackRequest;
import com.sealhackathon.event.dto.response.TrackResponse;
import com.sealhackathon.event.service.TrackService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/tracks")
@RequiredArgsConstructor
@Tag(name = "Tracks", description = "Event track management")
@SecurityRequirement(name = "bearerAuth")
public class TrackController {

    private final TrackService trackService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Create a track for an event")
    public ResponseEntity<ApiResponse<TrackResponse>> createTrack(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateTrackRequest request) {
        TrackResponse response = trackService.createTrack(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Track created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all tracks for an event")
    public ResponseEntity<ApiResponse<List<TrackResponse>>> listTracks(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(trackService.listTracks(eventId)));
    }

    @GetMapping("/{trackId}")
    @Operation(summary = "Get a track by ID")
    public ResponseEntity<ApiResponse<TrackResponse>> getTrack(
            @PathVariable UUID eventId, @PathVariable UUID trackId) {
        return ResponseEntity.ok(ApiResponse.success(trackService.getTrackById(eventId, trackId)));
    }

    @PutMapping("/{trackId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Update a track")
    public ResponseEntity<ApiResponse<TrackResponse>> updateTrack(
            @PathVariable UUID eventId, @PathVariable UUID trackId,
            @Valid @RequestBody CreateTrackRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Track updated", trackService.updateTrack(eventId, trackId, request)));
    }

    @PutMapping("/{trackId}/topic")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Assign topic to track after draw (OC draws topic per track)")
    public ResponseEntity<ApiResponse<TrackResponse>> assignTopic(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId,
            @Valid @RequestBody AssignTrackTopicRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Track topic assigned", trackService.assignTopic(eventId, trackId, request)));
    }

    @DeleteMapping("/{trackId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Delete a track")
    public ResponseEntity<ApiResponse<Void>> deleteTrack(
            @PathVariable UUID eventId, @PathVariable UUID trackId) {
        trackService.deleteTrack(eventId, trackId);
        return ResponseEntity.ok(ApiResponse.success("Track deleted", null));
    }
}
