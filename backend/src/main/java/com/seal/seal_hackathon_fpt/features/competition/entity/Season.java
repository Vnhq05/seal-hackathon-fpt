package com.seal.seal_hackathon_fpt.features.competition.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seasons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Season {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
}
