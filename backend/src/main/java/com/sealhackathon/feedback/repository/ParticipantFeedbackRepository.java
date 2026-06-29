package com.sealhackathon.feedback.repository;

import com.sealhackathon.feedback.domain.ParticipantFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipantFeedbackRepository extends JpaRepository<ParticipantFeedback, UUID> {

    List<ParticipantFeedback> findByEventIdOrderBySubmittedAtDesc(UUID eventId);

    Optional<ParticipantFeedback> findByUserIdAndEventId(UUID userId, UUID eventId);

    boolean existsByUserIdAndEventId(UUID userId, UUID eventId);

    long countByEventId(UUID eventId);
}
