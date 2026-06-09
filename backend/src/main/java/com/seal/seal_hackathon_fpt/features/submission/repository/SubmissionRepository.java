package com.seal.seal_hackathon_fpt.features.submission.repository;

import com.seal.seal_hackathon_fpt.features.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByTeamId(Long teamId);
    Optional<Submission> findByTeamIdAndRoundId(Long teamId, Long roundId);
}
