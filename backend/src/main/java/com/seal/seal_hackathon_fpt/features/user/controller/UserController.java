package com.seal.seal_hackathon_fpt.features.user.controller;

import com.seal.seal_hackathon_fpt.features.user.dto.CreateStaffRequest;
import com.seal.seal_hackathon_fpt.features.user.dto.UpdateStatusRequest;
import com.seal.seal_hackathon_fpt.features.user.dto.UserResponse;
import com.seal.seal_hackathon_fpt.features.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UserController — API quản lý người dùng (dùng cho 3 trang Admin/Coordinator:
 *   - Users Management   : GET danh sách + đổi trạng thái (suspend/reactivate)
 *   - Account Approval   : GET danh sách (lọc pending) + duyệt (status=active)
 *   - Create Staff       : POST tạo Mentor/Judge/Lecturer/Coordinator
 *
 * Tất cả endpoint yêu cầu đã đăng nhập (xem SecurityConfig: anyRequest authenticated).
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/users → danh sách toàn bộ user (đã cắt mật khẩu)
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll() {
        return ResponseEntity.ok(userService.listUsers());
    }

    // POST /api/users → tạo tài khoản nhân sự
    @PostMapping
    public ResponseEntity<UserResponse> createStaff(@RequestBody CreateStaffRequest request) {
        return ResponseEntity.ok(userService.createStaff(request));
    }

    // PUT /api/users/{id}/status → đổi trạng thái (duyệt / khóa / mở lại)
    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(userService.updateStatus(id, request.getStatus()));
    }
}
