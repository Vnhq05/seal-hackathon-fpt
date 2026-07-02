package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.response.AllowedEmailDomainResponse;
import com.sealhackathon.event.service.AllowedEmailDomainService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/allowed-email-domains")
@RequiredArgsConstructor
@Tag(name = "Allowed Email Domains", description = "Read-only view of platform email domains for an event")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
public class AllowedEmailDomainController {

    private final AllowedEmailDomainService allowedEmailDomainService;

    @GetMapping
    @Operation(summary = "List allowed email domains that apply to an event (read-only)")
    public ResponseEntity<ApiResponse<List<AllowedEmailDomainResponse>>> list(
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(allowedEmailDomainService.listByEvent(eventId)));
    }
}
