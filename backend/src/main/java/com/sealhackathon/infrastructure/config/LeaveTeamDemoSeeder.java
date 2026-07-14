package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
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
 * Dev event still in registration / pre-start phase with a confirmed 3-member team —
 * used to smoke-test voluntary leave before the competition starts.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class LeaveTeamDemoSeeder {

    public static final String DEMO_EVENT_NAME_LEAVE = "DEV Leave Team Test";
    private static final String SEASON = "Spring";
    private static final int YEAR = 2026;
    private static final String TEAM_NAME = "Team Leave Ready";

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final UserRepository userRepository;
    private final EventEnrollmentRepository enrollmentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional
    public void seed() {
        HackathonEvent event = findEvent().orElseGet(this::createEvent);
        if (event == null) {
            return;
        }

        syncPreStartPhase(event);
        ensureTeamReady(event.getId());

        log.info("Leave-team demo ready: '{}' — login member {} / {} → Teams → Leave team",
                DEMO_EVENT_NAME_LEAVE,
                DataSeeder.LEAVE_TEST_STUDENT_EMAILS.get(1),
                DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT);
        log.info("Leader (cannot leave without transfer): {} / {}",
                DataSeeder.LEAVE_TEST_STUDENT_EMAILS.getFirst(),
                DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT);
    }

    private Optional<HackathonEvent> findEvent() {
        return eventRepository.findAll().stream()
                .filter(e -> DEMO_EVENT_NAME_LEAVE.equals(e.getName()))
                .findFirst();
    }

    private HackathonEvent createEvent() {
        ScoringTemplate template = scoringTemplateRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        if (template == null) {
            log.warn("Leave-team demo seeder: no scoring template — skip");
            return null;
        }

        List<String> studentEmails = DataSeeder.LEAVE_TEST_STUDENT_EMAILS;
        if (studentEmails.size() < 3) {
            log.warn("Leave-team demo seeder: need at least 3 leave-test students — skip");
            return null;
        }

        User leader = requireUser(studentEmails.get(0));
        User member2 = requireUser(studentEmails.get(1));
        User member3 = requireUser(studentEmails.get(2));

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDate start = today.plusDays(14);
        LocalDate end = today.plusDays(45);
        LocalDate regOpen = today.minusDays(7);
        LocalDate regClose = today.plusDays(10);

        List<UUID> tiebreakerIds = template.getCriteria().stream()
                .sorted(Comparator.comparingInt(ScoringTemplateCriterion::getSortOrder))
                .map(ScoringTemplateCriterion::getId)
                .toList();

        HackathonEvent event = HackathonEvent.builder()
                .name(DEMO_EVENT_NAME_LEAVE)
                .season(SEASON)
                .year(YEAR)
                .startDate(start)
                .endDate(end)
                .registrationOpenDate(regOpen)
                .registrationDeadline(regClose)
                .description("Dev event for testing leave team before competition starts (OPEN / not started)")
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
                .status(EventStatus.OPEN)
                .build();
        event.setCreatedBy(EventDemoSeeder.DEV_COORDINATOR_EMAIL);
        event.getTiebreakerCriterionIds().addAll(tiebreakerIds);

        Track track = Track.builder()
                .hackathonEvent(event)
                .name("General Track")
                .description("Leave-team smoke-test track")
                .maxTeams(20)
                .scoringTemplateId(template.getId())
                .build();
        event.getTracks().add(track);

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(start.atStartOfDay())
                .endDate(end.atTime(23, 59))
                .submissionDeadline(end.minusDays(3).atTime(18, 0))
                .scoringDeadline(end.atTime(23, 59))
                .advancementCutoff(10)
                .roundWeight(100)
                .roundType(RoundType.PRELIMINARY)
                .build();
        event.getRounds().add(round);

        HackathonEvent saved = eventRepository.save(event);
        UUID eventId = saved.getId();
        UUID trackId = saved.getTracks().getFirst().getId();

        for (User student : List.of(leader, member2, member3)) {
            seedEnrollment(student.getId(), eventId, now);
        }

        seedTeam(eventId, TEAM_NAME, leader.getId(), trackId, now,
                List.of(leader.getId(), member2.getId(), member3.getId()));

        log.info("Created leave-team demo event '{}' with team {}", DEMO_EVENT_NAME_LEAVE, TEAM_NAME);
        return saved;
    }

    /** Keep dates / status so resolveStatus stays OPEN (registration open, before start). */
    private void syncPreStartPhase(HackathonEvent event) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.plusDays(14);
        LocalDate end = today.plusDays(45);
        LocalDate regOpen = today.minusDays(7);
        LocalDate regClose = today.plusDays(10);
        boolean changed = false;

        if (event.getStatus() != EventStatus.OPEN && event.getStatus() != EventStatus.UPCOMING) {
            event.setStatus(EventStatus.OPEN);
            changed = true;
        }
        if (!start.equals(event.getStartDate())) {
            event.setStartDate(start);
            changed = true;
        }
        if (!end.equals(event.getEndDate())) {
            event.setEndDate(end);
            changed = true;
        }
        if (!regOpen.equals(event.getRegistrationOpenDate())) {
            event.setRegistrationOpenDate(regOpen);
            changed = true;
        }
        if (!regClose.equals(event.getRegistrationDeadline())) {
            event.setRegistrationDeadline(regClose);
            changed = true;
        }
        if (changed) {
            eventRepository.save(event);
        }

        roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId()).stream()
                .findFirst()
                .ifPresent(round -> {
                    LocalDateTime roundStart = start.atStartOfDay();
                    LocalDateTime roundEnd = end.atTime(23, 59);
                    LocalDateTime submissionEnd = end.minusDays(3).atTime(18, 0);
                    if (!roundStart.equals(round.getStartDate())
                            || !roundEnd.equals(round.getEndDate())
                            || !submissionEnd.equals(round.getSubmissionDeadline())) {
                        round.setStartDate(roundStart);
                        round.setEndDate(roundEnd);
                        round.setSubmissionDeadline(submissionEnd);
                        round.setScoringDeadline(roundEnd);
                        roundRepository.save(round);
                    }
                });
    }

    private void ensureTeamReady(UUID eventId) {
        teamRepository.findByEventId(eventId).stream()
                .filter(team -> TEAM_NAME.equals(team.getName()))
                .findFirst()
                .ifPresent(team -> {
                    if (team.getStatus() == TeamStatus.DISBANDED) {
                        return;
                    }
                    int size = teamMemberRepository.countByTeamId(team.getId());
                    if (size >= 3 && team.getStatus() != TeamStatus.CONFIRMED) {
                        team.setStatus(TeamStatus.CONFIRMED);
                        teamRepository.save(team);
                    }
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
                .enrolledAt(now.minusDays(2))
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
                    .joinedAt(now.minusDays(1))
                    .build());
        }
    }
}
