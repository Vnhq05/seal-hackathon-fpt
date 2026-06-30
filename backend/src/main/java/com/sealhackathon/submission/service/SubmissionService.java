package com.sealhackathon.submission.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.storage.FileStorageService;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.service.FinalistSelectionService;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionAttachment;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.request.CreateSubmissionRequest;
import com.sealhackathon.submission.dto.response.AttachmentResponse;
import com.sealhackathon.submission.dto.response.SubmissionResponse;
import com.sealhackathon.submission.dto.response.SubmissionVersionResponse;
import com.sealhackathon.submission.event.SubmissionCreatedEvent;
import com.sealhackathon.submission.event.SubmissionUpdatedEvent;
import com.sealhackathon.submission.repository.SubmissionAttachmentRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.submission.validation.DemoUrlWhitelistValidator;
import com.sealhackathon.submission.validation.GitHubUrlValidator;
import com.sealhackathon.submission.validation.PdfValidator;
import com.sealhackathon.submission.validation.SourceCodeUrlValidator;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository versionRepository;
    private final SubmissionAttachmentRepository attachmentRepository;
    private final TeamPublicService teamPublicService;
    private final EventPublicService eventPublicService;
    private final GitHubUrlValidator gitHubUrlValidator;
    private final SourceCodeUrlValidator sourceCodeUrlValidator;
    private final DemoUrlWhitelistValidator demoUrlValidator;
    private final PdfValidator pdfValidator;
    private final FinalistSelectionService finalistSelectionService;
    private final FileStorageService fileStorageService;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final FormatRuleEngine formatRuleEngine;

    // ── BR-25, BR-31, BR-32: Create or re-submit ──
    @Transactional
    public SubmissionResponse submit(UUID currentUserId, UUID roundId,
                                     CreateSubmissionRequest request, MultipartFile pdfFile) {
        RoundSnapshot roundSnapshot = eventPublicService.getRound(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        validateSealSubmission(roundSnapshot, request);

        String sourceUrl = resolveSourceUrl(request, roundSnapshot);
        if (sourceUrl != null) {
            sourceCodeUrlValidator.validate(sourceUrl);
        }

        if (request.getDemoUrl() != null && !request.getDemoUrl().isBlank()) {
            demoUrlValidator.validate(request.getDemoUrl());
        }

        TeamSnapshot team = teamPublicService.getTeamByParticipantAndEvent(
                        currentUserId, roundSnapshot.getEventId())
                .orElseThrow(() -> new BusinessException(
                        "You are not a member of any team in this event",
                        HttpStatus.FORBIDDEN) {});

        // BR-31: only team leader can submit
        if (!teamPublicService.isTeamLeader(currentUserId, team.getId())) {
            throw new BusinessException("Only the team leader can submit",
                    HttpStatus.FORBIDDEN) {};
        }

        if (roundSnapshot.getRoundType() == RoundType.FINAL
                && !finalistSelectionService.isFinalist(roundSnapshot.getEventId(), team.getId())) {
            throw new BusinessException(
                    "Only finalists can submit for the final round",
                    HttpStatus.FORBIDDEN) {};
        }

        // BR-32: only submit while round is in progress
        validateRoundInProgress(roundSnapshot);

        // Find or create submission
        Submission submission = submissionRepository.findByTeamIdAndRoundId(team.getId(), roundId)
                .orElse(null);

        boolean isNew = (submission == null);
        boolean hasPdf = pdfFile != null && !pdfFile.isEmpty();

        boolean pdfRequired = isNew && isPdfRequiredForSubmit(roundSnapshot);
        pdfValidator.validate(pdfFile, request.getPdfPageCount(), pdfRequired);

        if (isNew) {
            submission = Submission.builder()
                    .teamId(team.getId())
                    .roundId(roundId)
                    .submittedBy(currentUserId)
                    .status(SubmissionStatus.SUBMITTED)
                    .build();
            submission = submissionRepository.save(submission);
        }

        // BR-30: create new version (append-only)
        int nextVersion = versionRepository.findMaxVersionNumber(submission.getId()) + 1;

        SubmissionVersion version = SubmissionVersion.builder()
                .submission(submission)
                .versionNumber(nextVersion)
                .githubUrl(sourceUrl)
                .slideUrl(request.getSlideUrl() != null ? request.getSlideUrl().trim() : null)
                .demoUrl(request.getDemoUrl() != null ? request.getDemoUrl().trim() : null)
                .submittedAt(LocalDateTime.now())
                .build();
        final SubmissionVersion savedVersion = versionRepository.save(version);

        if (hasPdf) {
            String fileUrl = fileStorageService.storeSubmissionPdf(pdfFile, submission.getId(), nextVersion);
            SubmissionAttachment attachment = SubmissionAttachment.builder()
                    .submissionVersion(savedVersion)
                    .fileName(pdfFile.getOriginalFilename())
                    .fileUrl(fileUrl)
                    .fileSize(pdfFile.getSize())
                    .pageCount(request.getPdfPageCount() != null ? request.getPdfPageCount() : 1)
                    .build();
            attachmentRepository.save(attachment);
        } else if (!isNew && submission.getCurrentVersionId() != null) {
            UUID previousVersionId = submission.getCurrentVersionId();
            attachmentRepository.findBySubmissionVersionId(previousVersionId).forEach(prev ->
                    attachmentRepository.save(SubmissionAttachment.builder()
                            .submissionVersion(savedVersion)
                            .fileName(prev.getFileName())
                            .fileUrl(prev.getFileUrl())
                            .fileSize(prev.getFileSize())
                            .pageCount(prev.getPageCount())
                            .build()));
        }

        // Update submission pointer and status
        submission.setCurrentVersionId(savedVersion.getId());
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission = submissionRepository.save(submission);

        if (isNew) {
            eventPublisher.publishEvent(new SubmissionCreatedEvent(
                    submission.getId(), team.getId(), roundId, nextVersion));
        } else {
            eventPublisher.publishEvent(new SubmissionUpdatedEvent(
                    submission.getId(), team.getId(), nextVersion));
        }

        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionById(UUID roundId, UUID submissionId,
                                                UUID requesterId, UserType requesterRole) {
        Submission submission = getSubmission(submissionId);
        if (!submission.getRoundId().equals(roundId)) {
            throw new ResourceNotFoundException("Submission", "id", submissionId);
        }
        assertSubmissionReadAccess(submission, roundId, requesterId, requesterRole);
        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionByTeamAndRound(UUID teamId, UUID roundId,
                                                          UUID requesterId, UserType requesterRole) {
        Submission submission = submissionRepository.findByTeamIdAndRoundId(teamId, roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "team+round",
                        teamId + " / " + roundId));
        assertSubmissionReadAccess(submission, roundId, requesterId, requesterRole);
        return toResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByRound(UUID roundId, UUID requesterId,
                                                          UserType requesterRole) {
        List<Submission> submissions = submissionRepository.findByRoundId(roundId);

        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return submissions.stream().map(this::toResponse).toList();
        }

        RoundSnapshot round = eventPublicService.getRound(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        if (requesterRole == UserType.FPT_STUDENT || requesterRole == UserType.EXTERNAL_STUDENT) {
            TeamSnapshot team = teamPublicService.getTeamByParticipantAndEvent(
                            requesterId, round.getEventId())
                    .orElseThrow(() -> new BusinessException(
                            "You are not a member of any team in this event",
                            HttpStatus.FORBIDDEN) {});
            return submissions.stream()
                    .filter(s -> s.getTeamId().equals(team.getId()))
                    .map(this::toResponse)
                    .toList();
        }

        if (requesterRole == UserType.LECTURER) {
            Set<UUID> allowedTeamIds = new HashSet<>();
            teamJudgeAssignmentRepository.findByJudgeUserId(requesterId).stream()
                    .filter(a -> a.getRoundId().equals(roundId))
                    .map(a -> a.getTeamId())
                    .forEach(allowedTeamIds::add);
            teamPublicService.getTeamsByMentor(requesterId, round.getEventId()).stream()
                    .map(TeamSnapshot::getId)
                    .forEach(allowedTeamIds::add);

            return submissions.stream()
                    .filter(s -> allowedTeamIds.contains(s.getTeamId()))
                    .map(this::toResponse)
                    .toList();
        }

        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    // ── BR-33: Mentor can view team submissions ──
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByMentor(UUID mentorId, UUID eventId, UUID roundId) {
        List<TeamSnapshot> teams = teamPublicService.getTeamsByMentor(mentorId, eventId);
        return teams.stream()
                .flatMap(team -> submissionRepository.findByTeamId(team.getId()).stream())
                .filter(s -> s.getRoundId().equals(roundId))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionVersionResponse> getVersionHistory(UUID roundId, UUID submissionId) {
        Submission submission = getSubmission(submissionId);
        if (!submission.getRoundId().equals(roundId)) {
            throw new ResourceNotFoundException("Submission", "id", submissionId);
        }
        return versionRepository.findBySubmissionIdOrderByVersionNumberDesc(submissionId).stream()
                .map(this::toVersionResponse)
                .toList();
    }

    private void assertSubmissionReadAccess(Submission submission, UUID roundId,
                                            UUID requesterId, UserType requesterRole) {
        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return;
        }

        RoundSnapshot round = eventPublicService.getRound(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        if (requesterRole == UserType.FPT_STUDENT || requesterRole == UserType.EXTERNAL_STUDENT) {
            TeamSnapshot team = teamPublicService.getTeamByParticipantAndEvent(
                            requesterId, round.getEventId())
                    .orElseThrow(() -> new BusinessException(
                            "You are not a member of any team in this event",
                            HttpStatus.FORBIDDEN) {});
            if (!submission.getTeamId().equals(team.getId())) {
                throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
            }
            return;
        }

        if (requesterRole == UserType.LECTURER) {
            boolean assigned = teamJudgeAssignmentRepository
                    .existsByTeamIdAndRoundIdAndJudgeUserId(
                            submission.getTeamId(), roundId, requesterId);
            if (!assigned) {
                throw new BusinessException(
                        "You are not assigned to score this team for this round",
                        HttpStatus.FORBIDDEN) {};
            }
            return;
        }

        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    // ═══ Helpers ═══

    Submission getSubmission(UUID submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));
    }

    private void validateRoundInProgress(RoundSnapshot round) {
        LocalDateTime now = LocalDateTime.now();
        if (round.getStartDate() == null || round.getEndDate() == null) {
            throw new BusinessException("Round schedule is not configured", HttpStatus.BAD_REQUEST) {};
        }
        if (now.isBefore(round.getStartDate())) {
            throw new BusinessException("Round has not started yet", HttpStatus.BAD_REQUEST) {};
        }
        if (now.isAfter(round.getEndDate())) {
            throw new BusinessException("Round has ended", HttpStatus.BAD_REQUEST) {};
        }
    }

    SubmissionResponse toResponse(Submission submission) {
        List<SubmissionVersion> versions = versionRepository
                .findBySubmissionIdOrderByVersionNumberDesc(submission.getId());

        SubmissionVersionResponse latestVersion = null;
        int currentVersionNum = 0;

        if (!versions.isEmpty()) {
            SubmissionVersion latest = versions.get(0);
            latestVersion = toVersionResponse(latest);
            currentVersionNum = latest.getVersionNumber();
        }

        return SubmissionResponse.builder()
                .id(submission.getId())
                .teamId(submission.getTeamId())
                .roundId(submission.getRoundId())
                .status(submission.getStatus())
                .submittedBy(submission.getSubmittedBy())
                .currentVersion(currentVersionNum)
                .totalVersions(versions.size())
                .latestVersion(latestVersion)
                .createdAt(submission.getCreatedAt())
                .build();
    }

    private SubmissionVersionResponse toVersionResponse(SubmissionVersion v) {
        List<AttachmentResponse> attachments = attachmentRepository
                .findBySubmissionVersionId(v.getId()).stream()
                .map(a -> AttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .pageCount(a.getPageCount())
                        .build())
                .toList();

        String sourceCodeUrl = v.getGithubUrl();

        return SubmissionVersionResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .sourceCodeUrl(sourceCodeUrl)
                .githubUrl(sourceCodeUrl)
                .slideUrl(v.getSlideUrl())
                .demoUrl(v.getDemoUrl())
                .submittedAt(v.getSubmittedAt())
                .attachments(attachments)
                .build();
    }

    /**
     * PDF required on first submit for non-SEAL events only (SEAL uses slide instead).
     */
    private boolean isPdfRequiredForSubmit(RoundSnapshot round) {
        return !formatRuleEngine.isSealFormat(round.getEventId());
    }

    private String resolveSourceUrl(CreateSubmissionRequest request, RoundSnapshot round) {
        String url = null;
        if (request.getSourceCodeUrl() != null && !request.getSourceCodeUrl().isBlank()) {
            url = request.getSourceCodeUrl().trim();
        } else if (request.getGithubUrl() != null && !request.getGithubUrl().isBlank()) {
            url = request.getGithubUrl().trim();
        }
        if (url == null && isFullSubmissionPhase(round)) {
            throw new BusinessException("Source code URL is required", HttpStatus.BAD_REQUEST);
        }
        return url;
    }

    private void validateSealSubmission(RoundSnapshot round, CreateSubmissionRequest request) {
        if (!formatRuleEngine.isSealFormat(round.getEventId())) {
            if (request.getDemoUrl() == null || request.getDemoUrl().isBlank()) {
                throw new BusinessException("Demo URL is required", HttpStatus.BAD_REQUEST);
            }
            if (resolveSourceUrlOptional(request) == null) {
                throw new BusinessException("Source code URL is required", HttpStatus.BAD_REQUEST);
            }
            return;
        }

        if (round.getRoundType() != RoundType.PRELIMINARY) {
            if (request.getDemoUrl() == null || request.getDemoUrl().isBlank()) {
                throw new BusinessException("Demo URL is required", HttpStatus.BAD_REQUEST);
            }
            if (resolveSourceUrlOptional(request) == null) {
                throw new BusinessException("Source code URL is required", HttpStatus.BAD_REQUEST);
            }
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        boolean hasSlide = request.getSlideUrl() != null && !request.getSlideUrl().isBlank();
        boolean hasDemo = request.getDemoUrl() != null && !request.getDemoUrl().isBlank();
        boolean hasSource = resolveSourceUrlOptional(request) != null;

        if (round.getSlideDeadline() != null && now.isBefore(round.getSlideDeadline())) {
            if (hasSlide && !hasDemo && !hasSource) {
                return;
            }
        } else if (round.getSlideDeadline() != null && now.isAfter(round.getSlideDeadline())
                && hasSlide && !hasDemo && !hasSource) {
            throw new BusinessException(
                    "Slide submission gate closed at " + round.getSlideDeadline(),
                    HttpStatus.BAD_REQUEST);
        }

        if (round.getSubmissionDeadline() != null && now.isAfter(round.getSubmissionDeadline())) {
            throw new BusinessException(
                    "Demo submission deadline passed at " + round.getSubmissionDeadline(),
                    HttpStatus.BAD_REQUEST);
        }
        if (!hasDemo) {
            throw new BusinessException("Demo URL is required for " + round.getName(), HttpStatus.BAD_REQUEST);
        }
        if (!hasSource) {
            throw new BusinessException("Source code URL is required for " + round.getName(), HttpStatus.BAD_REQUEST);
        }
    }

    private boolean isFullSubmissionPhase(RoundSnapshot round) {
        if (formatRuleEngine.isSealFormat(round.getEventId())
                && round.getRoundType() == RoundType.PRELIMINARY
                && round.getSlideDeadline() != null
                && LocalDateTime.now().isBefore(round.getSlideDeadline())) {
            return false;
        }
        return true;
    }

    private String resolveSourceUrlOptional(CreateSubmissionRequest request) {
        if (request.getSourceCodeUrl() != null && !request.getSourceCodeUrl().isBlank()) {
            return request.getSourceCodeUrl().trim();
        }
        if (request.getGithubUrl() != null && !request.getGithubUrl().isBlank()) {
            return request.getGithubUrl().trim();
        }
        return null;
    }
}
