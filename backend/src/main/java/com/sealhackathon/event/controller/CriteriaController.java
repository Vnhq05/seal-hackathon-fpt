package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.CriteriaRequest;
import com.sealhackathon.event.dto.response.CriteriaResponse;
import com.sealhackathon.event.service.CriteriaService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rounds/{roundId}/criteria")
@RequiredArgsConstructor
@Tag(name = "Criteria", description = "Criteria configuration per round (BR-11)")
@SecurityRequirement(name = "bearerAuth")
public class CriteriaController {

    private final CriteriaService criteriaService;

    @GetMapping
    @Operation(summary = "List criteria for a round")
    public ResponseEntity<ApiResponse<List<CriteriaResponse>>> getCriteria(@PathVariable UUID roundId) {
        List<CriteriaResponse> criteria = criteriaService.getCriteriaByRound(roundId);
        return ResponseEntity.ok(ApiResponse.success(criteria));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Add a single criteria (BR-11 — weight sum validated)")
    public ResponseEntity<ApiResponse<CriteriaResponse>> addCriteria(
            @PathVariable UUID roundId,
            @Valid @RequestBody CriteriaRequest request) {
        CriteriaResponse response = criteriaService.addCriteria(roundId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Criteria added", response));
    }

    @PutMapping("/{criteriaId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Update a criteria")
    public ResponseEntity<ApiResponse<CriteriaResponse>> updateCriteria(
            @PathVariable UUID roundId, @PathVariable UUID criteriaId,
            @Valid @RequestBody CriteriaRequest request) {
        CriteriaResponse response = criteriaService.updateCriteria(criteriaId, request);
        return ResponseEntity.ok(ApiResponse.success("Criteria updated", response));
    }

    @DeleteMapping("/{criteriaId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Delete a criteria")
    public ResponseEntity<ApiResponse<Void>> deleteCriteria(
            @PathVariable UUID roundId, @PathVariable UUID criteriaId) {
        criteriaService.deleteCriteria(criteriaId);
        return ResponseEntity.ok(ApiResponse.success("Criteria deleted", null));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Replace all criteria for a round (BR-11 — weights must sum to 100%)")
    public ResponseEntity<ApiResponse<List<CriteriaResponse>>> replaceCriteria(
            @PathVariable UUID roundId,
            @Valid @RequestBody List<CriteriaRequest> requests) {
        List<CriteriaResponse> result = criteriaService.replaceCriteria(roundId, requests);
        return ResponseEntity.ok(ApiResponse.success("Criteria replaced", result));
    }
}
