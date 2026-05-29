package com.seal.seal_hackathon_fpt.features.submission.dto;

import lombok.Data;

@Data
public class SubmitWorkRequest {
    private Long teamId;
    private Long roundId;
    private String fileUrl;
}