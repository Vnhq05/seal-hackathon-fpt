package com.sealhackathon.submission.repository;

import com.sealhackathon.submission.domain.SubmissionVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionVersionRepository extends JpaRepository<SubmissionVersion, UUID> {

    List<SubmissionVersion> findBySubmissionIdOrderByVersionNumberDesc(UUID submissionId);

    @Query("SELECT COALESCE(MAX(v.versionNumber), 0) FROM SubmissionVersion v WHERE v.submission.id = :submissionId")
    int findMaxVersionNumber(@Param("submissionId") UUID submissionId);

    Optional<SubmissionVersion> findBySubmissionIdAndVersionNumber(UUID submissionId, Integer versionNumber);
}
