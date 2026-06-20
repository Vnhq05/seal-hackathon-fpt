package com.sealhackathon.submission.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.dto.request.CreateSubmissionRequest;
import com.sealhackathon.submission.dto.response.SubmissionResponse;
import com.sealhackathon.submission.repository.SubmissionAttachmentRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.submission.validation.DemoUrlWhitelistValidator;
import com.sealhackathon.submission.validation.GitHubUrlValidator;
import com.sealhackathon.submission.validation.PdfValidator;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private SubmissionVersionRepository versionRepository;
    @Mock private SubmissionAttachmentRepository attachmentRepository;
    @Mock private TeamPublicService teamPublicService;
    @Mock private EventPublicService eventPublicService;
    @Mock private GitHubUrlValidator gitHubUrlValidator;
    @Mock private DemoUrlWhitelistValidator demoUrlValidator;
    @Mock private PdfValidator pdfValidator;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private SubmissionService submissionService;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID TEAM_ID = UUID.randomUUID();
    private static final UUID EVENT_ID = UUID.randomUUID();
    private static final UUID ROUND_ID = UUID.randomUUID();

    // ── BR-25, BR-30: First submission creates new submission + version ──

    @Test
    void submit_shouldCreateNewSubmission_whenFirst() {
        setupValidSubmissionContext();
        when(submissionRepository.findByTeamIdAndRoundId(TEAM_ID, ROUND_ID))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(i -> {
            Submission s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(versionRepository.findMaxVersionNumber(any())).thenReturn(0);
        when(versionRepository.save(any())).thenAnswer(i -> {
            var v = i.getArgument(0);
            return v;
        });
        when(attachmentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(versionRepository.findBySubmissionIdOrderByVersionNumberDesc(any())).thenReturn(List.of());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(2)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        SubmissionResponse result = submissionService.submit(USER_ID, ROUND_ID, request, pdf);

        assertThat(result.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    // ── BR-30: Re-submission creates new version, doesn't overwrite ──

    @Test
    void submit_shouldCreateNewVersion_whenResubmit() {
        setupValidSubmissionContext();

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
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "v2.pdf", "application/pdf", new byte[100]);

        submissionService.submit(USER_ID, ROUND_ID, request, pdf);

        verify(versionRepository).findMaxVersionNumber(existing.getId());
    }

    // ── BR-31: Non-leader cannot submit ──

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
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("leader");
    }

    // ── BR-32: Deadline passed ──

    @Test
    void submit_shouldThrow_whenDeadlinePassed() {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID).build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));

        TeamSnapshot team = TeamSnapshot.builder().id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(true);
        when(eventPublicService.getSubmissionDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().minusDays(1));

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("deadline");
    }

    // ── BR-29: Invalid GitHub URL ──

    @Test
    void submit_shouldThrow_whenGitHubUrlInvalid() {
        doThrow(new BusinessException("Invalid GitHub URL", org.springframework.http.HttpStatus.BAD_REQUEST) {})
                .when(gitHubUrlValidator).validate("bad-url");

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .githubUrl("bad-url")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("GitHub");
    }

    // ── BR-28: Demo URL not whitelisted ──

    @Test
    void submit_shouldThrow_whenDemoUrlNotWhitelisted() {
        doThrow(new BusinessException("Demo URL not approved", org.springframework.http.HttpStatus.BAD_REQUEST) {})
                .when(demoUrlValidator).validate("https://tiktok.com/video");

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://tiktok.com/video")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class);
    }

    // ── Not in any team ──

    @Test
    void submit_shouldThrow_whenNotInTeam() {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID).build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.empty());

        CreateSubmissionRequest request = CreateSubmissionRequest.builder()
                .githubUrl("https://github.com/user/repo")
                .demoUrl("https://youtube.com/watch?v=abc")
                .pdfPageCount(1)
                .build();
        MockMultipartFile pdf = new MockMultipartFile("pdf", "doc.pdf", "application/pdf", new byte[100]);

        assertThatThrownBy(() -> submissionService.submit(USER_ID, ROUND_ID, request, pdf))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not a member");
    }

    private void setupValidSubmissionContext() {
        RoundSnapshot round = RoundSnapshot.builder()
                .id(ROUND_ID).eventId(EVENT_ID).build();
        when(eventPublicService.getRound(ROUND_ID)).thenReturn(Optional.of(round));

        TeamSnapshot team = TeamSnapshot.builder()
                .id(TEAM_ID).eventId(EVENT_ID).build();
        when(teamPublicService.getTeamByParticipantAndEvent(USER_ID, EVENT_ID))
                .thenReturn(Optional.of(team));
        when(teamPublicService.isTeamLeader(USER_ID, TEAM_ID)).thenReturn(true);
        when(eventPublicService.getSubmissionDeadline(ROUND_ID))
                .thenReturn(LocalDateTime.now().plusDays(7));
    }
}
