package com.seal.seal_hackathon_fpt.features.staff.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "competition_mentors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompetitionMentor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
