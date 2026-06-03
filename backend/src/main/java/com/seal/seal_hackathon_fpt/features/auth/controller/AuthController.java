package com.seal.seal_hackathon_fpt.features.auth.controller;

import com.seal.seal_hackathon_fpt.features.auth.dto.AuthResponse;
import com.seal.seal_hackathon_fpt.features.auth.dto.LoginRequest;
import com.seal.seal_hackathon_fpt.features.auth.dto.RegisterRequest;
import com.seal.seal_hackathon_fpt.features.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // ==================================================
    // API LẤY THÔNG TIN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP (/me)
    // ==================================================
    @GetMapping(    "/me")
    public ResponseEntity<?> getCurrentUser() {
        // 1. Lấy thông tin xác thực từ Context của Spring Security
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        // 2. Ép kiểu về đúng class User của dự án
        var user = (com.seal.seal_hackathon_fpt.features.user.entity.User) authentication.getPrincipal();

        // 3. Trả về một cục dữ liệu JSON an toàn
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getFull_name(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        ));
    }
}