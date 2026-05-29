package com.seal.seal_hackathon_fpt.features.submission.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Submission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "round_id")
    private Long roundId;

    @Column(name = "submitter_id")
    private Long submitterId;

    private String fileUrl; // Hoặc repo link

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}