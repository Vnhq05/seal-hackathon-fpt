package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.MentorAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MentorAssignmentRepository extends JpaRepository<MentorAssignment, UUID> {

    List<MentorAssignment> findByHackathonEventId(UUID eventId);

    boolean existsByHackathonEventIdAndMentorUserId(UUID eventId, UUID mentorUserId);
}
