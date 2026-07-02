package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.EventMentorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventMentorAssignmentRepository extends JpaRepository<EventMentorAssignment, UUID> {

    List<EventMentorAssignment> findByHackathonEventId(UUID eventId);

    boolean existsByHackathonEventIdAndMentorUserId(UUID eventId, UUID mentorUserId);

    long countByMentorUserId(UUID mentorUserId);
}
