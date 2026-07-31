package com.sealhackathon.submission.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionAttachment;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.repository.SubmissionAttachmentRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Final round reuses the previous round's submission artifacts (no new proposal).
 * Copies into a Final-round submission row so judging stays keyed by final roundId.
 */
@Service
@RequiredArgsConstructor
public class FinalSubmissionCarryOverService {

    private final RoundRepository roundRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository versionRepository;
    private final SubmissionAttachmentRepository attachmentRepository;

    @Transactional
    public Optional<Submission> ensureFinalSubmission(UUID teamId, UUID finalRoundId) {
        Round finalRound = roundRepository.findById(finalRoundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", finalRoundId));
        if (finalRound.getRoundType() != RoundType.FINAL) {
            return submissionRepository.findByTeamIdAndRoundId(teamId, finalRoundId);
        }

        Optional<Submission> existing = submissionRepository.findByTeamIdAndRoundId(teamId, finalRoundId);
        if (existing.isPresent()) {
            return existing;
        }

        Round previous = findPreviousRound(finalRound);
        if (previous == null) {
            return Optional.empty();
        }

        Submission source = submissionRepository.findByTeamIdAndRoundId(teamId, previous.getId())
                .orElse(null);
        if (source == null || source.getCurrentVersionId() == null) {
            return Optional.empty();
        }

        SubmissionVersion sourceVersion = versionRepository.findById(source.getCurrentVersionId())
                .orElse(null);
        if (sourceVersion == null) {
            return Optional.empty();
        }

        Submission carried = submissionRepository.save(Submission.builder()
                .teamId(teamId)
                .roundId(finalRoundId)
                .submittedBy(source.getSubmittedBy())
                .status(SubmissionStatus.SUBMITTED)
                .build());

        String otherUrl = sourceVersion.getOtherUrl() != null && !sourceVersion.getOtherUrl().isBlank()
                ? sourceVersion.getOtherUrl()
                : sourceVersion.getDemoUrl();
        SubmissionVersion copy = versionRepository.save(SubmissionVersion.builder()
                .submission(carried)
                .versionNumber(1)
                .githubUrl(sourceVersion.getGithubUrl())
                .slideUrl(sourceVersion.getSlideUrl())
                .otherUrl(otherUrl)
                .demoUrl(otherUrl)
                .submittedAt(sourceVersion.getSubmittedAt() != null
                        ? sourceVersion.getSubmittedAt()
                        : LocalDateTime.now())
                .build());

        List<SubmissionAttachment> attachments =
                attachmentRepository.findBySubmissionVersionId(sourceVersion.getId());
        for (SubmissionAttachment prev : attachments) {
            attachmentRepository.save(SubmissionAttachment.builder()
                    .submissionVersion(copy)
                    .fileName(prev.getFileName())
                    .fileUrl(prev.getFileUrl())
                    .fileSize(prev.getFileSize())
                    .pageCount(prev.getPageCount())
                    .build());
        }

        carried.setCurrentVersionId(copy.getId());
        carried = submissionRepository.save(carried);
        return Optional.of(carried);
    }

    @Transactional
    public void carryOverForTeams(UUID finalRoundId, List<UUID> teamIds) {
        for (UUID teamId : teamIds) {
            ensureFinalSubmission(teamId, finalRoundId);
        }
    }

    public Round findPreviousRound(Round round) {
        UUID eventId = round.getHackathonEvent().getId();
        int number = round.getRoundNumber();
        if (number <= 1) {
            return null;
        }
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundNumber() == number - 1)
                .findFirst()
                .orElse(null);
    }
}
