package com.sealhackathon.submission.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubmissionPublicServiceImpl implements SubmissionPublicService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository versionRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<SubmissionSnapshot> getSubmission(UUID submissionId) {
        return submissionRepository.findById(submissionId).map(this::toSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionSnapshot> getSubmissionsByRound(UUID roundId) {
        return submissionRepository.findByRoundId(roundId).stream()
                .map(this::toSnapshot)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SubmissionSnapshot> getSubmissionByTeamAndRound(UUID teamId, UUID roundId) {
        return submissionRepository.findByTeamIdAndRoundId(teamId, roundId).map(this::toSnapshot);
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionStatus getSubmissionStatus(UUID submissionId) {
        return submissionRepository.findById(submissionId)
                .map(Submission::getStatus)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));
    }

    @Override
    @Transactional(readOnly = true)
    public LocalDateTime getSubmittedAt(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        if (submission.getCurrentVersionId() == null) {
            return submission.getCreatedAt();
        }

        return versionRepository.findById(submission.getCurrentVersionId())
                .map(SubmissionVersion::getSubmittedAt)
                .orElse(submission.getCreatedAt());
    }

    private SubmissionSnapshot toSnapshot(Submission s) {
        LocalDateTime submittedAt = null;
        if (s.getCurrentVersionId() != null) {
            submittedAt = versionRepository.findById(s.getCurrentVersionId())
                    .map(SubmissionVersion::getSubmittedAt)
                    .orElse(null);
        }

        return SubmissionSnapshot.builder()
                .id(s.getId())
                .teamId(s.getTeamId())
                .roundId(s.getRoundId())
                .status(s.getStatus())
                .submittedAt(submittedAt)
                .build();
    }
}
