package com.seal.seal_hackathon_fpt.features.user.service;

import com.seal.seal_hackathon_fpt.features.auth.dto.RegisterRequest;
import com.seal.seal_hackathon_fpt.features.user.entity.Role;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import com.seal.seal_hackathon_fpt.features.user.entity.UserStatus;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ==========================================
    // 1. LẤY DANH SÁCH USER (Sẽ dùng DTO để che mật khẩu ở bước sau)
    // ==========================================
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ==========================================
    // 2. TẠO ADMIN (Chốt chặn bảo mật: Chỉ cho phép 1 Admin)
    // ==========================================
    public User createAdminAccount(RegisterRequest request) {
        // Kiểm tra xem đã có trùm cuối nào tồn tại chưa
        if (userRepository.countByRole(Role.Admin) >= 1) {
            throw new RuntimeException("CẢNH BÁO: Hệ thống SEAL chỉ cho phép tồn tại duy nhất 1 tài khoản Admin!");
        }

        var admin = User.builder()
                .full_name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.Admin)
                .status(UserStatus.active)
                .build();

        return userRepository.save(admin);
    }

    // ==========================================
    // 3. CHUYỂN GIAO QUYỀN LỰC ADMIN
    // ==========================================
    public void transferAdminOwnership(String currentAdminEmail, String newEmail, String newPassword) {
        // Tìm Admin cũ
        User currentAdmin = userRepository.findByEmail(currentAdminEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Admin hiện hành!"));

        // Đổi thông tin sang người mới
        currentAdmin.setEmail(newEmail);
        currentAdmin.setPassword(passwordEncoder.encode(newPassword));

        // Cất lại vào DB (Giữ nguyên ID, không làm đứt gãy lịch sử hệ thống)
        userRepository.save(currentAdmin);
    }
}