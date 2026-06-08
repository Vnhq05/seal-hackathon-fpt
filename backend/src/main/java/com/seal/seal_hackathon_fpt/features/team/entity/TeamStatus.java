package com.seal.seal_hackathon_fpt.features.team.entity;

public enum TeamStatus {
    INCOMPLETE,             // < 3 thành viên
    REGISTERED,             // 3-5 thành viên
    NEED_COORDINATOR_REVIEW,// Theo BR-28
    ELIMINATED,             // Bị loại ở round
    ADVANCED                // Qua round tiếp theo
}