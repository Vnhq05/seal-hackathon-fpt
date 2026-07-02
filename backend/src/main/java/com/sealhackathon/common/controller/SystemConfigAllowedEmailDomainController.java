package com.sealhackathon.common.controller;

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
@RequestMapping("/api/admin/system-config/allowed-email-domains")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "System Configuration", description = "Platform-wide allowed email domains (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class SystemConfigAllowedEmailDomainController {

    private final AllowedEmailDomainService allowedEmailDomainService;

    @GetMapping
    @Operation(summary = "List platform-wide allowed email domains")
    public ResponseEntity<ApiResponse<List<AllowedEmailDomainResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(allowedEmailDomainService.listPlatformDomains()));
    }

    @PostMapping
    @Operation(summary = "Add a platform-wide allowed email domain")
    public ResponseEntity<ApiResponse<AllowedEmailDomainResponse>> add(
            @Valid @RequestBody AddAllowedEmailDomainRequest request) {
        AllowedEmailDomainResponse response = allowedEmailDomainService.addPlatformDomain(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @DeleteMapping("/{domainId}")
    @Operation(summary = "Remove a platform-wide allowed email domain")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable UUID domainId) {
        allowedEmailDomainService.removePlatformDomain(domainId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
