package com.seal.seal_hackathon_fpt.features.user.dto;

import lombok.Data;

/**
 * CreateStaffRequest — dữ liệu Admin gửi lên khi tạo tài khoản nhân sự
 * (Mentor / Judge / Lecturer / Coordinator). KHÔNG cho tạo Admin hay Participant.
 */
@Data
public class CreateStaffRequest {
    private String name;
    private String email;
    private String role;     // chuỗi: "Mentor" | "Judge" | "Lecturer" | "Coordinator"
    private String password; // mật khẩu tạm, Admin sẽ chia sẻ cho nhân sự
}
