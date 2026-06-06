package com.seal.seal_hackathon_fpt.features.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private String studentId; // mã số sinh viên (Participant) — để Admin xem khi duyệt
    private String school;     // trường (nếu không phải FPT)
}