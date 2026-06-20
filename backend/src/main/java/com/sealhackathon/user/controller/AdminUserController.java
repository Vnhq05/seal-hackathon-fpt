package com.sealhackathon.user.controller;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.user.dto.request.ApprovalRequest;
import com.sealhackathon.user.dto.request.CreateInternalAccountRequest;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "Admin — User Management", description = "Account approval, internal account creation, user listing")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all users with filters")
    public ResponseEntity<ApiResponse<Page<UserListResponse>>> listUsers(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) UserType userType,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<UserListResponse> page = userService.listUsers(status, userType, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/pending")
    @Operation(summary = "List pending accounts awaiting approval (BR-01)")
    public ResponseEntity<ApiResponse<Page<UserListResponse>>> getPendingAccounts(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<UserListResponse> page = userService.getPendingAccounts(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/pending/count")
    @Operation(summary = "Count pending accounts")
    public ResponseEntity<ApiResponse<Long>> countPending() {
        long count = userService.countPendingAccounts();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user details by ID")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable UUID userId) {
        UserProfileResponse profile = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/approve")
    @Operation(summary = "Approve or reject a pending account (BR-01)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> approveOrReject(
            @Valid @RequestBody ApprovalRequest request) {
        UserProfileResponse result = userService.approveOrReject(request);
        String message = request.getAction() == ApprovalRequest.Action.APPROVE
                ? "Account approved successfully"
                : "Account rejected";
        return ResponseEntity.ok(ApiResponse.success(message, result));
    }

    @PostMapping("/internal")
    @Operation(summary = "Create internal account — Mentor, Judge, Lecturer, Coordinator (BR-02)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> createInternalAccount(
            @Valid @RequestBody CreateInternalAccountRequest request) {
        UserProfileResponse result = userService.createInternalAccount(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Internal account created successfully", result));
    }
}
