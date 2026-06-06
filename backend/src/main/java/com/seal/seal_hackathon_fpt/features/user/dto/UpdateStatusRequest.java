package com.seal.seal_hackathon_fpt.features.user.dto;

import lombok.Data;

/**
 * UpdateStatusRequest — dùng để duyệt / khóa / mở lại tài khoản.
 * status nhận 1 trong: "pending" | "active" | "suspended".
 */
@Data
public class UpdateStatusRequest {
    private String status;
}
