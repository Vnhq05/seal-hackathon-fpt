package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.response.ScoringTemplateResponse;
import com.sealhackathon.event.service.ScoringTemplateService;
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
@RequestMapping("/api/scoring-templates")
@RequiredArgsConstructor
@Tag(name = "Scoring Templates (Read)", description = "Read-only access to admin-managed scoring criteria templates")
@SecurityRequirement(name = "bearerAuth")
public class ScoringTemplateReadController {

    private final ScoringTemplateService templateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List scoring templates configured by admin")
    public ResponseEntity<ApiResponse<List<ScoringTemplateResponse>>> listTemplates() {
        return ResponseEntity.ok(ApiResponse.success(templateService.listTemplates()));
    }

    @GetMapping("/{templateId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Get a scoring template by ID")
    public ResponseEntity<ApiResponse<ScoringTemplateResponse>> getTemplate(
            @PathVariable UUID templateId) {
        return ResponseEntity.ok(ApiResponse.success(templateService.getTemplateById(templateId)));
    }
}
