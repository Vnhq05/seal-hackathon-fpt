package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/events")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Public endpoints — no authentication required")
public class PublicEventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "List active events (public)")
    public ResponseEntity<ApiResponse<Page<EventResponse>>> listActiveEvents(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EventResponse> page = eventService.listPublicEvents(EventStatus.ACTIVE, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
