package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.EventJudgeAssignment;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.EventJudgeAssignmentRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
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
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class JudgingDemoSeeder {

    private static final String DEMO_EVENT_NAME = EventDemoSeeder.DEMO_EVENT_NAME_FALL;
    private static final String FALL = "Fall";
    private static final int YEAR = 2026;
    private static final int DEMO_MIN_SCORE = 1;
    private static final int DEMO_MAX_SCORE = 5;
    private static final List<String> DEMO_JUDGE_EMAILS = List.of(
            "lecturer1@fpt.edu.vn",
            "lecturer2@fpt.edu.vn",
            "lecturer3@fpt.edu.vn"
    );

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final EventJudgeAssignmentRepository eventJudgeAssignmentRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final CriteriaRepository criteriaRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository submissionVersionRepository;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final DemoRoundTypeSync demoRoundTypeSync;

    @Transactional
    public void seedIfMissing() {
        Optional<HackathonEvent> eventOpt = findDemoEvent();
        if (eventOpt.isEmpty()) {
            log.debug("Fall {} demo event not found — skipping judging demo seed", YEAR);
            return;
        }

        HackathonEvent event = eventOpt.get();
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        syncEventForScoringReadiness(event, today);
        List<Round> rounds = ensureFinalRound(event, demoRoundTypeSync.syncAndReload(event.getId()), now);
        if (rounds.isEmpty()) {
            return;
        }

        syncJudgeAssignments(event, rounds, now);

        List<UUID> judgeIds = DEMO_JUDGE_EMAILS.stream()
                .map(email -> userRepository.findByEmail(email).map(User::getId).orElse(null))
                .filter(id -> id != null)
                .toList();

        int criteriaCount = 0;
        for (Round round : rounds) {
            syncRoundScoringWindow(round, now);
            criteriaCount = Math.max(criteriaCount, seedRoundCriteria(event, round).size());
        }

        Round submissionRound = rounds.stream()
                .filter(r -> r.getRoundType() == RoundType.PRELIMINARY)
                .findFirst()
                .orElse(rounds.getFirst());
        List<Team> teams = teamRepository.findByEventId(event.getId());
        int submissionCount = 0;
        for (Team team : teams) {
            String slug = team.getName().toLowerCase().replace(' ', '-');
            seedSubmission(team, submissionRound, now, slug);
            seedTeamJudgeAssignments(team, submissionRound, judgeIds, now);
            submissionCount++;
        }

        log.info("Judging demo ready: event '{}', {} round(s), {} preliminary submission(s) on '{}'",
                DEMO_EVENT_NAME, rounds.size(), submissionCount, submissionRound.getName());
        log.info("Coordinator: set event status ACTIVE → SCORING, then login judge {} / {}",
                EventDemoSeeder.DEMO_TEST_JUDGE_EMAIL, EventDemoSeeder.DEMO_TEST_JUDGE_PASSWORD_HINT);
    }

    void seedFinalRoundSubmissions(HackathonEvent event, Round finalRound, LocalDateTime now, List<Team> finalistTeams) {
        List<UUID> judgeIds = DEMO_JUDGE_EMAILS.stream()
                .map(email -> userRepository.findByEmail(email).map(User::getId).orElse(null))
                .filter(id -> id != null)
                .toList();
        for (Team team : finalistTeams) {
            String slug = team.getName().toLowerCase().replace(' ', '-') + "-final";
            seedSubmission(team, finalRound, now, slug);
            seedTeamJudgeAssignments(team, finalRound, judgeIds, now);
        }
    }

    List<Round> ensureFinalRound(HackathonEvent event, List<Round> rounds, LocalDateTime now) {
        if (rounds.stream().anyMatch(r -> r.getRoundType() == RoundType.FINAL)) {
            return rounds;
        }

        int nextRoundNumber = rounds.stream()
                .mapToInt(Round::getRoundNumber)
                .max()
                .orElse(0) + 1;
        LocalDateTime start = now.minusDays(1);
        LocalDateTime scoringEnd = now.plusDays(14);

        Round finalRound = Round.builder()
                .hackathonEvent(event)
                .roundNumber(nextRoundNumber)
                .name("Final Round")
                .startDate(start)
                .endDate(scoringEnd)
                .submissionDeadline(now.plusDays(7))
                .scoringDeadline(scoringEnd)
                .advancementCutoff(6)
                .roundWeight(100)
                .roundType(RoundType.FINAL)
                .build();
        roundRepository.save(finalRound);
        log.info("Created demo Final Round for '{}'", DEMO_EVENT_NAME);
        return demoRoundTypeSync.syncAndReload(event.getId());
    }

    private Optional<HackathonEvent> findDemoEvent() {
        return eventRepository.findAll().stream()
                .filter(e -> FALL.equalsIgnoreCase(e.getSeason())
                        && YEAR == e.getYear()
                        && DEMO_EVENT_NAME.equals(e.getName()))
                .findFirst();
    }

    private void syncEventForScoringReadiness(HackathonEvent event, LocalDate today) {
        boolean changed = false;
        if (event.getStatus() == EventStatus.OPEN
                || event.getStatus() == EventStatus.UPCOMING
                || event.getStatus() == EventStatus.CLOSED_REGISTRATION) {
            event.setStatus(EventStatus.ACTIVE);
            changed = true;
        }
        LocalDate start = today.minusMonths(1);
        LocalDate end = today.plusMonths(2);
        if (!start.equals(event.getStartDate())) {
            event.setStartDate(start);
            changed = true;
        }
        if (!end.equals(event.getEndDate())) {
            event.setEndDate(end);
            changed = true;
        }
        if (changed) {
            eventRepository.save(event);
        }
    }

    private void syncRoundScoringWindow(Round round, LocalDateTime now) {
        LocalDateTime start = now.minusDays(1);
        LocalDateTime scoringEnd = now.plusDays(14);
        if (!start.equals(round.getStartDate())
                || !scoringEnd.equals(round.getScoringDeadline())) {
            round.setStartDate(start);
            round.setEndDate(scoringEnd);
            round.setSubmissionDeadline(now.plusDays(7));
            round.setScoringDeadline(scoringEnd);
            roundRepository.save(round);
        }
    }

    private void syncJudgeAssignments(HackathonEvent event, List<Round> rounds, LocalDateTime now) {
        List<UUID> judgeIds = DEMO_JUDGE_EMAILS.stream()
                .map(email -> userRepository.findByEmail(email).map(User::getId).orElse(null))
                .filter(id -> id != null)
                .toList();
        if (judgeIds.isEmpty()) {
            log.warn("No demo judge accounts found — skipping judge assignment sync");
            return;
        }

        for (UUID judgeId : judgeIds) {
            if (!eventJudgeAssignmentRepository.existsByHackathonEventIdAndJudgeUserId(event.getId(), judgeId)) {
                eventJudgeAssignmentRepository.save(EventJudgeAssignment.builder()
                        .hackathonEvent(event)
                        .judgeUserId(judgeId)
                        .assignedAt(now)
                        .build());
            }
        }

        for (Round round : rounds) {
            for (UUID judgeId : judgeIds) {
                boolean hasRoundAssignment = judgeAssignmentRepository
                        .findByRoundIdAndJudgeUserIdAndActiveTrue(round.getId(), judgeId)
                        .stream()
                        .anyMatch(a -> a.getScope() == AssignmentScope.ROUND);
                if (!hasRoundAssignment) {
                    judgeAssignmentRepository.save(JudgeAssignment.builder()
                            .round(round)
                            .judgeUserId(judgeId)
                            .scope(AssignmentScope.ROUND)
                            .active(true)
                            .assignedAt(now)
                            .build());
                }
            }
        }
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

    private Submission seedSubmission(Team team, Round round, LocalDateTime now, String slug) {
        return submissionRepository.findByTeamIdAndRoundId(team.getId(), round.getId())
                .map(existing -> ensureSubmitted(existing, now))
                .orElseGet(() -> createSubmission(team, round, now, slug));
    }

    private Submission ensureSubmitted(Submission submission, LocalDateTime now) {
        if (submission.getStatus() != SubmissionStatus.SUBMITTED
                && submission.getStatus() != SubmissionStatus.SCORED) {
            submission.setStatus(SubmissionStatus.SUBMITTED);
            return submissionRepository.save(submission);
        }
        if (submission.getCurrentVersionId() == null) {
            SubmissionVersion version = submissionVersionRepository.save(SubmissionVersion.builder()
                    .submission(submission)
                    .versionNumber(1)
                    .githubUrl("https://github.com/demo/" + submission.getTeamId())
                    .demoUrl("https://www.youtube.com/watch?v=demo")
                    .submittedAt(now)
                    .build());
            submission.setCurrentVersionId(version.getId());
            return submissionRepository.save(submission);
        }
        return submission;
    }

    private Submission createSubmission(Team team, Round round, LocalDateTime now, String slug) {
        Submission submission = submissionRepository.save(Submission.builder()
                .teamId(team.getId())
                .roundId(round.getId())
                .submittedBy(team.getLeaderId())
                .status(SubmissionStatus.SUBMITTED)
                .build());

        SubmissionVersion version = submissionVersionRepository.save(SubmissionVersion.builder()
                .submission(submission)
                .versionNumber(1)
                .githubUrl("https://github.com/demo/" + slug)
                .demoUrl("https://www.youtube.com/watch?v=" + slug)
                .slideUrl("https://docs.google.com/presentation/d/demo-" + slug)
                .submittedAt(now.minusHours(2))
                .build());
        submission.getVersions().add(version);
        submission.setCurrentVersionId(version.getId());
        return submissionRepository.save(submission);
    }

    private void seedTeamJudgeAssignments(
            Team team, Round round, List<UUID> judgeIds, LocalDateTime now) {
        for (UUID judgeId : judgeIds) {
            if (!teamJudgeAssignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(
                    team.getId(), round.getId(), judgeId)) {
                teamJudgeAssignmentRepository.save(TeamJudgeAssignment.builder()
                        .teamId(team.getId())
                        .roundId(round.getId())
                        .judgeUserId(judgeId)
                        .assignedAt(now)
                        .build());
            }
        }
    }
}
