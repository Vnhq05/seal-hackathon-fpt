package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.MentorInvitation;
import com.sealhackathon.team.domain.enums.MentorInvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MentorInvitationRepository extends JpaRepository<MentorInvitation, UUID> {

    List<MentorInvitation> findByTeamIdOrderByCreatedAtDesc(UUID teamId);

    List<MentorInvitation> findByMentorUserIdAndStatus(UUID mentorUserId, MentorInvitationStatus status);

    long countByMentorUserId(UUID mentorUserId);

    boolean existsByTeamIdAndMentorUserIdAndStatus(UUID teamId, UUID mentorUserId, MentorInvitationStatus status);

    List<MentorInvitation> findByTeamIdAndStatus(UUID teamId, MentorInvitationStatus status);
}
