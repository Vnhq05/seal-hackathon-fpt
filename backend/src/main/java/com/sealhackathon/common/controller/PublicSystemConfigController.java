package com.sealhackathon.common.controller;

import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.common.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system-config")
@RequiredArgsConstructor
@Tag(name = "System Configuration (Public)", description = "Read-only team size settings for authenticated users")
@SecurityRequirement(name = "bearerAuth")
public class PublicSystemConfigController {

    private final SystemConfigService configService;

    @GetMapping
    @Operation(summary = "Get team size configuration (min/max members)")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> getTeamConfig() {
        SystemConfigResponse config = configService.getConfig();
        return ResponseEntity.ok(ApiResponse.success(SystemConfigResponse.builder()
                .minTeamMembers(config.getMinTeamMembers())
                .maxTeamMembers(config.getMaxTeamMembers())
                .build()));
    }
}
