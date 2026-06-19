package com.sealhackathon.submission.repository;

import com.sealhackathon.submission.domain.SubmissionAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmissionAttachmentRepository extends JpaRepository<SubmissionAttachment, UUID> {

    List<SubmissionAttachment> findBySubmissionVersionId(UUID submissionVersionId);
}
