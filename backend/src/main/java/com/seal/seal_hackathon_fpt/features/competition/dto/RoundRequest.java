package com.seal.seal_hackathon_fpt.features.competition.dto;

import lombok.Data;

import java.time.LocalDateTime;

// Body tạo/cập nhật một vòng thi (round) cho cuộc thi.
@Data
public class RoundRequest {
    private String name;
    private Integer sequence;     // null → backend tự đánh số tiếp theo
    private LocalDateTime startAt;
    private LocalDateTime deadline;
    private String question;
    private String guidelines;
    private Boolean isLocked;
}
