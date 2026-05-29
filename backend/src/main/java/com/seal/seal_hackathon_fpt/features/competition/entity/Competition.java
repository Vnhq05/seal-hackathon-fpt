package com.seal.seal_hackathon_fpt.features.competition.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "competitions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Competition {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_id")
    private Long seasonId;

    private String name;
    private String description;
    private String status;

    @Column(name = "start_date")
    private LocalDateTime startDate;
}

