package com.seal.seal_hackathon_fpt.features.competition.dto;

import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateCompetitionRequest {
    private String name;
    private String description;
    //Đổi thành danh sách status
    //private String status;
    private LocalDateTime startDate;
    private Competition.Status status;
    private Competition.Format format;
    private LocalDateTime registrationDeadline;
}