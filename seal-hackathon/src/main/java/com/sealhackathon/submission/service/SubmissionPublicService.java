package com.sealhackathon.submission.service;

import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionPublicService {

    Optional<SubmissionSnapshot> getSubmission(UUID submissionId);

    List<SubmissionSnapshot> getSubmissionsByRound(UUID roundId);

    Optional<SubmissionSnapshot> getSubmissionByTeamAndRound(UUID teamId, UUID roundId);

    SubmissionStatus getSubmissionStatus(UUID submissionId);

    LocalDateTime getSubmittedAt(UUID submissionId);
}
