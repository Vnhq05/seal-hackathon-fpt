package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.EventJudgeAssignmentRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JudgingDemoSeederTest {

    @Mock private HackathonEventRepository eventRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private UserRepository userRepository;
    @Mock private JudgeAssignmentRepository judgeAssignmentRepository;
    @Mock private EventJudgeAssignmentRepository eventJudgeAssignmentRepository;
    @Mock private ScoringTemplateRepository scoringTemplateRepository;
    @Mock private CriteriaRepository criteriaRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private SubmissionVersionRepository submissionVersionRepository;
    @Mock private TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;

    @InjectMocks private JudgingDemoSeeder judgingDemoSeeder;

    @Test
    void seedIfMissing_shouldSeedCriteriaSubmissionsAndJudges_forAllRounds() {
        UUID eventId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        UUID roundOneId = UUID.randomUUID();
        UUID finalRoundId = UUID.randomUUID();
        UUID alphaId = UUID.randomUUID();
        UUID betaId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        UUID judgeId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder()
                .name(EventDemoSeeder.DEMO_EVENT_NAME_FALL)
                .season("Fall")
                .year(2026)
                .scoringTemplateId(templateId)
                .status(EventStatus.OPEN)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 1))
                .build();
        event.setId(eventId);

        Round roundOne = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(LocalDateTime.of(2020, 1, 1, 8, 0))
                .endDate(LocalDateTime.of(2020, 1, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2020, 1, 14, 23, 59))
                .scoringDeadline(LocalDateTime.of(2020, 1, 15, 23, 59))
                .advancementCutoff(10)
                .build();
        roundOne.setId(roundOneId);

        Round finalRound = Round.builder()
                .hackathonEvent(event)
                .roundNumber(2)
                .name("Final Round")
                .startDate(LocalDateTime.of(2020, 2, 1, 8, 0))
                .endDate(LocalDateTime.of(2020, 2, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2020, 2, 14, 23, 59))
                .scoringDeadline(LocalDateTime.of(2020, 2, 15, 23, 59))
                .advancementCutoff(6)
                .build();
        finalRound.setId(finalRoundId);

        Team alpha = Team.builder()
                .eventId(eventId)
                .name("Team Alpha")
                .leaderId(leaderId)
                .status(TeamStatus.CONFIRMED)
                .build();
        alpha.setId(alphaId);
        Team beta = Team.builder()
                .eventId(eventId)
                .name("Team Beta")
                .leaderId(leaderId)
                .status(TeamStatus.FORMING)
                .build();
        beta.setId(betaId);

        ScoringTemplate template = ScoringTemplate.builder()
                .name("Standard Hackathon")
                .build();
        template.setId(templateId);
        ScoringTemplateCriterion tc = ScoringTemplateCriterion.builder()
                .scoringTemplate(template)
                .name("Technical")
                .description("Code quality")
                .weight(50)
                .sortOrder(0)
                .minScore(0)
                .maxScore(10)
                .build();
        template.getCriteria().add(tc);

        Criteria savedCriteria = Criteria.builder()
                .round(roundOne)
                .name("Technical")
                .weight(50)
                .sortOrder(0)
                .minScore(1)
                .maxScore(5)
                .build();
        savedCriteria.setId(UUID.randomUUID());

        User judge = User.builder().email("lecturer1@fpt.edu.vn").build();
        judge.setId(judgeId);

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId))
                .thenReturn(List.of(roundOne, finalRound));
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(alpha, beta));
        when(userRepository.findByEmail("lecturer1@fpt.edu.vn")).thenReturn(Optional.of(judge));
        when(userRepository.findByEmail("lecturer2@fpt.edu.vn")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("lecturer3@fpt.edu.vn")).thenReturn(Optional.empty());
        when(eventJudgeAssignmentRepository.existsByHackathonEventIdAndJudgeUserId(eventId, judgeId))
                .thenReturn(false);
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundOneId, judgeId))
                .thenReturn(List.of());
        when(judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(finalRoundId, judgeId))
                .thenReturn(List.of());
        when(criteriaRepository.findByRoundIdOrderBySortOrderAsc(any()))
                .thenReturn(List.of());
        when(scoringTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(criteriaRepository.save(any(Criteria.class))).thenReturn(savedCriteria);
        when(submissionRepository.findByTeamIdAndRoundId(any(), any())).thenReturn(Optional.empty());
        when(teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(any(), any(), any()))
                .thenReturn(false);
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> {
            Submission s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(UUID.randomUUID());
            }
            return s;
        });
        when(submissionVersionRepository.save(any())).thenAnswer(inv -> {
            var v = inv.getArgument(0);
            if (v instanceof com.sealhackathon.submission.domain.SubmissionVersion sv) {
                sv.setId(UUID.randomUUID());
                return sv;
            }
            return v;
        });

        judgingDemoSeeder.seedIfMissing();

        verify(eventRepository).save(any(HackathonEvent.class));
        verify(roundRepository, atLeast(2)).save(any(Round.class));
        verify(eventJudgeAssignmentRepository).save(any());
        verify(judgeAssignmentRepository, atLeast(2)).save(any());
        verify(criteriaRepository, atLeast(2)).save(any(Criteria.class));
        verify(submissionRepository, atLeast(2)).save(any(Submission.class));
        verify(teamJudgeAssignmentRepository, atLeast(2)).save(any());

        ArgumentCaptor<Criteria> criteriaCaptor = ArgumentCaptor.forClass(Criteria.class);
        verify(criteriaRepository, atLeast(1)).save(criteriaCaptor.capture());
        assertThat(criteriaCaptor.getValue().getMinScore()).isEqualTo(1);
        assertThat(criteriaCaptor.getValue().getMaxScore()).isEqualTo(5);
    }

    @Test
    void seedIfMissing_shouldNoOp_whenFallEventMissing() {
        when(eventRepository.findAll()).thenReturn(List.of());

        judgingDemoSeeder.seedIfMissing();

        verify(criteriaRepository, never()).save(any());
        verify(submissionRepository, never()).save(any());
        verify(judgeAssignmentRepository, never()).save(any());
    }
}
