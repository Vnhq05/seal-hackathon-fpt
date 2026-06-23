package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.CreateScoringTemplateRequest;
import com.sealhackathon.event.dto.response.ScoringTemplateResponse;
import com.sealhackathon.event.service.ScoringTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/admin/scoring-templates")
@RequiredArgsConstructor
@Tag(name = "Scoring Templates", description = "Manage scoring criteria templates (Admin only)")
@SecurityRequirement(name = "bearerAuth")
public class ScoringTemplateController {

    private final ScoringTemplateService templateService;

    @PostMapping
    @Operation(summary = "Create a scoring template (weights must sum to 100%)")
    public ResponseEntity<ApiResponse<ScoringTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateScoringTemplateRequest request) {
        ScoringTemplateResponse response = templateService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Scoring template created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all scoring templates")
    public ResponseEntity<ApiResponse<List<ScoringTemplateResponse>>> listTemplates() {
        List<ScoringTemplateResponse> templates = templateService.listTemplates();
        return ResponseEntity.ok(ApiResponse.success(templates));
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "Get a scoring template by ID")
    public ResponseEntity<ApiResponse<ScoringTemplateResponse>> getTemplate(
            @PathVariable UUID templateId) {
        ScoringTemplateResponse response = templateService.getTemplateById(templateId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{templateId}")
    @Operation(summary = "Update a scoring template (weights must sum to 100%)")
    public ResponseEntity<ApiResponse<ScoringTemplateResponse>> updateTemplate(
            @PathVariable UUID templateId,
            @Valid @RequestBody CreateScoringTemplateRequest request) {
        ScoringTemplateResponse response = templateService.updateTemplate(templateId, request);
        return ResponseEntity.ok(ApiResponse.success("Scoring template updated successfully", response));
    }

    @DeleteMapping("/{templateId}")
    @Operation(summary = "Delete a scoring template (fails if in use by an event)")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID templateId) {
        templateService.deleteTemplate(templateId);
        return ResponseEntity.ok(ApiResponse.success("Scoring template deleted successfully", null));
    }
}
