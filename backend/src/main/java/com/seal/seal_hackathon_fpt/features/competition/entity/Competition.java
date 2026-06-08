package com.seal.seal_hackathon_fpt.features.competition.entity;

import com.seal.seal_hackathon_fpt.features.competition.dto.UpdateCompetitionRequest;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "competitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season_id")
    private Long seasonId;

    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Format format;

    public void getRegistrationDeadline(UpdateCompetitionRequest request) {
    }

    public enum Format {
        Offline,
        Online,
        Hybrid
    }

    public enum Status {
        Draft,
        Open,
        Active,
        Scoring,
        Closed,
        Cancelled
    }

    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;
}

