package com.seal.seal_hackathon_fpt.features.user.dto;

import lombok.Data;

import java.time.LocalDate;

// Body cập nhật hồ sơ cá nhân của chính user đang đăng nhập.
@Data
public class UpdateProfileRequest {
    private String name;       // full name
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String studentId;  // chỉ Participant mới có MSSV
}
