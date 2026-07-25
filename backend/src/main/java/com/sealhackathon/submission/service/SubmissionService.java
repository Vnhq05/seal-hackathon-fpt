package com.sealhackathon.submission.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.storage.FileStorageService;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.dto.snapshot.TrackSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.ranking.service.FinalistSelectionService;
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
import com.sealhackathon.submission.validation.HttpUrlValidator;
import com.sealhackathon.submission.validation.SourceCodeUrlValidator;
import com.sealhackathon.submission.validation.SubmissionFileValidator;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository versionRepository;
    private final SubmissionAttachmentRepository attachmentRepository;
    private final TeamPublicService teamPublicService;
    private final EventPublicService eventPublicService;
    private final SourceCodeUrlValidator sourceCodeUrlValidator;
    private final HttpUrlValidator httpUrlValidator;
    private final SubmissionFileValidator submissionFileValidator;
    private final FinalistSelectionService finalistSelectionService;
    private final FileStorageService fileStorageService;
    private final JudgeAssignmentService judgeAssignmentService;
    private final ApplicationEventPublisher eventPublisher;

    // ── BR-25, BR-31, BR-32: Create or re-submit ──
    @Transactional
    public SubmissionResponse submit(UUID currentUserId, UUID roundId,
                                     CreateSubmissionRequest request, MultipartFile file) {
        RoundSnapshot roundSnapshot = eventPublicService.getRound(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        validatePartialSubmission(roundSnapshot, request, file);

        String requestSourceUrl = resolveSourceUrlOptional(request);
        if (requestSourceUrl != null) {
            sourceCodeUrlValidator.validate(requestSourceUrl);
        }

        String requestOtherUrl = resolveOtherUrlOptional(request);
        if (requestOtherUrl != null) {
            httpUrlValidator.validate(requestOtherUrl, "Other URL");
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

        if (roundSnapshot.getRoundType() == RoundType.FINAL) {
            throw new BusinessException(
                    "Final round reuses the previous round's submission. Teams cannot submit a new proposal.",
                    HttpStatus.FORBIDDEN) {};
        }

        // BR-32: only submit while round is in progress
        validateRoundInProgress(roundSnapshot);

        // Find or create submission
        Submission submission = submissionRepository.findByTeamIdAndRoundId(team.getId(), roundId)
                .orElse(null);

        boolean isNew = (submission == null);
        boolean hasFile = file != null && !file.isEmpty();

        submissionFileValidator.validateOptional(file);

        if (isNew) {
            submission = Submission.builder()
                    .teamId(team.getId())
                    .roundId(roundId)
                    .submittedBy(currentUserId)
                    .status(SubmissionStatus.SUBMITTED)
                    .build();
            submission = submissionRepository.save(submission);
        }

        // BR-30: create new version (append-only), merging artifacts from previous version
        SubmissionVersion previousVersion = resolvePreviousVersion(submission);

        String slideUrl = coalesceNonBlank(
                trimToNull(request.getSlideUrl()), previousVersion != null ? previousVersion.getSlideUrl() : null);
        String sourceUrl = coalesceNonBlank(requestSourceUrl,
                previousVersion != null ? previousVersion.getGithubUrl() : null);
        String otherUrl = coalesceNonBlank(requestOtherUrl,
                previousVersion != null
                        ? coalesceNonBlank(previousVersion.getOtherUrl(), previousVersion.getDemoUrl())
                        : null);
        // Keep demoUrl in sync for legacy readers: prefer explicit other, else previous demo
        String demoUrl = otherUrl;

        if (!isNew && previousVersion != null && !hasFile
                && urlsUnchanged(previousVersion, slideUrl, sourceUrl, otherUrl)) {
            return toResponse(submission);
        }

        int nextVersion = versionRepository.findMaxVersionNumber(submission.getId()) + 1;

        SubmissionVersion version = SubmissionVersion.builder()
                .submission(submission)
                .versionNumber(nextVersion)
                .githubUrl(sourceUrl)
                .slideUrl(slideUrl)
                .otherUrl(otherUrl)
                .demoUrl(demoUrl)
                .submittedAt(LocalDateTime.now())
                .build();
        final SubmissionVersion savedVersion = versionRepository.save(version);

        if (hasFile) {
            String fileUrl = fileStorageService.storeSubmissionFile(file, submission.getId(), nextVersion);
            String originalName = file.getOriginalFilename();
            SubmissionAttachment attachment = SubmissionAttachment.builder()
                    .submissionVersion(savedVersion)
                    .fileName(originalName != null && !originalName.isBlank() ? originalName : "attachment.bin")
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .pageCount(null)
                    .contentType(file.getContentType())
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
                            .contentType(prev.getContentType())
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
                                                          UserType requesterRole, UUID trackId) {
        List<Submission> submissions = submissionRepository.findByRoundId(roundId);
        RoundSnapshot round = eventPublicService.getRound(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        Map<UUID, String> trackNames = trackNameMap(round.getEventId());

        if (requesterRole == UserType.SYSTEM_ADMIN || requesterRole == UserType.EVENT_COORDINATOR) {
            return filterAndMap(submissions, trackId, trackNames);
        }

        if (requesterRole == UserType.FPT_STUDENT || requesterRole == UserType.EXTERNAL_STUDENT) {
            TeamSnapshot team = teamPublicService.getTeamByParticipantAndEvent(
                            requesterId, round.getEventId())
                    .orElseThrow(() -> new BusinessException(
                            "You are not a member of any team in this event",
                            HttpStatus.FORBIDDEN) {});
            return submissions.stream()
                    .filter(s -> s.getTeamId().equals(team.getId()))
                    .map(s -> toResponse(s, trackNames))
                    .toList();
        }

        if (requesterRole == UserType.LECTURER) {
            return submissions.stream()
                    .filter(s -> canLecturerViewSubmission(requesterId, roundId, s.getTeamId()))
                    .map(s -> toResponse(s, trackNames))
                    .filter(r -> trackId == null || trackId.equals(r.getTrackId()))
                    .toList();
        }

        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    // ── BR-33: Mentor can view team submissions ──
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByMentor(UUID mentorId, UUID eventId, UUID roundId) {
        Map<UUID, String> trackNames = trackNameMap(eventId);
        List<TeamSnapshot> teams = teamPublicService.getTeamsByMentor(mentorId, eventId);
        return teams.stream()
                .flatMap(team -> submissionRepository.findByTeamId(team.getId()).stream())
                .filter(s -> s.getRoundId().equals(roundId))
                .map(s -> toResponse(s, trackNames))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionVersionResponse> getVersionHistory(UUID roundId, UUID submissionId,
                                                             UUID requesterId, UserType requesterRole) {
        Submission submission = getSubmission(submissionId);
        if (!submission.getRoundId().equals(roundId)) {
            throw new ResourceNotFoundException("Submission", "id", submissionId);
        }
        assertSubmissionReadAccess(submission, roundId, requesterId, requesterRole);
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
            if (!canLecturerViewSubmission(requesterId, roundId, submission.getTeamId())) {
                throw new BusinessException(
                        "You are not assigned to score this team for this round",
                        HttpStatus.FORBIDDEN) {};
            }
            return;
        }

        throw new BusinessException("Access denied", HttpStatus.FORBIDDEN) {};
    }

    private boolean canLecturerViewSubmission(UUID requesterId, UUID roundId, UUID teamId) {
        if (teamPublicService.isMentorOfTeam(requesterId, teamId)) {
            return true;
        }
        return teamPublicService.getTeam(teamId)
                .map(team -> judgeAssignmentService.isJudgeAssignedToSubmissionScope(
                        roundId, requesterId, team.getTrackId(), team.getGroupId()))
                .orElse(false);
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
        Map<UUID, String> trackNames = Map.of();
        OptionalTeamContext ctx = resolveTeamContext(submission.getTeamId());
        if (ctx.eventId() != null) {
            trackNames = trackNameMap(ctx.eventId());
        }
        return toResponse(submission, trackNames);
    }

    private SubmissionResponse toResponse(Submission submission, Map<UUID, String> trackNames) {
        List<SubmissionVersion> versions = versionRepository
                .findBySubmissionIdOrderByVersionNumberDesc(submission.getId());

        SubmissionVersionResponse latestVersion = null;
        int currentVersionNum = 0;

        if (!versions.isEmpty()) {
            SubmissionVersion latest = versions.get(0);
            latestVersion = toVersionResponse(latest);
            currentVersionNum = latest.getVersionNumber();
        }

        OptionalTeamContext teamCtx = resolveTeamContext(submission.getTeamId());
        String trackName = teamCtx.trackId() != null
                ? trackNames.get(teamCtx.trackId())
                : null;

        return SubmissionResponse.builder()
                .id(submission.getId())
                .teamId(submission.getTeamId())
                .teamName(teamCtx.teamName())
                .trackId(teamCtx.trackId())
                .trackName(trackName)
                .roundId(submission.getRoundId())
                .status(submission.getStatus())
                .submittedBy(submission.getSubmittedBy())
                .currentVersion(currentVersionNum)
                .totalVersions(versions.size())
                .latestVersion(latestVersion)
                .createdAt(submission.getCreatedAt())
                .build();
    }

    private List<SubmissionResponse> filterAndMap(List<Submission> submissions,
                                                    UUID trackId,
                                                    Map<UUID, String> trackNames) {
        return submissions.stream()
                .map(s -> toResponse(s, trackNames))
                .filter(r -> trackId == null || trackId.equals(r.getTrackId()))
                .toList();
    }

    private Map<UUID, String> trackNameMap(UUID eventId) {
        if (eventId == null) {
            return Map.of();
        }
        return eventPublicService.getTracksByEvent(eventId).stream()
                .collect(Collectors.toMap(TrackSnapshot::getId, TrackSnapshot::getName, (a, b) -> a, HashMap::new));
    }

    private OptionalTeamContext resolveTeamContext(UUID teamId) {
        return teamPublicService.getTeam(teamId)
                .map(t -> new OptionalTeamContext(t.getName(), t.getTrackId(), t.getEventId()))
                .orElse(new OptionalTeamContext(null, null, null));
    }

    private record OptionalTeamContext(String teamName, UUID trackId, UUID eventId) {}

    private SubmissionVersionResponse toVersionResponse(SubmissionVersion v) {
        List<AttachmentResponse> attachments = attachmentRepository
                .findBySubmissionVersionId(v.getId()).stream()
                .map(a -> AttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .pageCount(a.getPageCount())
                        .contentType(a.getContentType())
                        .build())
                .toList();

        String sourceCodeUrl = v.getGithubUrl();
        String otherUrl = coalesceNonBlank(v.getOtherUrl(), v.getDemoUrl());

        return SubmissionVersionResponse.builder()
                .id(v.getId())
                .versionNumber(v.getVersionNumber())
                .sourceCodeUrl(sourceCodeUrl)
                .githubUrl(sourceCodeUrl)
                .slideUrl(v.getSlideUrl())
                .otherUrl(otherUrl)
                .demoUrl(v.getDemoUrl())
                .submittedAt(v.getSubmittedAt())
                .attachments(attachments)
                .build();
    }

    private void validatePartialSubmission(RoundSnapshot round,
                                           CreateSubmissionRequest request,
                                           MultipartFile file) {
        boolean hasSlide = request.getSlideUrl() != null && !request.getSlideUrl().isBlank();
        boolean hasSource = resolveSourceUrlOptional(request) != null;
        boolean hasOtherUrl = resolveOtherUrlOptional(request) != null;
        boolean hasFile = file != null && !file.isEmpty();

        if (!hasSlide && !hasSource && !hasOtherUrl && !hasFile) {
            throw new BusinessException(
                    "At least one submission part is required (slide, GitHub, or other link/file)",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (round.getSubmissionDeadline() != null
                && LocalDateTime.now().isAfter(round.getSubmissionDeadline())) {
            throw new BusinessException(
                    "Submission deadline passed at " + round.getSubmissionDeadline(),
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private SubmissionVersion resolvePreviousVersion(Submission submission) {
        if (submission.getCurrentVersionId() != null) {
            return versionRepository.findById(submission.getCurrentVersionId()).orElse(null);
        }
        return versionRepository.findBySubmissionIdOrderByVersionNumberDesc(submission.getId()).stream()
                .findFirst()
                .orElse(null);
    }

    private static String coalesceNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }
        return fallback;
    }

    private static boolean urlsUnchanged(SubmissionVersion previous,
                                         String slideUrl, String sourceUrl, String otherUrl) {
        String previousOther = coalesceNonBlank(previous.getOtherUrl(), previous.getDemoUrl());
        return Objects.equals(trimToNull(previous.getSlideUrl()), trimToNull(slideUrl))
                && Objects.equals(trimToNull(previous.getGithubUrl()), trimToNull(sourceUrl))
                && Objects.equals(trimToNull(previousOther), trimToNull(otherUrl));
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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

    private String resolveOtherUrlOptional(CreateSubmissionRequest request) {
        if (request.getOtherUrl() != null && !request.getOtherUrl().isBlank()) {
            return request.getOtherUrl().trim();
        }
        if (request.getDemoUrl() != null && !request.getDemoUrl().isBlank()) {
            return request.getDemoUrl().trim();
        }
        return null;
    }
}
