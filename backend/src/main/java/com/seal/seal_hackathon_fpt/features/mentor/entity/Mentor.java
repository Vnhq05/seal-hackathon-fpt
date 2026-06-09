package com.seal.seal_hackathon_fpt.features.mentor.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mentors")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mentor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "specialty")
    private String specialty;

    @Column(name = "organization")
    private String organization;

    // Không lưu DB — trả kèm email (lấy từ bảng users) để Participant mời mentor bằng email.
    @Transient
    private String email;
}