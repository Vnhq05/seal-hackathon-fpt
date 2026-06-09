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

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "status")
    private String status; // Draft / Under Review / Submitted

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}