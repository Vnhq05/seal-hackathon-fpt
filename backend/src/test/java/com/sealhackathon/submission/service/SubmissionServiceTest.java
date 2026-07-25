package com.sealhackathon.submission.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.ranking.service.FinalistSelectionService;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.request.CreateSubmissionRequest;
import com.sealhackathon.submission.dto.response.SubmissionResponse;
import com.sealhackathon.submission.event.SubmissionUpdatedEvent;
import com.sealhackathon.submission.repository.SubmissionAttachmentRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.submission.validation.HttpUrlValidator;
import com.sealhackathon.submission.validation.SubmissionFileValidator;
import com.sealhackathon.submission.validation.SourceCodeUrlValidator;
import com.sealhackathon.common.storage.FileStorageService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private SubmissionVersionRepository versionRepository;
    @Mock private SubmissionAttachmentRepository attachmentRepository;
    @Mock private TeamPublicService teamPublicService;
    @Mock private EventPublicService eventPublicService;
    @Mock private SourceCodeUrlValidator sourceCodeUrlValidator;
    @Mock private HttpUrlValidator httpUrlValidator;
    @Mock private SubmissionFileValidator submissionFileValidator;
    @Mock private FileStorageService fileStorageService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private FinalistSelectionService finalistSelectionService;
    @Mock private JudgeAssignmentService judgeAssignmentService;

    @InjectMocks private SubmissionService submissionService;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TEAM_ID = UUID.randomUUID();
    private static final UUID EVENT_ID = UUID.randomUUID();
    private static final UUID ROUND_ID = UUID.randomUUID();

    @Test
    void submit_shouldCreateNewSubmission_whenFirst() {
        setupValidSubmissionContext(false);
        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(i -> {
            Submission s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(versionRepository.findMaxVersionNumber(any())).thenReturn(0);
        when(versionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(attachmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(any())).thenReturn(List.of());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(2)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        SubmissionResponse result = submissionService.submit(USER_ID, ROUND_ID, request, pdf);

        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
        verify(eventPublisher).publishEvent(any(Object.class));
        verify(submissionFileValidator).validateOptional(pdf);
    }

    @Test
    void submit_shouldCreateSlideOnlySubmission_forSealMilestone1WithoutPdf() {
        LocalDateTime slideDeadline = LocalDateTime.now().plusHours(2);
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID)
                .roundType(RoundType.PRELIMINARY)
                .slideDeadline(slideDeadline)
                .submissionDeadline(slideDeadline.plusHours(4))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));

        TeamSnapshot team = TeamSnapshot.builder().id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(true);
        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(i -> {
            Submission s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(versionRepository.findMaxVersionNumber(any())).thenReturn(0);
        SubmissionVersion savedVersion = SubmissionVersion.builder()
                .versionNumber(1)
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .submittedAt(LocalDateTime.now())
                .build();
        savedVersion.setId(UUID.randomUUID());
        when(versionRepository.save(any())).thenReturn(savedVersion);
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(any()))
                .thenReturn(List.of(savedVersion));

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .build();

        SubmissionResponse result = submissionService.submit(USER_ID, ROUND_ID, request, null);

        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
        verify(submissionFileValidator).validateOptional(null);
        verify(sourceCodeUrlValidator, never()).validate(any());
    }

    @Test
    void submit_shouldAllowSlideOnly_afterSlideGateClosed() {
        LocalDateTime slideDeadline = LocalDateTime.now().minusHours(1);
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID)
                .roundType(RoundType.PRELIMINARY)
                .slideDeadline(slideDeadline)
                .submissionDeadline(LocalDateTime.now().plusHours(2))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));

        TeamSnapshot team = TeamSnapshot.builder().id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(true);
        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(i -> {
            Submission s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(versionRepository.findMaxVersionNumber(any())).thenReturn(0);
        SubmissionVersion savedVersion = SubmissionVersion.builder()
                .versionNumber(1)
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .submittedAt(LocalDateTime.now())
                .build();
        savedVersion.setId(UUID.randomUUID());
        when(versionRepository.save(any())).thenReturn(savedVersion);
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(any()))
                .thenReturn(List.of(savedVersion));

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .build();

        SubmissionResponse result = submissionService.submit(USER_ID, ROUND_ID, request, null);

        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
    }

    @Test
    void submit_shouldRejectEmptyRequest() {
        setupRoundContext(false);

        assertThatThrownBy(() -> submissionService.submit(
                USER_ID, ROUND_ID, CreateSubmissionRequest.builder().build(), null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("At least one submission part");
    }

    @Test
    void submit_shouldMergeDemoWithPreviousVersion() {
        setupValidSubmissionContext(false);

        UUID submissionId = UUID.randomUUID();
        UUID previousVersionId = UUID.randomUUID();
        Submission existing = Submission.builder()
                .teamId(TEAM_ID).roundId(ROUND_ID).submittedBy(USER_ID)
                .status(SubmissionStatus.SUBMITTED)
                .currentVersionId(previousVersionId)
                .build();
        existing.setId(submissionId);

        SubmissionVersion previous = SubmissionVersion.builder()
                .submission(existing)
                .versionNumber(1)
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .githubUrl("https://github.com/user/repo")
                .submittedAt(LocalDateTime.now().minusHours(2))
                .build();
        previous.setId(previousVersionId);

        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.of(existing));
        when(versionRepository.findById(previousVersionId)).thenReturn(Optional.of(previous));
        when(versionRepository.findMaxVersionNumber(submissionId)).thenReturn(1);
        when(versionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(submissionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(submissionId))
                .thenReturn(List.of());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .demoUrl("https://youtube.com/watch?v=abc")
                .build();

        submissionService.submit(USER_ID, ROUND_ID, request, null);

        verify(versionRepository).save(org.mockito.ArgumentMatchers.argThat(version ->
                "https://docs.google.com/presentation/d/abc".equals(version.getSlideUrl())
                        && "https://github.com/user/repo".equals(version.getGithubUrl())
                        && "https://youtube.com/watch?v=abc".equals(version.getDemoUrl())));
    }

    @Test
    void submit_shouldRejectGoogleDriveSource() {
        setupRoundContext(false);
        doThrow(new BusinessException("Google Drive cannot be used as source code repository",
                org.springframework.http.HttpStatus.BAD_REQUEST) {})
                .when(sourceCodeUrlValidator).validate("https://drive.google.com/file/d/abc");

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://drive.google.com/file/d/abc")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Google Drive");
    }
    @Test
    void submit_shouldCreateNewVersion_whenResubmit() {
        setupValidSubmissionContext(false);

        Submission existing = Submission.builder()
                .teamId(TEAM_ID).roundId(ROUND_ID).submittedBy(USER_ID)
                .status(SubmissionStatus.SUBMITTED).build();
        existing.setId(UUID.randomUUID());

        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.of(existing));
        when(versionRepository.findMaxVersionNumber(any())).thenReturn(1);
        when(versionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(attachmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(submissionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(any())).thenReturn(List.of());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "v2.pdf", "application/pdf", new byte[100]);

        submissionService.submit(USER_ID, ROUND_ID, request, pdf);

        verify(versionRepository).findMaxVersionNumber(existing.getId());
        verify(submissionFileValidator).validateOptional(pdf);
    }

    @Test
    void submit_shouldSkipVersionBump_whenUrlsUnchanged() {
        setupValidSubmissionContext(false);

        UUID submissionId = UUID.randomUUID();
        UUID previousVersionId = UUID.randomUUID();
        Submission existing = Submission.builder()
                .teamId(TEAM_ID).roundId(ROUND_ID).submittedBy(USER_ID)
                .status(SubmissionStatus.SUBMITTED)
                .currentVersionId(previousVersionId)
                .build();
        existing.setId(submissionId);

        SubmissionVersion previous = SubmissionVersion.builder()
                .submission(existing)
                .versionNumber(1)
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .submittedAt(LocalDateTime.now().minusHours(2))
                .build();
        previous.setId(previousVersionId);

        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.of(existing));
        when(versionRepository.findById(previousVersionId)).thenReturn(Optional.of(previous));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(submissionId))
                .thenReturn(List.of(previous));

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .build();

        SubmissionResponse result = submissionService.submit(USER_ID, ROUND_ID, request, null);

        assertThat(result.getCurrentVersion()).isEqualTo(1);
        verify(versionRepository, never()).save(any());
        verify(versionRepository, never()).findMaxVersionNumber(any());
        verify(eventPublisher, never()).publishEvent(any(SubmissionUpdatedEvent.class));
    }

    @Test
    void submit_shouldCreateNewVersion_whenUrlChanged() {
        setupValidSubmissionContext(false);

        UUID submissionId = UUID.randomUUID();
        UUID previousVersionId = UUID.randomUUID();
        Submission existing = Submission.builder()
                .teamId(TEAM_ID).roundId(ROUND_ID).submittedBy(USER_ID)
                .status(SubmissionStatus.SUBMITTED)
                .currentVersionId(previousVersionId)
                .build();
        existing.setId(submissionId);

        SubmissionVersion previous = SubmissionVersion.builder()
                .submission(existing)
                .versionNumber(1)
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .submittedAt(LocalDateTime.now().minusHours(2))
                .build();
        previous.setId(previousVersionId);

        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.of(existing));
        when(versionRepository.findById(previousVersionId)).thenReturn(Optional.of(previous));
        when(versionRepository.findMaxVersionNumber(submissionId)).thenReturn(1);
        when(versionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(submissionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(submissionId))
                .thenReturn(List.of());
        when(attachmentRepository.findBySubmissionVersionId(previousVersionId))
                .thenReturn(List.of());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo-v2")
                .build();

        submissionService.submit(USER_ID, ROUND_ID, request, null);

        verify(versionRepository).save(org.mockito.ArgumentMatchers.argThat(version ->
                "https://github.com/user/repo-v2".equals(version.getGithubUrl())
                        && version.getVersionNumber() == 2));
        verify(eventPublisher).publishEvent(any(SubmissionUpdatedEvent.class));
    }

    @Test
    void submit_shouldCreateNewVersion_whenSameUrlsButNewPdf() {
        setupValidSubmissionContext(false);

        UUID submissionId = UUID.randomUUID();
        UUID previousVersionId = UUID.randomUUID();
        Submission existing = Submission.builder()
                .teamId(TEAM_ID).roundId(ROUND_ID).submittedBy(USER_ID)
                .status(SubmissionStatus.SUBMITTED)
                .currentVersionId(previousVersionId)
                .build();
        existing.setId(submissionId);

        SubmissionVersion previous = SubmissionVersion.builder()
                .submission(existing)
                .versionNumber(1)
                .slideUrl("https://docs.google.com/presentation/d/abc")
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .submittedAt(LocalDateTime.now().minusHours(2))
                .build();
        previous.setId(previousVersionId);

        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.of(existing));
        when(versionRepository.findById(previousVersionId)).thenReturn(Optional.of(previous));
        when(versionRepository.findMaxVersionNumber(submissionId)).thenReturn(1);
        when(versionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(attachmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(submissionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(submissionId))
                .thenReturn(List.of());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "v2.pdf", "application/pdf", new byte[100]);

        submissionService.submit(USER_ID, ROUND_ID, request, pdf);

        verify(versionRepository).save(any());
        verify(versionRepository).findMaxVersionNumber(submissionId);
        verify(eventPublisher).publishEvent(any(SubmissionUpdatedEvent.class));
    }

    @Test
    void submit_shouldThrow_whenNotLeader() {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID).build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));

        TeamSnapshot team = TeamSnapshot.builder().id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(false);

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("leader");
    }

    @Test
    void submit_shouldThrow_whenRoundEnded() {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID)
                .startDate(LocalDateTime.now().minusDays(10))
                .endDate(LocalDateTime.now().minusDays(1))
                .build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));

        TeamSnapshot team = TeamSnapshot.builder().id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(true);

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ended");
    }

    @Test
    void submit_shouldThrow_whenSourceUrlInvalid() {
        setupRoundContext(false);
        doThrow(new BusinessException("Invalid source code URL", org.springframework.http.HttpStatus.BAD_REQUEST) {})
                .when(sourceCodeUrlValidator).validate("bad-url");

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("bad-url")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("source code");
    }

    @Test
    void submit_shouldThrow_whenDemoUrlNotWhitelisted() {
        setupRoundContext(false);
        doThrow(new BusinessException("Demo URL not approved", org.springframework.http.HttpStatus.BAD_REQUEST) {})
                .when(httpUrlValidator).validate("https://tiktok.com/video", "Other URL");

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .demoUrl("https://tiktok.com/video")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void submit_shouldThrow_whenNotInTeam() {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID).build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.empty());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .sourceCodeUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not a member");
    }

    private void setupRoundContext(boolean sealFormat) {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));
    }

    private void setupValidSubmissionContext(boolean sealFormat) {
        setupRoundContext(sealFormat);

        TeamSnapshot team = TeamSnapshot.builder()
                .id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(true);
        lenient().when(fileStorageService.storeSubmissionFile(any(), any(), anyInt()))
                .thenReturn("/api/files/submissions/test.pdf");
    }
}
