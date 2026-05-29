package com.seal.seal_hackathon_fpt.features.team.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_members")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "team_id")
    private Long teamId;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "is_leader")
    private Boolean isLeader;
}
