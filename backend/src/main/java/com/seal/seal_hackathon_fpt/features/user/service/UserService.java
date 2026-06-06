package com.seal.seal_hackathon_fpt.features.user.service;

import com.seal.seal_hackathon_fpt.features.auth.dto.RegisterRequest;
import com.seal.seal_hackathon_fpt.features.user.dto.CreateStaffRequest;
import com.seal.seal_hackathon_fpt.features.user.dto.UserResponse;
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
    // 1b. LẤY DANH SÁCH USER DẠNG DTO (đã cắt mật khẩu) — dùng cho Frontend
    // ==========================================
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    // ==========================================
    // 1c. ĐỔI TRẠNG THÁI TÀI KHOẢN (duyệt / khóa / mở lại)
    //     status: "pending" | "active" | "suspended"
    // ==========================================
    public UserResponse updateStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found, id: " + id));
        UserStatus newStatus;
        try {
            newStatus = UserStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }
        user.setStatus(newStatus);
        return UserResponse.from(userRepository.save(user));
    }

    // ==========================================
    // 1d. TẠO TÀI KHOẢN NHÂN SỰ (Admin tạo Mentor/Judge/Lecturer/Coordinator)
    // ==========================================
    public UserResponse createStaff(CreateStaffRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists in the system!");
        }
        Role role;
        try {
            role = Role.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + request.getRole());
        }
        // Chốt chặn: chỉ cho tạo nhân sự, không cho tạo Admin hay Participant qua đây.
        if (role == Role.Admin || role == Role.Participant) {
            throw new RuntimeException("Only Mentor / Judge / Lecturer / Coordinator accounts can be created.");
        }
        User user = User.builder()
                .full_name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .status(UserStatus.active)
                .build();
        return UserResponse.from(userRepository.save(user));
    }

    // ==========================================
    // 2. TẠO ADMIN (Chốt chặn bảo mật: Chỉ cho phép 1 Admin)
    // ==========================================
    public User createAdminAccount(RegisterRequest request) {
        // Kiểm tra xem đã có trùm cuối nào tồn tại chưa
        if (userRepository.countByRole(Role.Admin) >= 1) {
            throw new RuntimeException("WARNING: The SEAL system allows only one Admin account!");
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
                .orElseThrow(() -> new RuntimeException("Current Admin not found!"));

        // Đổi thông tin sang người mới
        currentAdmin.setEmail(newEmail);
        currentAdmin.setPassword(passwordEncoder.encode(newPassword));

        // Cất lại vào DB (Giữ nguyên ID, không làm đứt gãy lịch sử hệ thống)
        userRepository.save(currentAdmin);
    }
}