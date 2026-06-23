package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.MentorChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MentorChatMessageRepository extends JpaRepository<MentorChatMessage, UUID> {

    List<MentorChatMessage> findByTeamIdOrderBySentAtAsc(UUID teamId);
}
