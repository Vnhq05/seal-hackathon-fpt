package com.sealhackathon.user.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.user.dto.request.ChangePasswordRequest;
import com.sealhackathon.user.dto.request.SetOfficialPasswordRequest;
import com.sealhackathon.user.dto.request.UpdateProfileRequest;
import com.sealhackathon.user.dto.response.UserProfileResponse;
import com.sealhackathon.user.dto.response.UserSearchResponse;
import com.sealhackathon.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "Profile management for authenticated users")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final AuthPublicService authPublicService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        UUID userId = getCurrentUserId();
        UserProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        UUID userId = getCurrentUserId();
        UserProfileResponse profile = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", profile));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload or replace profile avatar (JPEG/PNG/WebP, max 2 MB)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadAvatar(
            @RequestParam("file") MultipartFile file) {
        UUID userId = getCurrentUserId();
        UserProfileResponse profile = userService.uploadAvatar(userId, file);
        return ResponseEntity.ok(ApiResponse.success("Avatar uploaded successfully", profile));
    }

    @DeleteMapping("/me/avatar")
    @Operation(summary = "Remove profile avatar")
    public ResponseEntity<ApiResponse<UserProfileResponse>> deleteAvatar() {
        UUID userId = getCurrentUserId();
        UserProfileResponse profile = userService.deleteAvatar(userId);
        return ResponseEntity.ok(ApiResponse.success("Avatar removed successfully", profile));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change current user password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        UUID userId = getCurrentUserId();
        userService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PutMapping("/me/official-password")
    @Operation(summary = "Set official password for temporary external student accounts")
    public ResponseEntity<ApiResponse<UserProfileResponse>> setOfficialPassword(
            @Valid @RequestBody SetOfficialPasswordRequest request) {
        UUID userId = getCurrentUserId();
        UserProfileResponse profile = userService.setOfficialPassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Official password set successfully", profile));
    }

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Search active student users for team invitations")
    public ResponseEntity<ApiResponse<List<UserSearchResponse>>> searchUsers(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "20") int limit) {
        int cappedLimit = Math.min(Math.max(limit, 1), 50);
        List<UserSearchResponse> results = userService.searchActiveStudents(query, cappedLimit);
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    private UUID getCurrentUserId() {
        return authPublicService.getCurrentUserId();
    }
}
