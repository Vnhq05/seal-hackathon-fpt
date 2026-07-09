package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.JudgeScoreDetail;
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
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class PublishReadyDemoSeeder {

    private static final String DEMO_EVENT_NAME = EventDemoSeeder.DEMO_EVENT_NAME_FALL;
    private static final String FALL = "Fall";
    private static final int YEAR = 2026;
    private static final String BETA_THIRD_MEMBER_EMAIL = "student6@fpt.edu.vn";

    private final HackathonEventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final CriteriaRepository criteriaRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final JudgeScoreRepository judgeScoreRepository;
    private final PublishedResultRepository publishedResultRepository;
    private final RankingRepository rankingRepository;
    private final FinalistSelectionRepository finalistSelectionRepository;
    private final AggregationService aggregationService;
    private final JudgingService judgingService;
    private final FinalistSelectionService finalistSelectionService;
    private final JudgingDemoSeeder judgingDemoSeeder;
    private final DemoRoundTypeSync demoRoundTypeSync;

    @Transactional
    public void seedIfReady() {
        Optional<HackathonEvent> eventOpt = findDemoEvent();
        if (eventOpt.isEmpty()) {
            log.debug("Fall {} demo event not found — skipping publish-ready seed", YEAR);
            return;
        }

        HackathonEvent event = eventOpt.get();
        LocalDateTime now = LocalDateTime.now();
        List<Round> rounds = judgingDemoSeeder.ensureFinalRound(
                event, demoRoundTypeSync.syncAndReload(event.getId()), now);
        if (rounds.isEmpty()) {
            return;
        }

        confirmTeamsForFeedback(event.getId(), now);

        if (event.getStatus() != EventStatus.SCORING && event.getStatus() != EventStatus.COMPLETED) {
            event.setStatus(EventStatus.SCORING);
            eventRepository.save(event);
        }

        List<Team> teams = teamRepository.findByEventId(event.getId()).stream()
                .sorted(Comparator.comparing(Team::getName))
                .toList();

        for (RoundType roundType : List.of(RoundType.PRELIMINARY, RoundType.FINAL)) {
            Round round = rounds.stream()
                    .filter(r -> r.getRoundType() == roundType)
                    .findFirst()
                    .orElse(null);
            if (round == null) {
                continue;
            }
            seedRoundPublishReady(event, round, teams, now);
        }

        log.info("Coordinator {} / {} → /coordinator/livescore/{{eventId}} → Publish Results (Preliminary + Final)",
                EventDemoSeeder.DEV_COORDINATOR_EMAIL, DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT);
        log.info("After both rounds published: mark event COMPLETED → students on confirmed teams can submit feedback at /student/feedback");
        log.info("Student test accounts: {} / {}",
                String.join(", ", DataSeeder.DEMO_TEST_STUDENT_EMAILS), DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT);
    }

    private void seedRoundPublishReady(
            HackathonEvent event, Round round, List<Team> teams, LocalDateTime now) {
        if (publishedResultRepository.existsByRoundId(round.getId())) {
            log.info("Publish demo: '{}' already published — skip score seed", round.getName());
            return;
        }

        if (round.getRoundType() == RoundType.FINAL) {
            if (!prepareFinalRound(event, round, teams, now)) {
                return;
            }
        }

        List<Criteria> criteria = criteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        if (criteria.isEmpty()) {
            log.warn("Publish demo: no criteria on round '{}' — run JudgingDemoSeeder first", round.getName());
            return;
        }

        List<Submission> submissions = submissionRepository.findByRoundId(round.getId()).stream()
                .sorted(Comparator.comparing(s -> teamNameForSubmission(teams, s)))
                .toList();
        if (submissions.isEmpty()) {
            log.warn("Publish demo: no submissions on '{}' — cannot seed scores", round.getName());
            return;
        }

        int scoresCreated = 0;
        for (int teamIndex = 0; teamIndex < submissions.size(); teamIndex++) {
            Submission submission = submissions.get(teamIndex);
            List<TeamJudgeAssignment> assignments = teamJudgeAssignmentRepository
                    .findByTeamIdAndRoundId(submission.getTeamId(), round.getId());
            for (int judgeIndex = 0; judgeIndex < assignments.size(); judgeIndex++) {
                TeamJudgeAssignment assignment = assignments.get(judgeIndex);
                if (judgeScoreRepository.findByJudgeUserIdAndSubmissionId(
                        assignment.getJudgeUserId(), submission.getId()).isPresent()) {
                    continue;
                }
                seedCompletedScore(
                        assignment.getJudgeUserId(),
                        submission,
                        round.getId(),
                        criteria,
                        teamIndex,
                        judgeIndex,
                        now);
                scoresCreated++;
            }
            markSubmissionScored(submission);
        }

        int rankingVersion = rankingRepository.findMaxVersionByRoundId(round.getId());
        if (rankingVersion == 0) {
            aggregationService.recalculate(round.getId());
            rankingVersion = rankingRepository.findMaxVersionByRoundId(round.getId());
        }

        int locked = 0;
        if (!judgeScoreRepository.existsByRoundIdAndStatus(round.getId(), ScoreStatus.LOCKED)) {
            locked = judgingService.lockScoresForRound(round.getId());
        }

        log.info("Publish demo ready: round '{}', {} score(s) seeded, ranking v{}, {} score(s) locked",
                round.getName(), scoresCreated, rankingVersion, locked);
    }

    private boolean prepareFinalRound(HackathonEvent event, Round finalRound, List<Team> teams, LocalDateTime now) {
        Round preliminary = demoRoundTypeSync.syncAndReload(event.getId()).stream()
                .filter(r -> r.getRoundType() == RoundType.PRELIMINARY)
                .findFirst()
                .orElse(null);
        if (preliminary == null) {
            log.warn("Publish demo: no preliminary round — cannot prepare final round");
            return false;
        }

        if (rankingRepository.findMaxVersionByRoundId(preliminary.getId()) == 0) {
            log.warn("Publish demo: preliminary rankings missing — seed preliminary first");
            return false;
        }

        ensureFinalistsSelected(event.getId());

        List<Team> finalistTeams = finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(event.getId())
                .stream()
                .map(FinalistSelection::getTeamId)
                .map(teamId -> teams.stream().filter(t -> t.getId().equals(teamId)).findFirst().orElse(null))
                .filter(team -> team != null)
                .toList();
        if (finalistTeams.isEmpty()) {
            log.warn("Publish demo: no finalists selected for final round");
            return false;
        }

        judgingDemoSeeder.seedFinalRoundSubmissions(event, finalRound, now, finalistTeams);
        return true;
    }

    private void ensureFinalistsSelected(UUID eventId) {
        if (!finalistSelectionRepository.findByEventIdOrderByPreliminaryRankAsc(eventId).isEmpty()) {
            return;
        }
        finalistSelectionService.selectFinalists(eventId);
        log.info("Publish demo: selected finalists for event {}", eventId);
    }

    private Optional<HackathonEvent> findDemoEvent() {
        return eventRepository.findAll().stream()
                .filter(e -> FALL.equalsIgnoreCase(e.getSeason())
                        && YEAR == e.getYear()
                        && DEMO_EVENT_NAME.equals(e.getName()))
                .findFirst();
    }

    private void confirmTeamsForFeedback(UUID eventId, LocalDateTime now) {
        User thirdMember = userRepository.findByEmail(BETA_THIRD_MEMBER_EMAIL).orElse(null);
        for (Team team : teamRepository.findByEventId(eventId)) {
            if (team.getStatus() == TeamStatus.CONFIRMED) {
                continue;
            }
            if ("Team Beta".equals(team.getName()) && thirdMember != null
                    && !teamMemberRepository.existsByTeamIdAndUserId(team.getId(), thirdMember.getId())) {
                teamMemberRepository.save(TeamMember.builder()
                        .team(team)
                        .userId(thirdMember.getId())
                        .role(TeamMemberRole.MEMBER)
                        .joinedAt(now)
                        .build());
            }
            long memberCount = teamMemberRepository.findByTeamId(team.getId()).size();
            if (memberCount >= 3) {
                team.setStatus(TeamStatus.CONFIRMED);
                teamRepository.save(team);
            }
        }
    }

    private void seedCompletedScore(
            UUID judgeUserId,
            Submission submission,
            UUID roundId,
            List<Criteria> criteria,
            int teamIndex,
            int judgeIndex,
            LocalDateTime now) {
        JudgeScore score = JudgeScore.builder()
                .judgeUserId(judgeUserId)
                .submissionId(submission.getId())
                .roundId(roundId)
                .status(ScoreStatus.COMPLETED)
                .startedAt(now.minusHours(2))
                .completedAt(now.minusHours(1))
                .build();

        for (int criteriaIndex = 0; criteriaIndex < criteria.size(); criteriaIndex++) {
            Criteria criterion = criteria.get(criteriaIndex);
            int value = demoScore(teamIndex, judgeIndex, criteriaIndex, criterion.getMinScore(), criterion.getMaxScore());
            score.getDetails().add(JudgeScoreDetail.builder()
                    .judgeScore(score)
                    .criteriaId(criterion.getId())
                    .score(value)
                    .build());
        }

        judgeScoreRepository.save(score);
    }

    private int demoScore(int teamIndex, int judgeIndex, int criteriaIndex, int minScore, int maxScore) {
        int spread = Math.max(1, maxScore - minScore);
        int teamBase = teamIndex == 0 ? (int) Math.ceil(spread * 0.75) : (int) Math.ceil(spread * 0.35);
        int judgeOffset = judgeIndex % 2;
        int criteriaOffset = criteriaIndex % 2;
        int raw = minScore + teamBase + judgeOffset + criteriaOffset;
        return Math.min(maxScore, Math.max(minScore, raw));
    }

    private void markSubmissionScored(Submission submission) {
        if (submission.getStatus() != SubmissionStatus.SCORED) {
            submission.setStatus(SubmissionStatus.SCORED);
            submissionRepository.save(submission);
        }
    }

    private String teamNameForSubmission(List<Team> teams, Submission submission) {
        return teams.stream()
                .filter(t -> t.getId().equals(submission.getTeamId()))
                .map(Team::getName)
                .findFirst()
                .orElse(submission.getTeamId().toString());
    }
}
