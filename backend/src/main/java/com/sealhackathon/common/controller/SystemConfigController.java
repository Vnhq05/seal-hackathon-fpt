package com.sealhackathon.common.controller;

import com.sealhackathon.common.dto.SystemConfigRequest;
import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.common.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/system-config")
@RequiredArgsConstructor
@Tag(name = "System Configuration", description = "Platform-wide settings (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class SystemConfigController {

    private final SystemConfigService configService;

    @GetMapping
    @Operation(summary = "Get system configuration")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(configService.getConfig()));
    }

    @PutMapping
    @Operation(summary = "Update system configuration")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateConfig(
            @Valid @RequestBody SystemConfigRequest request) {
        SystemConfigResponse response = configService.updateConfig(request);
        return ResponseEntity.ok(ApiResponse.success("System configuration updated", response));
    }
}
