package com.seal.seal_hackathon_fpt.features.competition.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "rounds")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Round {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    private String name;
    private Integer sequence;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(name = "question", columnDefinition = "NVARCHAR(MAX)")
    private String question;

    @Column(name = "guidelines", columnDefinition = "NVARCHAR(MAX)")
    private String guidelines;

    @Column(name = "is_locked")
    private Boolean isLocked;
}
