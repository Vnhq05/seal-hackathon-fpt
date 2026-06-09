package com.seal.seal_hackathon_fpt.features.mentor.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mentor_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MentorRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

    @Column(name = "status")
    private String status; // PENDING, ACCEPTED, DENIED

    @Column(name = "message", columnDefinition = "NVARCHAR(MAX)")
    private String message; // lời nhắn của team khi mời

    @Column(name = "from_email", length = 190)
    private String fromEmail; // email người gửi lời mời (leader)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
