package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.AddAllowedEmailDomainRequest;
import com.sealhackathon.event.dto.response.AllowedEmailDomainResponse;
import com.sealhackathon.event.service.AllowedEmailDomainService;
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
@RequestMapping("/api/events/{eventId}/allowed-email-domains")
@RequiredArgsConstructor
@Tag(name = "Allowed Email Domains", description = "Per-event email domain whitelist for external students")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
public class AllowedEmailDomainController {

    private final AllowedEmailDomainService allowedEmailDomainService;

    @GetMapping
    @Operation(summary = "List allowed email domains for an event")
    public ResponseEntity<ApiResponse<List<AllowedEmailDomainResponse>>> list(
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(allowedEmailDomainService.listByEvent(eventId)));
    }

    @PostMapping
    @Operation(summary = "Add an allowed email domain")
    public ResponseEntity<ApiResponse<AllowedEmailDomainResponse>> add(
            @PathVariable UUID eventId,
            @Valid @RequestBody AddAllowedEmailDomainRequest request) {
        AllowedEmailDomainResponse response = allowedEmailDomainService.addDomain(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{domainId}")
    @Operation(summary = "Remove an allowed email domain")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable UUID eventId,
            @PathVariable UUID domainId) {
        allowedEmailDomainService.removeDomain(eventId, domainId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
