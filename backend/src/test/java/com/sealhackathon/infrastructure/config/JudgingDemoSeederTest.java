package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JudgingDemoSeederTest {

    @Mock private HackathonEventRepository eventRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private UserRepository userRepository;
    @Mock private ScoringTemplateRepository scoringTemplateRepository;
    @Mock private CriteriaRepository criteriaRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private SubmissionVersionRepository submissionVersionRepository;
    @Mock private TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    @Mock private JudgeScoreRepository judgeScoreRepository;

    @InjectMocks private JudgingDemoSeeder judgingDemoSeeder;

    @Test
    void seedIfMissing_shouldSeedCriteriaAssignmentsAndScore_forFallDemoEvent() {
        UUID eventId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID judgeId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder()
                .name(EventDemoSeeder.DEMO_EVENT_NAME_FALL)
                .season("Fall")
                .year(2026)
                .scoringTemplateId(templateId)
                .status(EventStatus.OPEN)
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 11, 30))
                .registrationDeadline(LocalDate.of(2026, 8, 31))
                .build();
        event.setId(eventId);

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(LocalDateTime.of(2026, 10, 1, 8, 0))
                .endDate(LocalDateTime.of(2026, 10, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 10, 14, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 10, 15, 23, 59))
                .advancementCutoff(10)
                .build();
        round.setId(roundId);

        Team team = Team.builder()
                .eventId(eventId)
                .name("Team Alpha")
                .leaderId(leaderId)
                .status(TeamStatus.CONFIRMED)
                .build();
        team.setId(teamId);

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
                .round(round)
                .name("Technical")
                .weight(50)
                .sortOrder(0)
                .minScore(1)
                .maxScore(5)
                .build();
        savedCriteria.setId(UUID.randomUUID());

        User lecturer1 = User.builder().email("lecturer1@fpt.edu.vn").build();
        lecturer1.setId(judgeId);

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)).thenReturn(List.of(round));
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(userRepository.findByEmail("lecturer1@fpt.edu.vn")).thenReturn(Optional.of(lecturer1));
        when(userRepository.findByEmail("lecturer2@fpt.edu.vn")).thenReturn(Optional.empty());
        when(criteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId))
                .thenReturn(List.of())
                .thenReturn(List.of(savedCriteria));
        when(scoringTemplateRepository.findById(templateId)).thenReturn(Optional.of(template));
        when(criteriaRepository.save(any(Criteria.class))).thenReturn(savedCriteria);
        when(submissionRepository.findByTeamIdAndRoundId(teamId, roundId)).thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> {
            Submission s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
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
        when(teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(teamId, roundId, judgeId))
                .thenReturn(false);
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(any(), any())).thenReturn(Optional.empty());
        when(judgeScoreRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        judgingDemoSeeder.seedIfMissing();

        verify(criteriaRepository).save(any(Criteria.class));
        verify(teamJudgeAssignmentRepository).save(any(TeamJudgeAssignment.class));
        verify(judgeScoreRepository).save(any());

        ArgumentCaptor<Criteria> criteriaCaptor = ArgumentCaptor.forClass(Criteria.class);
        verify(criteriaRepository).save(criteriaCaptor.capture());
        assertThat(criteriaCaptor.getValue().getMinScore()).isEqualTo(1);
        assertThat(criteriaCaptor.getValue().getMaxScore()).isEqualTo(5);
    }

    @Test
    void seedIfMissing_shouldNoOp_whenFallEventMissing() {
        when(eventRepository.findAll()).thenReturn(List.of());

        judgingDemoSeeder.seedIfMissing();

        verify(criteriaRepository, never()).save(any());
        verify(teamJudgeAssignmentRepository, never()).save(any());
    }
}
