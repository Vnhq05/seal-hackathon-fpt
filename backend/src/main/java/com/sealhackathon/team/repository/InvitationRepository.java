package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    List<Invitation> findByTeamIdAndStatus(UUID teamId, InvitationStatus status);

    List<Invitation> findByInviteeEmailAndStatus(String inviteeEmail, InvitationStatus status);

    boolean existsByTeamIdAndInviteeEmailAndStatus(UUID teamId, String inviteeEmail, InvitationStatus status);

    List<Invitation> findByTeamId(UUID teamId);
}
