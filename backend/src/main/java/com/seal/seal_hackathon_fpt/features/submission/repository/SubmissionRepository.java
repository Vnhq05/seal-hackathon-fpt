package com.seal.seal_hackathon_fpt.features.submission.repository;

import com.seal.seal_hackathon_fpt.features.submission.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByTeamId(Long teamId);
}
