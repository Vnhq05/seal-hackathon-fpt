package com.sealhackathon.user.controller;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.user.dto.request.ApprovalRequest;
import com.sealhackathon.user.dto.request.RejectAccountRequest;
import com.sealhackathon.user.dto.response.UserListResponse;
import com.sealhackathon.user.dto.response.UserProfileResponse;
import com.sealhackathon.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/coordinator/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EVENT_COORDINATOR')")
@Tag(name = "Coordinator — User Management", description = "Account approval and participant listing for coordinators")
@SecurityRequirement(name = "bearerAuth")
public class CoordinatorUserController {

    private final UserService userService;

    @GetMapping("/pending")
    @Operation(summary = "List pending accounts awaiting approval")
    public ResponseEntity<ApiResponse<Page<UserListResponse>>> getPendingAccounts(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getPendingAccounts(pageable)));
    }

    @GetMapping("/pending/count")
    @Operation(summary = "Count pending accounts")
    public ResponseEntity<ApiResponse<Long>> countPending() {
        return ResponseEntity.ok(ApiResponse.success(userService.countPendingAccounts()));
    }

    @PatchMapping("/{userId}/approve")
    @Operation(summary = "Approve a pending account")
    public ResponseEntity<ApiResponse<UserProfileResponse>> approveUser(@PathVariable UUID userId) {
        ApprovalRequest request = ApprovalRequest.builder()
                .userId(userId)
                .action(ApprovalRequest.Action.APPROVE)
                .build();
        UserProfileResponse result = userService.approveOrReject(request);
        return ResponseEntity.ok(ApiResponse.success("Account approved successfully", result));
    }

    @PatchMapping("/{userId}/reject")
    @Operation(summary = "Reject a pending account")
    public ResponseEntity<ApiResponse<UserProfileResponse>> rejectUser(
            @PathVariable UUID userId,
            @Valid @RequestBody RejectAccountRequest body) {
        ApprovalRequest request = ApprovalRequest.builder()
                .userId(userId)
                .action(ApprovalRequest.Action.REJECT)
                .reason(body.getReason())
                .build();
        UserProfileResponse result = userService.approveOrReject(request);
        return ResponseEntity.ok(ApiResponse.success("Account rejected", result));
    }

    @GetMapping
    @Operation(summary = "List student participants (FPT + external students by default)")
    public ResponseEntity<ApiResponse<Page<UserListResponse>>> listParticipants(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserListResponse> page = userService.listStudentParticipants(status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
