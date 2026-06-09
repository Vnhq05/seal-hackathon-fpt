package com.seal.seal_hackathon_fpt.features.user.dto;

import lombok.Data;

// Body đổi mật khẩu của chính user đang đăng nhập.
@Data
public class ChangePasswordRequest {
    private String oldPassword;
    private String newPassword;
}
