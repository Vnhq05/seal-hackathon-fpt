package com.sealhackathon.ranking.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.ContestedSlotResponse;
import com.sealhackathon.ranking.dto.response.FinalistResponse;
import com.sealhackathon.ranking.dto.response.FinalistSelectResultResponse;
import com.sealhackathon.ranking.service.FinalistSelectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/finalists")
@RequiredArgsConstructor
@Tag(name = "Finalists", description = "Finalist selection for SEAL format")
@SecurityRequirement(name = "bearerAuth")
public class FinalistController {

    private final FinalistSelectionService finalistSelectionService;

    @PostMapping("/select")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Select finalists (Top 2 per track for SEAL format)")
    public ResponseEntity<ApiResponse<FinalistSelectResultResponse>> selectFinalists(@PathVariable UUID eventId) {
        FinalistSelectResultResponse result = finalistSelectionService.selectFinalists(eventId);
        return ResponseEntity.ok(ApiResponse.success("Finalists selected", result));
    }

    @GetMapping
    @Operation(summary = "List selected finalists")
    public ResponseEntity<ApiResponse<List<FinalistResponse>>> getFinalists(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(finalistSelectionService.getFinalists(eventId)));
    }

    @GetMapping("/contested")
    @Operation(summary = "List contested slots requiring OC penalty evaluation")
    public ResponseEntity<ApiResponse<List<ContestedSlotResponse>>> getContestedSlots(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(finalistSelectionService.getContestedSlots(eventId)));
    }
}
