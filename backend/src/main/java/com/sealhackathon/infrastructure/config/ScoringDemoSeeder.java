package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.EventJudgeAssignment;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.Track;
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
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
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

/**
 * Dev event with teams already submitted — always kept in {@link EventStatus#SCORING} for judge smoke tests.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class ScoringDemoSeeder {

    public static final String DEMO_EVENT_NAME_SCORING = "DEV Scoring Feature Test";
    private static final String DEMO_EVENT_NAME_SCORING_LEGACY = "DEV Chức năng chấm điểm";
    private static final String SEASON = "Spring";
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
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final UserRepository userRepository;
    private final EventEnrollmentRepository enrollmentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final EventJudgeAssignmentRepository eventJudgeAssignmentRepository;
    private final CriteriaRepository criteriaRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository submissionVersionRepository;
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;

    @Transactional
    public void seed() {
        HackathonEvent event = findEvent().orElseGet(this::createEvent);
        if (event == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        syncScoringPhase(event, now);

        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId());
        if (rounds.isEmpty()) {
            return;
        }
        Round round = rounds.getFirst();

        syncJudgeAssignments(event, round, now);
        seedRoundCriteria(event, round);

        List<UUID> judgeIds = resolveJudgeIds();
        List<Team> teams = teamRepository.findByEventId(event.getId());
        for (Team team : teams) {
            String slug = team.getName().toLowerCase().replace(' ', '-');
            seedSubmission(team, round, now, slug);
            seedTeamJudgeAssignments(team, round, judgeIds, now);
        }

        log.info("Scoring demo ready: '{}' — {} team(s) submitted, event status SCORING",
                DEMO_EVENT_NAME_SCORING, teams.size());
        log.info("Login judge {} / {} → /lecturer/scoring",
                EventDemoSeeder.DEMO_TEST_JUDGE_EMAIL, EventDemoSeeder.DEMO_TEST_JUDGE_PASSWORD_HINT);
    }

    private Optional<HackathonEvent> findEvent() {
        Optional<HackathonEvent> byCurrentName = eventRepository.findAll().stream()
                .filter(e -> DEMO_EVENT_NAME_SCORING.equals(e.getName()))
                .findFirst();
        if (byCurrentName.isPresent()) {
            return byCurrentName;
        }
        return eventRepository.findAll().stream()
                .filter(e -> DEMO_EVENT_NAME_SCORING_LEGACY.equals(e.getName()))
                .findFirst()
                .map(event -> {
                    event.setName(DEMO_EVENT_NAME_SCORING);
                    eventRepository.save(event);
                    log.info("Renamed legacy scoring demo event '{}' → '{}'",
                            DEMO_EVENT_NAME_SCORING_LEGACY, DEMO_EVENT_NAME_SCORING);
                    return event;
                });
    }

    private HackathonEvent createEvent() {
        ScoringTemplate template = scoringTemplateRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        if (template == null) {
            log.warn("Scoring demo seeder: no scoring template — skip");
            return null;
        }

        List<String> studentEmails = DataSeeder.SCORING_TEST_STUDENT_EMAILS;
        if (studentEmails.size() < 6) {
            log.warn("Scoring demo seeder: need at least 6 scoring test students — skip");
            return null;
        }

        User lecturer1 = requireUser(DEMO_JUDGE_EMAILS.get(0));
        User lecturer2 = requireUser(DEMO_JUDGE_EMAILS.get(1));
        User lecturer3 = requireUser(DEMO_JUDGE_EMAILS.get(2));
        List<UUID> judgeIds = List.of(lecturer1.getId(), lecturer2.getId(), lecturer3.getId());

        User s1 = requireUser(studentEmails.get(0));
        User s2 = requireUser(studentEmails.get(1));
        User s3 = requireUser(studentEmails.get(2));
        User s4 = requireUser(studentEmails.get(3));
        User s5 = requireUser(studentEmails.get(4));
        User s6 = requireUser(studentEmails.get(5));

        LocalDateTime now = LocalDateTime.now();
        List<UUID> tiebreakerIds = template.getCriteria().stream()
                .sorted(Comparator.comparingInt(ScoringTemplateCriterion::getSortOrder))
                .map(ScoringTemplateCriterion::getId)
                .toList();

        HackathonEvent event = HackathonEvent.builder()
                .name(DEMO_EVENT_NAME_SCORING)
                .season(SEASON)
                .year(YEAR)
                .startDate(now.toLocalDate().minusDays(3))
                .endDate(now.toLocalDate().plusDays(14))
                .registrationOpenDate(now.toLocalDate().minusMonths(1))
                .registrationDeadline(now.toLocalDate().minusDays(5))
                .description("Dev event for testing judge scoring — teams already submitted, submission closed")
                .location("FPT University Da Nang")
                .format("OFFLINE")
                .minTeam(3)
                .maxTeam(5)
                .semesterMin(4)
                .semesterMax(8)
                .scoringTemplateId(template.getId())
                .tiebreakerCriteria(tiebreakerIds.stream()
                        .map(id -> template.getCriteria().stream()
                                .filter(c -> c.getId().equals(id))
                                .map(ScoringTemplateCriterion::getName)
                                .findFirst()
                                .orElse(""))
                        .filter(name -> !name.isBlank())
                        .reduce((a, b) -> a + ", " + b)
                        .orElse(null))
                .status(EventStatus.SCORING)
                .build();
        event.setCreatedBy(EventDemoSeeder.DEV_COORDINATOR_EMAIL);
        event.getTiebreakerCriterionIds().addAll(tiebreakerIds);

        Track track = Track.builder()
                .hackathonEvent(event)
                .name("Software Development")
                .description("Scoring smoke-test track")
                .maxTeams(20)
                .scoringTemplateId(template.getId())
                .build();
        event.getTracks().add(track);

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(now.minusDays(2))
                .endDate(now.plusDays(7))
                .submissionDeadline(now.minusHours(2))
                .scoringDeadline(now.plusDays(7))
                .advancementCutoff(10)
                .roundWeight(100)
                .roundType(RoundType.PRELIMINARY)
                .build();

        for (UUID judgeId : judgeIds) {
            round.getJudgeAssignments().add(JudgeAssignment.builder()
                    .round(round)
                    .judgeUserId(judgeId)
                    .scope(AssignmentScope.ROUND)
                    .active(true)
                    .assignedAt(now)
                    .build());
            event.getEventJudgeAssignments().add(EventJudgeAssignment.builder()
                    .hackathonEvent(event)
                    .judgeUserId(judgeId)
                    .assignedAt(now)
                    .build());
        }
        event.getRounds().add(round);

        HackathonEvent saved = eventRepository.save(event);
        UUID eventId = saved.getId();
        UUID trackId = saved.getTracks().getFirst().getId();

        for (User student : List.of(s1, s2, s3, s4, s5, s6)) {
            seedEnrollment(student.getId(), eventId, now);
        }

        seedTeam(eventId, "Team Gamma", s1.getId(), trackId, now,
                List.of(s1.getId(), s2.getId(), s3.getId()));
        seedTeam(eventId, "Team Delta", s4.getId(), trackId, now,
                List.of(s4.getId(), s5.getId(), s6.getId()));

        log.info("Created scoring demo event '{}' with 2 teams (6 students)", DEMO_EVENT_NAME_SCORING);
        return saved;
    }

    private void syncScoringPhase(HackathonEvent event, LocalDateTime now) {
        LocalDate today = LocalDate.now();
        boolean changed = false;

        if (event.getStatus() != EventStatus.SCORING) {
            event.setStatus(EventStatus.SCORING);
            changed = true;
        }
        LocalDate start = today.minusDays(3);
        LocalDate end = today.plusDays(14);
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

        roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId()).stream()
                .findFirst()
                .ifPresent(round -> {
                    LocalDateTime submissionEnd = now.minusHours(2);
                    LocalDateTime scoringEnd = now.plusDays(7);
                    if (!submissionEnd.equals(round.getSubmissionDeadline())
                            || !scoringEnd.equals(round.getScoringDeadline())) {
                        round.setStartDate(now.minusDays(2));
                        round.setEndDate(scoringEnd);
                        round.setSubmissionDeadline(submissionEnd);
                        round.setScoringDeadline(scoringEnd);
                        roundRepository.save(round);
                    }
                });
    }

    private void syncJudgeAssignments(HackathonEvent event, Round round, LocalDateTime now) {
        List<UUID> judgeIds = resolveJudgeIds();
        if (judgeIds.isEmpty()) {
            log.warn("Scoring demo: no judge accounts found");
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

    private List<UUID> resolveJudgeIds() {
        return DEMO_JUDGE_EMAILS.stream()
                .map(email -> userRepository.findByEmail(email).map(User::getId).orElse(null))
                .filter(id -> id != null)
                .toList();
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
                .map(existing -> ensureSubmitted(existing, now, slug))
                .orElseGet(() -> createSubmission(team, round, now, slug));
    }

    private Submission ensureSubmitted(Submission submission, LocalDateTime now, String slug) {
        if (submission.getStatus() != SubmissionStatus.SUBMITTED
                && submission.getStatus() != SubmissionStatus.SCORED) {
            submission.setStatus(SubmissionStatus.SUBMITTED);
            submission = submissionRepository.save(submission);
        }
        if (submission.getCurrentVersionId() == null) {
            SubmissionVersion version = submissionVersionRepository.save(SubmissionVersion.builder()
                    .submission(submission)
                    .versionNumber(1)
                    .githubUrl("https://github.com/demo/" + slug)
                    .demoUrl("https://www.youtube.com/watch?v=" + slug)
                    .slideUrl("https://docs.google.com/presentation/d/demo-" + slug)
                    .submittedAt(now.minusHours(4))
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
                .submittedAt(now.minusHours(4))
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

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Required user not found: " + email));
    }

    private void seedEnrollment(UUID userId, UUID eventId, LocalDateTime now) {
        if (enrollmentRepository.existsByUserIdAndEventId(userId, eventId)) {
            enrollmentRepository.findByUserIdAndEventId(userId, eventId).ifPresent(existing -> {
                if (existing.getStatus() != EnrollmentStatus.APPROVED) {
                    existing.setStatus(EnrollmentStatus.APPROVED);
                    enrollmentRepository.save(existing);
                }
            });
            return;
        }
        enrollmentRepository.save(EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .enrolledAt(now)
                .build());
    }

    private void seedTeam(
            UUID eventId,
            String name,
            UUID leaderId,
            UUID trackId,
            LocalDateTime now,
            List<UUID> memberIds) {
        if (teamRepository.existsByEventIdAndName(eventId, name)) {
            return;
        }

        Team team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name(name)
                .leaderId(leaderId)
                .status(TeamStatus.CONFIRMED)
                .trackId(trackId)
                .build());

        for (UUID memberId : memberIds) {
            if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), memberId)) {
                continue;
            }
            teamMemberRepository.save(TeamMember.builder()
                    .team(team)
                    .userId(memberId)
                    .role(memberId.equals(leaderId) ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER)
                    .joinedAt(now)
                    .build());
        }
    }
}
