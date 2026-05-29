package com.seal.seal_hackathon_fpt.features.team.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_member_invites")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeamInvite {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "team_id")
    private Long teamId;
    @Column(name = "inviter_id")
    private Long inviterId;
    @Column(name = "invitee_id")
    private Long inviteeId;
    private String status; // PENDING, ACCEPTED, REJECTED
}
