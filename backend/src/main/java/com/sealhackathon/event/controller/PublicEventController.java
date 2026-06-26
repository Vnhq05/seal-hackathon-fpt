package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.dto.response.RoundResponse;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.event.service.RoundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/events")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Public endpoints — no authentication required")
public class PublicEventController {

    private final EventService eventService;
    private final RoundService roundService;

    @GetMapping
    @Operation(summary = "List published events (public)")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> listActiveEvents(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EventResponse> page = eventService.listPublicEvents(null, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{eventId}")
    @Operation(summary = "Get event details (public)")
    public ResponseEntity<ApiResponse<EventResponse>> getEvent(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getPublicEventById(eventId)));
    }

    @GetMapping("/{eventId}/rounds")
    @Operation(summary = "List event rounds (public)")
    public ResponseEntity<ApiResponse<List<RoundResponse>>> getRounds(@PathVariable UUID eventId) {
        eventService.assertPubliclyVisible(eventId);
        return ResponseEntity.ok(ApiResponse.success(roundService.getRoundsByEvent(eventId)));
    }
}
