package com.sealhackathon.submission.repository;

import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Optional<Submission> findByTeamIdAndRoundId(UUID teamId, UUID roundId);

    boolean existsByTeamIdAndRoundId(UUID teamId, UUID roundId);

    List<Submission> findByRoundId(UUID roundId);

    List<Submission> findByRoundIdAndStatus(UUID roundId, SubmissionStatus status);

    List<Submission> findByTeamId(UUID teamId);
}
