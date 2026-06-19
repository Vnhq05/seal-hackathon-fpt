package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.dto.request.UpdateEventRequest;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Hackathon event management (BR-08, BR-10)")
@SecurityRequirement(name = "bearerAuth")
public class EventController {

    private final EventService eventService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Create a new hackathon event (BR-08)")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody CreateEventRequest request) {
        EventResponse response = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Event created successfully", response));
    }

    @PutMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Update event configuration (BR-08 — blocked after activation)")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateEventRequest request) {
        EventResponse response = eventService.updateEvent(eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Event updated successfully", response));
    }

    @PostMapping("/{eventId}/activate")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Activate a draft event (BR-08)")
    public ResponseEntity<ApiResponse<EventResponse>> activateEvent(@PathVariable UUID eventId) {
        EventResponse response = eventService.activateEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event activated", response));
    }

    @PostMapping("/{eventId}/complete")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Mark event as completed")
    public ResponseEntity<ApiResponse<EventResponse>> completeEvent(@PathVariable UUID eventId) {
        EventResponse response = eventService.completeEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event completed", response));
    }

    @PostMapping("/{eventId}/cancel")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Cancel an event")
    public ResponseEntity<ApiResponse<EventResponse>> cancelEvent(@PathVariable UUID eventId) {
        EventResponse response = eventService.cancelEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event cancelled", response));
    }

    @GetMapping("/{eventId}")
    @Operation(summary = "Get event by ID")
    public ResponseEntity<ApiResponse<EventResponse>> getEvent(@PathVariable UUID eventId) {
        EventResponse response = eventService.getEventById(eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List events with optional status filter")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> listEvents(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EventResponse> page = eventService.listEvents(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
