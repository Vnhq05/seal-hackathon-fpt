package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.judging.service.JudgingService;
import com.sealhackathon.ranking.domain.FinalistSelection;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.ranking.service.AggregationService;
import com.sealhackathon.ranking.service.FinalistSelectionService;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublishReadyDemoSeederTest {

    @Mock private HackathonEventRepository eventRepository;
    @Mock private DemoRoundTypeSync demoRoundTypeSync;
    @Mock private JudgingDemoSeeder judgingDemoSeeder;
    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private UserRepository userRepository;
    @Mock private CriteriaRepository criteriaRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    @Mock private JudgeScoreRepository judgeScoreRepository;
    @Mock private PublishedResultRepository publishedResultRepository;
    @Mock private RankingRepository rankingRepository;
    @Mock private FinalistSelectionRepository finalistSelectionRepository;
    @Mock private AggregationService aggregationService;
    @Mock private JudgingService judgingService;
    @Mock private FinalistSelectionService finalistSelectionService;

    @InjectMocks private PublishReadyDemoSeeder publishReadyDemoSeeder;

    @Test
    void seedIfReady_shouldSeedScoresRecalculateAndLock_forPreliminaryAndFinal() {
        UUID eventId = UUID.randomUUID();
        UUID preliminaryRoundId = UUID.randomUUID();
        UUID finalRoundId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID finalSubmissionId = UUID.randomUUID();
        UUID judgeId = UUID.randomUUID();
        UUID criteriaId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder()
                .name(EventDemoSeeder.DEMO_EVENT_NAME_FALL)
                .season("Fall")
                .year(2026)
                .status(EventStatus.ACTIVE)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();
        event.setId(eventId);

        Round preliminary = Round.builder().name("Round One").roundNumber(1).roundType(RoundType.PRELIMINARY).build();
        preliminary.setId(preliminaryRoundId);
        Round finalRound = Round.builder().name("Final Round").roundNumber(2).roundType(RoundType.FINAL).build();
        finalRound.setId(finalRoundId);

        Team team = Team.builder().name("Team Alpha").status(TeamStatus.CONFIRMED).build();
        team.setId(teamId);

        Submission preliminarySubmission = Submission.builder()
                .teamId(teamId)
                .roundId(preliminaryRoundId)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        preliminarySubmission.setId(submissionId);

        Submission finalSubmission = Submission.builder()
                .teamId(teamId)
                .roundId(finalRoundId)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        finalSubmission.setId(finalSubmissionId);

        Criteria criteria = Criteria.builder().name("Innovation").sortOrder(0).minScore(1).maxScore(5).build();
        criteria.setId(criteriaId);

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(demoRoundTypeSync.syncAndReload(eventId)).thenReturn(List.of(preliminary, finalRound));
        when(judgingDemoSeeder.ensureFinalRound(eq(event), any(), any()))
                .thenReturn(List.of(preliminary, finalRound));
        when(publishedResultRepository.existsByRoundId(preliminaryRoundId)).thenReturn(false);
        when(publishedResultRepository.existsByRoundId(finalRoundId)).thenReturn(false);
        when(criteriaRepository.findByRoundIdOrderBySortOrderAsc(preliminaryRoundId)).thenReturn(List.of(criteria));
        when(criteriaRepository.findByRoundIdOrderBySortOrderAsc(finalRoundId)).thenReturn(List.of(criteria));
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(submissionRepository.findByRoundId(preliminaryRoundId)).thenReturn(List.of(preliminarySubmission));
        when(submissionRepository.findByRoundId(finalRoundId)).thenReturn(List.of(finalSubmission));
        when(teamJudgeAssignmentRepository.findByTeamIdAndRoundId(teamId, preliminaryRoundId))
                .thenReturn(List.of(assignment(teamId, preliminaryRoundId, judgeId)));
        when(teamJudgeAssignmentRepository.findByTeamIdAndRoundId(teamId, finalRoundId))
                .thenReturn(List.of(assignment(teamId, finalRoundId, judgeId)));
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, submissionId))
                .thenReturn(Optional.empty());
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, finalSubmissionId))
                .thenReturn(Optional.empty());
        when(rankingRepository.findMaxVersionByRoundId(preliminaryRoundId)).thenReturn(1);
        when(rankingRepository.findMaxVersionByRoundId(finalRoundId)).thenReturn(0, 1);
        when(judgeScoreRepository.existsByRoundIdAndStatus(preliminaryRoundId, ScoreStatus.LOCKED)).thenReturn(false);
        when(judgeScoreRepository.existsByRoundIdAndStatus(finalRoundId, ScoreStatus.LOCKED)).thenReturn(false);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(eventId))
                .thenReturn(List.of(FinalistSelection.builder().eventId(eventId).teamId(teamId).preliminaryRank(1).build()));
        when(userRepository.findByEmail("student6@fpt.edu.vn"))
                .thenReturn(Optional.of(User.builder().email("student6@fpt.edu.vn").build()));

        publishReadyDemoSeeder.seedIfReady();

        verify(judgeScoreRepository, atLeastOnce()).save(any());
        verify(aggregationService).recalculate(finalRoundId);
        verify(judgingService).lockScoresForRound(preliminaryRoundId);
        verify(judgingService).lockScoresForRound(finalRoundId);
        verify(eventRepository).save(event);
        assertThat(event.getStatus()).isEqualTo(EventStatus.SCORING);
    }

    @Test
    void seedIfReady_shouldSkipPublishedRound_butStillSeedOtherRounds() {
        UUID eventId = UUID.randomUUID();
        UUID preliminaryRoundId = UUID.randomUUID();
        UUID finalRoundId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID finalSubmissionId = UUID.randomUUID();
        UUID judgeId = UUID.randomUUID();
        UUID criteriaId = UUID.randomUUID();

        HackathonEvent event = HackathonEvent.builder()
                .name(EventDemoSeeder.DEMO_EVENT_NAME_FALL)
                .season("Fall")
                .year(2026)
                .status(EventStatus.SCORING)
                .build();
        event.setId(eventId);

        Round preliminary = Round.builder().name("Round One").roundNumber(1).roundType(RoundType.PRELIMINARY).build();
        preliminary.setId(preliminaryRoundId);
        Round finalRound = Round.builder().name("Final Round").roundNumber(2).roundType(RoundType.FINAL).build();
        finalRound.setId(finalRoundId);

        Team team = Team.builder().name("Team Alpha").status(TeamStatus.CONFIRMED).build();
        team.setId(teamId);

        Submission finalSubmission = Submission.builder()
                .teamId(teamId)
                .roundId(finalRoundId)
                .status(SubmissionStatus.SUBMITTED)
                .build();
        finalSubmission.setId(finalSubmissionId);

        Criteria criteria = Criteria.builder().name("Innovation").sortOrder(0).minScore(1).maxScore(5).build();
        criteria.setId(criteriaId);

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(demoRoundTypeSync.syncAndReload(eventId)).thenReturn(List.of(preliminary, finalRound));
        when(judgingDemoSeeder.ensureFinalRound(eq(event), any(), any()))
                .thenReturn(List.of(preliminary, finalRound));
        when(publishedResultRepository.existsByRoundId(preliminaryRoundId)).thenReturn(true);
        when(publishedResultRepository.existsByRoundId(finalRoundId)).thenReturn(false);
        when(criteriaRepository.findByRoundIdOrderBySortOrderAsc(finalRoundId)).thenReturn(List.of(criteria));
        when(teamRepository.findByEventId(eventId)).thenReturn(List.of(team));
        when(submissionRepository.findByRoundId(finalRoundId)).thenReturn(List.of(finalSubmission));
        when(teamJudgeAssignmentRepository.findByTeamIdAndRoundId(teamId, finalRoundId))
                .thenReturn(List.of(assignment(teamId, finalRoundId, judgeId)));
        when(judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, finalSubmissionId))
                .thenReturn(Optional.empty());
        when(rankingRepository.findMaxVersionByRoundId(preliminaryRoundId)).thenReturn(1);
        when(rankingRepository.findMaxVersionByRoundId(finalRoundId)).thenReturn(0, 1);
        when(judgeScoreRepository.existsByRoundIdAndStatus(finalRoundId, ScoreStatus.LOCKED)).thenReturn(false);
        when(finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(eventId))
                .thenReturn(List.of(FinalistSelection.builder().eventId(eventId).teamId(teamId).preliminaryRank(1).build()));

        publishReadyDemoSeeder.seedIfReady();

        verify(judgeScoreRepository, atLeastOnce()).save(any());
        verify(aggregationService).recalculate(finalRoundId);
        verify(judgingService).lockScoresForRound(finalRoundId);
        verify(judgingService, never()).lockScoresForRound(preliminaryRoundId);
    }

    private TeamJudgeAssignment assignment(UUID teamId, UUID roundId, UUID judgeId) {
        return TeamJudgeAssignment.builder()
                .teamId(teamId)
                .roundId(roundId)
                .judgeUserId(judgeId)
                .assignedAt(LocalDateTime.now())
                .build();
    }
}
