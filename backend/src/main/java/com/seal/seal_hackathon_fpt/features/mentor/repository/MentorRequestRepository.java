package com.seal.seal_hackathon_fpt.features.mentor.repository;

import com.seal.seal_hackathon_fpt.features.mentor.entity.MentorRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {
    List<MentorRequest> findByMentorIdAndStatus(Long mentorId, String status);
    Optional<MentorRequest> findByTeamIdAndMentorId(Long teamId, Long mentorId);
    List<MentorRequest> findByTeamIdOrderByCreatedAtDesc(Long teamId);
}
