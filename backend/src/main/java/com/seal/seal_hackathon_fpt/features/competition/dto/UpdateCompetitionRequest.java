package com.seal.seal_hackathon_fpt.features.competition.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateCompetitionRequest {
    private String name;
    private String description;
    private String status;
    private LocalDateTime startDate;
}