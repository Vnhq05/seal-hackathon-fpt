package com.seal.seal_hackathon_fpt.features.staff.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "competition_judges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompetitionJudge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "judge_id", nullable = false)
    private Long judgeId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
