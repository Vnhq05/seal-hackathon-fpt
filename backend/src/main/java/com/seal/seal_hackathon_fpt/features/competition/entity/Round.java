package com.seal.seal_hackathon_fpt.features.competition.entity;

import jakarta.persistence.*;
import lombok.*;

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
}
