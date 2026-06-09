package com.seal.seal_hackathon_fpt.features.user.dto;

import com.seal.seal_hackathon_fpt.features.user.entity.Role;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import com.seal.seal_hackathon_fpt.features.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UserResponse — "bản an toàn" của User để trả ra cho Frontend.
 * KHÔNG chứa password_hash (tránh lộ mật khẩu). Chỉ gồm các trường cần hiển thị
 * ở trang Users Management / Account Approval.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String name;      // ánh xạ từ User.full_name
    private String email;
    private Role role;
    private UserStatus status;
    private String studentId;
    private String school;
    private String phone;
    private java.time.LocalDate dateOfBirth;
    private String gender;

    // Hàm tiện ích: biến 1 User (Entity) thành UserResponse (đã cắt password).
    public static UserResponse from(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getFull_name())
                .email(u.getEmail())
                .role(u.getRole())
                .status(u.getStatus())
                .studentId(u.getStudentId())
                .school(u.getSchool())
                .phone(u.getPhone())
                .dateOfBirth(u.getDateOfBirth())
                .gender(u.getGender())
                .build();
    }
}
