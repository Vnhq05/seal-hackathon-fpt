package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.judging.domain.JudgeComment;
import com.sealhackathon.judging.domain.JudgeScore;
import com.sealhackathon.judging.domain.JudgeScoreDetail;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.SubmissionVersion;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JudgingDemoSeeder {

    private static final String DEMO_EVENT_NAME = EventDemoSeeder.DEMO_EVENT_NAME_FALL;
    private static final String TEAM_ALPHA = "Team Alpha";
    private static final String FALL = "Fall";
    private static final int YEAR = 2026;
    private static final int DEMO_MIN_SCORE = 1;
    private static final int DEMO_MAX_SCORE = 5;

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final CriteriaRepository criteriaRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository submissionVersionRepository;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final JudgeScoreRepository judgeScoreRepository;

    @Transactional
    public void seedIfMissing() {
        Optional<HackathonEvent> eventOpt = eventRepository.findAll().stream()
                .filter(e -> FALL.equalsIgnoreCase(e.getSeason())
                        && YEAR == e.getYear()
                        && DEMO_EVENT_NAME.equals(e.getName()))
                .findFirst();
        if (eventOpt.isEmpty()) {
            log.debug("Fall {} demo event not found — skipping judging demo seed", YEAR);
            return;
        }

        HackathonEvent event = eventOpt.get();
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId());
        if (rounds.isEmpty()) {
            return;
        }
        Round roundOne = rounds.getFirst();

        Team teamAlpha = teamRepository.findByEventId(event.getId()).stream()
                .filter(t -> TEAM_ALPHA.equals(t.getName()))
                .findFirst()
                .orElse(null);
        if (teamAlpha == null) {
            return;
        }

        User lecturer1 = userRepository.findByEmail("lecturer1@fpt.edu.vn").orElse(null);
        User lecturer2 = userRepository.findByEmail("lecturer2@fpt.edu.vn").orElse(null);
        if (lecturer1 == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        List<Criteria> criteria = seedRoundCriteria(event, roundOne);
        Submission submission = seedSubmission(teamAlpha, roundOne, now);
        seedTeamJudgeAssignment(teamAlpha.getId(), roundOne.getId(), lecturer1.getId(), now);
        if (lecturer2 != null) {
            seedTeamJudgeAssignment(teamAlpha.getId(), roundOne.getId(), lecturer2.getId(), now);
        }
        seedCompletedScore(lecturer1.getId(), roundOne.getId(), submission, criteria, now);

        log.info("Seeded Fall {} judging demo for Team Alpha (round {}, {} criteria)",
                YEAR, roundOne.getName(), criteria.size());
    }

    private List<Criteria> seedRoundCriteria(HackathonEvent event, Round round) {
        List<Criteria> existing = criteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
        if (!existing.isEmpty()) {
            return existing;
        }

        UUID templateId = event.getScoringTemplateId();
        if (templateId == null) {
            return List.of();
        }

        ScoringTemplate template = scoringTemplateRepository.findById(templateId).orElse(null);
        if (template == null || template.getCriteria().isEmpty()) {
            return List.of();
        }

        List<ScoringTemplateCriterion> templateCriteria = template.getCriteria().stream()
                .sorted(Comparator.comparingInt(ScoringTemplateCriterion::getSortOrder))
                .toList();

        for (ScoringTemplateCriterion tc : templateCriteria) {
            criteriaRepository.save(Criteria.builder()
                    .round(round)
                    .name(tc.getName())
                    .description(tc.getDescription())
                    .weight(tc.getWeight())
                    .sortOrder(tc.getSortOrder())
                    .minScore(DEMO_MIN_SCORE)
                    .maxScore(DEMO_MAX_SCORE)
                    .build());
        }

        return criteriaRepository.findByRoundIdOrderBySortOrderAsc(round.getId());
    }

    private Submission seedSubmission(Team team, Round round, LocalDateTime now) {
        return submissionRepository.findByTeamIdAndRoundId(team.getId(), round.getId())
                .orElseGet(() -> {
                    Submission submission = submissionRepository.save(Submission.builder()
                            .teamId(team.getId())
                            .roundId(round.getId())
                            .submittedBy(team.getLeaderId())
                            .status(SubmissionStatus.SUBMITTED)
                            .build());

                    SubmissionVersion version = submissionVersionRepository.save(SubmissionVersion.builder()
                            .submission(submission)
                            .versionNumber(1)
                            .githubUrl("https://github.com/demo/team-alpha")
                            .demoUrl("https://www.youtube.com/watch?v=demo")
                            .submittedAt(now)
                            .build());
                    submission.getVersions().add(version);
                    submission.setCurrentVersionId(version.getId());
                    return submissionRepository.save(submission);
                });
    }

    private void seedTeamJudgeAssignment(UUID teamId, UUID roundId, UUID judgeId, LocalDateTime now) {
        if (teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(teamId, roundId, judgeId)) {
            return;
        }
        teamJudgeAssignmentRepository.save(TeamJudgeAssignment.builder()
                .teamId(teamId)
                .roundId(roundId)
                .judgeUserId(judgeId)
                .assignedAt(now)
                .build());
    }

    private void seedCompletedScore(
            UUID judgeId,
            UUID roundId,
            Submission submission,
            List<Criteria> criteria,
            LocalDateTime now) {
        if (judgeScoreRepository.findByJudgeUserIdAndSubmissionId(judgeId, submission.getId()).isPresent()) {
            return;
        }
        if (criteria.isEmpty()) {
            return;
        }

        int[] demoScores = buildDemoScores(criteria.size());
        JudgeScore judgeScore = JudgeScore.builder()
                .judgeUserId(judgeId)
                .submissionId(submission.getId())
                .roundId(roundId)
                .status(ScoreStatus.COMPLETED)
                .startedAt(now.minusHours(1))
                .completedAt(now)
                .build();

        for (int i = 0; i < criteria.size(); i++) {
            Criteria criterion = criteria.get(i);
            int score = demoScores[i];
            JudgeScoreDetail detail = JudgeScoreDetail.builder()
                    .judgeScore(judgeScore)
                    .criteriaId(criterion.getId())
                    .score(score)
                    .build();
            judgeScore.getDetails().add(detail);

            if (score == DEMO_MIN_SCORE || score == DEMO_MAX_SCORE) {
                judgeScore.getComments().add(JudgeComment.builder()
                        .judgeScore(judgeScore)
                        .criteriaId(criterion.getId())
                        .comment(score == DEMO_MIN_SCORE
                                ? "Demo seed: room for improvement on this criterion."
                                : "Demo seed: strong performance on this criterion.")
                        .build());
            }
        }

        judgeScoreRepository.save(judgeScore);
    }

    /** Deterministic 1–5 scores for demo history (weighted total ≈ 3.9–4.0 on SEAL-style weights). */
    private static int[] buildDemoScores(int count) {
        int[] pattern = {4, 3, 5, 4, 3};
        int[] scores = new int[count];
        for (int i = 0; i < count; i++) {
            scores[i] = pattern[i % pattern.length];
        }
        return scores;
    }
}
