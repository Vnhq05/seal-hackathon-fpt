package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.MentorAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.progress.repository.TeamProgressAlertRepository;
import com.sealhackathon.progress.service.TeamProgressScanService;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.submission.repository.SubmissionVersionRepository;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.MentorTeamRepository;
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
 * Dev event in active submission phase with a confirmed team that has not submitted —
 * triggers team progress alerts for leader, mentor, and coordinator (and staff dashboard for admin).
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class ProgressDemoSeeder {

    public static final String DEMO_EVENT_NAME_PROGRESS = "DEV Competition Progress Test";
    private static final String DEMO_EVENT_NAME_PROGRESS_LEGACY = "DEV Test tiến độ cuộc thi";
    private static final String SEASON = "Winter";
    private static final int YEAR = 2026;
    private static final String TEAM_NAME = "Team No Submit";
    private static final String MENTOR_EMAIL = "mentor.lbtest@fpt.edu.vn";

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final UserRepository userRepository;
    private final EventEnrollmentRepository enrollmentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentorTeamRepository mentorTeamRepository;
    private final SubmissionRepository submissionRepository;
    private final SubmissionVersionRepository submissionVersionRepository;
    private final TeamProgressAlertRepository teamProgressAlertRepository;
    private final TeamProgressScanService teamProgressScanService;

    @Transactional
    public void seed() {
        HackathonEvent event = findEvent().orElseGet(this::createEvent);
        if (event == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        syncSubmissionWindow(event, now);
        ensureMentorLinked(event, now);

        Team team = teamRepository.findByEventId(event.getId()).stream()
                .filter(t -> TEAM_NAME.equals(t.getName()))
                .findFirst()
                .orElse(null);
        if (team == null) {
            log.warn("Progress demo: team '{}' not found", TEAM_NAME);
            return;
        }

        Round round = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId()).stream()
                .findFirst()
                .orElse(null);
        if (round == null) {
            return;
        }

        clearTeamSubmission(team.getId(), round.getId());
        teamProgressAlertRepository.findByTeamIdAndRoundId(team.getId(), round.getId())
                .ifPresent(teamProgressAlertRepository::delete);

        teamProgressScanService.scanActiveRounds();

        log.info("Progress demo ready: '{}' — team '{}' has no submission, deadline in ~3h",
                DEMO_EVENT_NAME_PROGRESS, TEAM_NAME);
        log.info("Leader: {} / {} | Mentor: {} | Coordinator: {} | Admin dashboard: Teams needing support",
                DataSeeder.PROGRESS_TEST_STUDENT_EMAILS.getFirst(),
                DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT,
                MENTOR_EMAIL,
                EventDemoSeeder.DEV_COORDINATOR_EMAIL);
    }

    private Optional<HackathonEvent> findEvent() {
        Optional<HackathonEvent> byCurrentName = eventRepository.findAll().stream()
                .filter(e -> DEMO_EVENT_NAME_PROGRESS.equals(e.getName()))
                .findFirst();
        if (byCurrentName.isPresent()) {
            return byCurrentName;
        }
        return eventRepository.findAll().stream()
                .filter(e -> DEMO_EVENT_NAME_PROGRESS_LEGACY.equals(e.getName()))
                .findFirst()
                .map(event -> {
                    event.setName(DEMO_EVENT_NAME_PROGRESS);
                    eventRepository.save(event);
                    log.info("Renamed legacy progress demo event '{}' → '{}'",
                            DEMO_EVENT_NAME_PROGRESS_LEGACY, DEMO_EVENT_NAME_PROGRESS);
                    return event;
                });
    }

    private HackathonEvent createEvent() {
        ScoringTemplate template = scoringTemplateRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        if (template == null) {
            log.warn("Progress demo seeder: no scoring template — skip");
            return null;
        }

        List<String> studentEmails = DataSeeder.PROGRESS_TEST_STUDENT_EMAILS;
        if (studentEmails.size() < 3) {
            log.warn("Progress demo seeder: need at least 3 progress test students — skip");
            return null;
        }

        User mentor = userRepository.findByEmail(MENTOR_EMAIL).orElse(null);
        if (mentor == null) {
            log.warn("Progress demo seeder: mentor {} not found — skip", MENTOR_EMAIL);
            return null;
        }

        List<User> students = studentEmails.stream()
                .map(this::requireUser)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        List<UUID> tiebreakerIds = template.getCriteria().stream()
                .sorted(Comparator.comparingInt(ScoringTemplateCriterion::getSortOrder))
                .map(ScoringTemplateCriterion::getId)
                .toList();

        HackathonEvent event = HackathonEvent.builder()
                .name(DEMO_EVENT_NAME_PROGRESS)
                .season(SEASON)
                .year(YEAR)
                .startDate(today.minusDays(7))
                .endDate(today.plusDays(14))
                .registrationOpenDate(today.minusMonths(1))
                .registrationDeadline(today.minusDays(3))
                .description("Dev event for testing team progress alerts when submission phase is open but team has not submitted")
                .location("FPT University Da Nang")
                .format("OFFLINE")
                .minTeam(3)
                .maxTeam(10)
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
                .status(EventStatus.ACTIVE)
                .build();
        event.setLeaderboardPublic(true);
        event.setCreatedBy(EventDemoSeeder.DEV_COORDINATOR_EMAIL);
        event.getTiebreakerCriterionIds().addAll(tiebreakerIds);

        Track track = Track.builder()
                .hackathonEvent(event)
                .name("Software Track")
                .description("Progress alert smoke-test track")
                .maxTeams(20)
                .scoringTemplateId(template.getId())
                .build();
        event.getTracks().add(track);

        LocalDateTime submissionDeadline = now.plusHours(3);
        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(now.minusDays(1))
                .endDate(now.plusDays(3))
                .submissionDeadline(submissionDeadline)
                .scoringDeadline(now.plusDays(5))
                .advancementCutoff(10)
                .roundWeight(100)
                .roundType(RoundType.PRELIMINARY)
                .build();
        event.getRounds().add(round);

        HackathonEvent saved = eventRepository.save(event);
        UUID eventId = saved.getId();
        UUID trackId = saved.getTracks().getFirst().getId();

        saved.getMentorAssignments().add(MentorAssignment.builder()
                .hackathonEvent(saved)
                .trackId(trackId)
                .mentorUserId(mentor.getId())
                .assignedAt(now)
                .build());
        eventRepository.save(saved);

        for (User student : students) {
            seedEnrollment(student.getId(), eventId, now);
        }

        User leader = students.getFirst();
        Team team = seedTeam(eventId, TEAM_NAME, leader.getId(), trackId, now,
                students.stream().map(User::getId).toList());

        mentorTeamRepository.save(MentorTeam.builder()
                .mentorUserId(mentor.getId())
                .team(team)
                .assignedAt(now)
                .build());

        log.info("Created progress demo event '{}' with team {}", DEMO_EVENT_NAME_PROGRESS, TEAM_NAME);
        return saved;
    }

    private void syncSubmissionWindow(HackathonEvent event, LocalDateTime now) {
        LocalDate today = LocalDate.now();
        boolean changed = false;

        if (event.getStatus() != EventStatus.ACTIVE) {
            event.setStatus(EventStatus.ACTIVE);
            changed = true;
        }
        if (!event.isLeaderboardPublic()) {
            event.setLeaderboardPublic(true);
            changed = true;
        }
        LocalDate start = today.minusDays(7);
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
                    LocalDateTime submissionDeadline = now.plusHours(3);
                    LocalDateTime scoringDeadline = now.plusDays(5);
                    if (!submissionDeadline.equals(round.getSubmissionDeadline())
                            || !scoringDeadline.equals(round.getScoringDeadline())) {
                        round.setStartDate(now.minusDays(1));
                        round.setEndDate(now.plusDays(3));
                        round.setSubmissionDeadline(submissionDeadline);
                        round.setScoringDeadline(scoringDeadline);
                        roundRepository.save(round);
                    }
                });
    }

    private void ensureMentorLinked(HackathonEvent event, LocalDateTime now) {
        User mentor = userRepository.findByEmail(MENTOR_EMAIL).orElse(null);
        if (mentor == null) {
            return;
        }

        UUID trackId = event.getTracks().isEmpty()
                ? teamRepository.findByEventId(event.getId()).stream()
                        .map(Team::getTrackId)
                        .filter(id -> id != null)
                        .findFirst()
                        .orElse(null)
                : event.getTracks().getFirst().getId();

        if (trackId != null
                && !mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                        event.getId(), trackId, mentor.getId())) {
            mentorAssignmentRepository.save(MentorAssignment.builder()
                    .hackathonEvent(event)
                    .trackId(trackId)
                    .mentorUserId(mentor.getId())
                    .assignedAt(now)
                    .build());
        }

        teamRepository.findByEventId(event.getId()).stream()
                .filter(t -> TEAM_NAME.equals(t.getName()))
                .findFirst()
                .ifPresent(team -> {
                    if (!mentorTeamRepository.existsByMentorUserIdAndTeamId(mentor.getId(), team.getId())) {
                        mentorTeamRepository.save(MentorTeam.builder()
                                .mentorUserId(mentor.getId())
                                .team(team)
                                .assignedAt(now)
                                .build());
                    }
                });
    }

    private void clearTeamSubmission(UUID teamId, UUID roundId) {
        submissionRepository.findByTeamIdAndRoundId(teamId, roundId).ifPresent(submission -> {
            submissionVersionRepository.findBySubmissionIdOrderByVersionNumberDesc(submission.getId())
                    .forEach(submissionVersionRepository::delete);
            submissionRepository.delete(submission);
        });
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
                .enrolledAt(now.minusDays(10))
                .build());
    }

    private Team seedTeam(
            UUID eventId,
            String name,
            UUID leaderId,
            UUID trackId,
            LocalDateTime now,
            List<UUID> memberIds) {
        Team team = teamRepository.findByEventId(eventId).stream()
                .filter(t -> name.equals(t.getName()))
                .findFirst()
                .orElseGet(() -> teamRepository.save(Team.builder()
                        .eventId(eventId)
                        .name(name)
                        .leaderId(leaderId)
                        .status(TeamStatus.CONFIRMED)
                        .trackId(trackId)
                        .build()));

        if (team.getStatus() != TeamStatus.CONFIRMED) {
            team.setStatus(TeamStatus.CONFIRMED);
            teamRepository.save(team);
        }

        for (UUID memberId : memberIds) {
            if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), memberId)) {
                continue;
            }
            teamMemberRepository.save(TeamMember.builder()
                    .team(team)
                    .userId(memberId)
                    .role(memberId.equals(leaderId) ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER)
                    .joinedAt(now.minusDays(8))
                    .build());
        }
        return team;
    }
}
