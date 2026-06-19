package com.sealhackathon.ranking.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.request.DisputeRequest;
import com.sealhackathon.ranking.dto.request.ResolveDisputeRequest;
import com.sealhackathon.ranking.dto.response.DisputeResponse;
import com.sealhackathon.ranking.service.DisputeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rounds/{roundId}/disputes")
@RequiredArgsConstructor
@Tag(name = "Disputes", description = "Result dispute workflow (BR-56)")
@SecurityRequirement(name = "bearerAuth")
public class DisputeController {

    private final DisputeService disputeService;
    private final AuthPublicService authPublicService;

    @PostMapping
    @Operation(summary = "File a dispute within 24h of publish (BR-56)")
    public ResponseEntity<ApiResponse<DisputeResponse>> fileDispute(
            @PathVariable UUID roundId,
            @Valid @RequestBody DisputeRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        DisputeResponse response = disputeService.fileDispute(userId, roundId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dispute filed", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List all disputes for a round")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getDisputes(
            @PathVariable UUID roundId) {
        List<DisputeResponse> disputes = disputeService.getDisputesByRound(roundId);
        return ResponseEntity.ok(ApiResponse.success(disputes));
    }

    @GetMapping("/{disputeId}")
    @Operation(summary = "Get dispute by ID")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDispute(
            @PathVariable UUID roundId, @PathVariable UUID disputeId) {
        DisputeResponse response = disputeService.getDisputeById(disputeId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{disputeId}/resolve")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Resolve or reject a dispute")
    public ResponseEntity<ApiResponse<DisputeResponse>> resolveDispute(
            @PathVariable UUID roundId, @PathVariable UUID disputeId,
            @Valid @RequestBody ResolveDisputeRequest request) {
        UUID resolverId = authPublicService.getCurrentUserId();
        DisputeResponse response = disputeService.resolveDispute(disputeId, resolverId, request);
        return ResponseEntity.ok(ApiResponse.success("Dispute resolved", response));
    }
}
