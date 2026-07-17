package com.sealhackathon.event.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.request.DeactivateJudgeAssignmentRequest;
import com.sealhackathon.event.dto.request.ReplaceJudgeAssignmentRequest;
import com.sealhackathon.event.dto.response.IncompleteAssignmentScopeResponse;
import com.sealhackathon.event.dto.response.JudgeAssignmentResponse;
import com.sealhackathon.event.dto.response.JudgeWorkloadPreviewResponse;
import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.service.NotificationService;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JudgeAssignmentService {

    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final JudgeScoreRepository judgeScoreRepository;
    private final SubmissionRepository submissionRepository;
    private final RoundService roundService;
    private final EventJudgeService eventJudgeService;
    private final TrackRepository trackRepository;
    private final RoundRepository roundRepository;
    private final CompetitionGroupRepository competitionGroupRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final TeamPublicService teamPublicService;
    private final UserPublicService userPublicService;
    private final PublishedResultRepository publishedResultRepository;
    private final AuditService auditService;
    private final AuthPublicService authPublicService;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;

    private static final String GROUP_DELETED_REASON = "Competition group deleted";

    @Transactional
    public JudgeAssignmentResponse assignJudge(UUID eventId, UUID roundId, AssignJudgeRequest request, String ipAddress) {
        Round round = roundService.getRound(roundId);
        UUID resolvedEventId = round.getHackathonEvent().getId();
        if (!resolvedEventId.equals(eventId)) {
            throw new BusinessException("Round does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        assertNotPublished(roundId);
        ResolvedScope scope = resolveScope(round, request);

        UserSnapshot judge = userPublicService.findById(request.getJudgeUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getJudgeUserId()));
        if (judge.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "User " + judge.getEmail() + " is not a LECTURER. Role: " + judge.getUserType(),
                    HttpStatus.BAD_REQUEST) {};
        }
        if (!eventJudgeService.isEventJudge(resolvedEventId, request.getJudgeUserId())) {
            throw new BusinessException(
                    "Judge must be assigned to the event with role JUDGE or BOTH",
                    HttpStatus.BAD_REQUEST) {};
        }

        validateScopeHierarchy(resolvedEventId, round, scope);
        validateTeamsAssignedToGroups(resolvedEventId, scope);
        validateScopeOverlap(roundId, request.getJudgeUserId(), scope, null);
        validateNoConflictInScope(resolvedEventId, scope, request.getJudgeUserId());

        JudgeAssignment assignment = JudgeAssignment.builder()
                .round(round)
                .judgeUserId(request.getJudgeUserId())
                .scope(scope.scope())
                .trackId(scope.trackId())
                .groupId(scope.groupId())
                .active(true)
                .assignedAt(LocalDateTime.now())
                .build();
        assignment = judgeAssignmentRepository.save(assignment);

        UUID actorId = authPublicService.getCurrentUserId();
        auditService.log(actorId, "JUDGE_ASSIGNMENT_CREATED", assignment.getId(), "JudgeAssignment",
                null, toAuditJson(assignment, resolvedEventId, null), ipAddress);

        String warning = null;
        if (isScoringStarted(round)) {
            auditService.log(actorId, "JUDGE_ASSIGNED_AFTER_SCORING_STARTED", assignment.getId(), "JudgeAssignment",
                    null, toAuditJson(assignment, resolvedEventId, null), ipAddress);
            warning = "Scoring has already started for this round. The new judge can score unsubmitted teams immediately.";
        }

        sendJudgeAssignedNotification(assignment, round, resolvedEventId, judge);
        eventPublisher.publishEvent(new JudgeAssignedEvent(
                assignment.getId(), request.getJudgeUserId(), roundId, resolvedEventId));

        return toResponse(assignment, judge, resolvedEventId, warning,
                computeIncompleteScopes(round));
    }

    @Transactional(readOnly = true)
    public List<JudgeAssignmentResponse> getJudgesByRound(UUID eventId, UUID roundId, UUID trackId, UUID groupId) {
        Round round = roundService.getRound(roundId);
        if (!round.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Round does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        List<JudgeAssignment> assignments = judgeAssignmentRepository.findByRoundIdAndActiveTrue(roundId);
        if (groupId != null) {
            assignments = assignments.stream()
                    .filter(a -> a.getScope() == AssignmentScope.GROUP && groupId.equals(a.getGroupId()))
                    .toList();
        } else if (trackId != null) {
            assignments = assignments.stream()
                    .filter(a -> matchesTrackFilter(a, trackId))
                    .toList();
        }

        List<IncompleteAssignmentScopeResponse> incomplete = computeIncompleteScopes(round);
        return assignments.stream()
                .map(a -> {
                    UserSnapshot judge = userPublicService.findById(a.getJudgeUserId()).orElse(null);
                    return toResponse(a, judge, eventId, null, incomplete);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isJudgeAssignedToSubmissionScope(
            UUID roundId, UUID judgeUserId, UUID teamTrackId, UUID teamGroupId) {
        List<JudgeAssignment> assignments =
                judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(roundId, judgeUserId);
        for (JudgeAssignment assignment : assignments) {
            if (matchesTeamScope(assignment, teamTrackId, teamGroupId)) {
                return true;
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public boolean isJudgeAssignedToRoundScope(UUID roundId, UUID judgeUserId, UUID teamTrackId) {
        return isJudgeAssignedToSubmissionScope(roundId, judgeUserId, teamTrackId, null);
    }

    @Transactional(readOnly = true)
    public List<UUID> getEligibleJudgeUserIds(UUID roundId, UUID teamTrackId, UUID teamGroupId) {
        List<JudgeAssignment> assignments = judgeAssignmentRepository.findByRoundIdAndActiveTrue(roundId);
        Set<UUID> judgeIds = new HashSet<>();
        for (JudgeAssignment assignment : assignments) {
            if (coversTeam(assignment, teamTrackId, teamGroupId)) {
                judgeIds.add(assignment.getJudgeUserId());
            }
        }
        return judgeIds.stream().toList();
    }

    /**
     * Judges from the pool that actually count for a team: pool membership minus
     * conflict of interest. A judge mentoring the team is excluded (BR-29), so a
     * conflicted judge can never stall the team's scoring-complete count.
     */
    @Transactional(readOnly = true)
    public List<UUID> getEffectiveJudgeUserIdsForTeam(UUID roundId, UUID teamId,
                                                      UUID teamTrackId, UUID teamGroupId) {
        UUID eventId = teamTrackId == null
                ? null
                : teamRepository.findById(teamId).map(Team::getEventId).orElse(null);
        return getEligibleJudgeUserIds(roundId, teamTrackId, teamGroupId).stream()
                .filter(judgeUserId -> !hasConflictForTeam(
                        judgeUserId, teamId, eventId, teamTrackId))
                .toList();
    }

    /**
     * Batch form of {@link #getEffectiveJudgeUserIdsForTeam} keyed by team id, loading the
     * round's assignments once instead of per team.
     */
    @Transactional(readOnly = true)
    public Map<UUID, Long> countEffectiveJudgesByTeam(UUID roundId, List<Team> teams) {
        List<JudgeAssignment> assignments = judgeAssignmentRepository.findByRoundIdAndActiveTrue(roundId);
        Map<UUID, Long> counts = new LinkedHashMap<>();
        for (Team team : teams) {
            Set<UUID> judgeIds = new HashSet<>();
            for (JudgeAssignment assignment : assignments) {
                if (coversTeam(assignment, team.getTrackId(), team.getGroupId())
                        && !hasConflictForTeam(
                                assignment.getJudgeUserId(), team.getId(),
                                team.getEventId(), team.getTrackId())) {
                    judgeIds.add(assignment.getJudgeUserId());
                }
            }
            counts.put(team.getId(), (long) judgeIds.size());
        }
        return counts;
    }

    @Transactional
    public void removeJudgeAssignment(UUID assignmentId, String ipAddress) {
        JudgeAssignment assignment = getAssignment(assignmentId);
        assertNotPublished(assignment.getRound().getId());
        assertMutationsAllowed(assignment);

        if (hasScoresInScope(assignment)) {
            throw new BusinessException(
                    "Cannot remove judge assignment: judge has already submitted scores in this scope. Use deactivate instead.",
                    HttpStatus.BAD_REQUEST) {};
        }

        UUID eventId = assignment.getRound().getHackathonEvent().getId();
        String oldValue = toAuditJson(assignment, eventId, null);
        judgeAssignmentRepository.delete(assignment);

        auditService.log(authPublicService.getCurrentUserId(), "JUDGE_ASSIGNMENT_DELETED",
                assignmentId, "JudgeAssignment", oldValue, null, ipAddress);
        notifyJudgeRemoved(assignment, eventId);
    }

    @Transactional
    public JudgeAssignmentResponse deactivateAssignment(
            UUID assignmentId, DeactivateJudgeAssignmentRequest request, String ipAddress) {
        JudgeAssignment assignment = getAssignment(assignmentId);
        assertNotPublished(assignment.getRound().getId());
        assertMutationsAllowed(assignment);

        UUID resolvedEventId = assignment.getRound().getHackathonEvent().getId();
        String oldValue = toAuditJson(assignment, resolvedEventId, null);

        assignment.setActive(false);
        assignment.setDeactivatedAt(LocalDateTime.now());
        assignment.setDeactivationReason(request.getReason());
        assignment = judgeAssignmentRepository.save(assignment);

        auditService.log(authPublicService.getCurrentUserId(), "JUDGE_ASSIGNMENT_DEACTIVATED",
                assignmentId, "JudgeAssignment", oldValue,
                toAuditJson(assignment, resolvedEventId, request.getReason()), ipAddress);
        notifyJudgeRemoved(assignment, resolvedEventId);

        UserSnapshot judge = userPublicService.findById(assignment.getJudgeUserId()).orElse(null);
        return toResponse(assignment, judge, resolvedEventId, null, computeIncompleteScopes(assignment.getRound()));
    }

    /**
     * Retires the judge assignments of a group that is being deleted: their scope stops existing,
     * and left active they show up as judges of a dead group and skew coverage warnings.
     *
     * <p>Deactivates instead of deleting, because a judge may already have scored under the
     * assignment — the same reason {@link #removeJudgeAssignment} refuses to delete scored ones.
     * Unlike {@link #deactivateAssignment} this skips the published/mutable guards: the caller has
     * already decided the group goes, so these rows cannot be left behind pointing at nothing.
     */
    @Transactional
    public void deactivateAssignmentsForDeletedGroup(UUID groupId, String ipAddress) {
        for (JudgeAssignment assignment : judgeAssignmentRepository.findByGroupIdAndActiveTrue(groupId)) {
            UUID eventId = assignment.getRound().getHackathonEvent().getId();
            String oldValue = toAuditJson(assignment, eventId, null);

            assignment.setActive(false);
            assignment.setDeactivatedAt(LocalDateTime.now());
            assignment.setDeactivationReason(GROUP_DELETED_REASON);
            judgeAssignmentRepository.save(assignment);

            auditService.log(authPublicService.getCurrentUserId(), "JUDGE_ASSIGNMENT_DEACTIVATED",
                    assignment.getId(), "JudgeAssignment", oldValue,
                    toAuditJson(assignment, eventId, GROUP_DELETED_REASON), ipAddress);
            notifyJudgeRemoved(assignment, eventId);
        }
    }

    @Transactional
    public JudgeAssignmentResponse activateAssignment(UUID assignmentId, String ipAddress) {
        JudgeAssignment assignment = getAssignment(assignmentId);
        assertNotPublished(assignment.getRound().getId());
        assertMutationsAllowed(assignment);

        UUID eventId = assignment.getRound().getHackathonEvent().getId();
        ResolvedScope scope = new ResolvedScope(assignment.getScope(), assignment.getTrackId(), assignment.getGroupId());
        validateScopeHierarchy(eventId, assignment.getRound(), scope);
        validateTeamsAssignedToGroups(eventId, scope);
        validateScopeOverlap(assignment.getRound().getId(), assignment.getJudgeUserId(), scope, assignment.getId());
        validateNoConflictInScope(eventId, scope, assignment.getJudgeUserId());

        String oldValue = toAuditJson(assignment, eventId, assignment.getDeactivationReason());
        assignment.setActive(true);
        assignment.setDeactivatedAt(null);
        assignment.setDeactivationReason(null);
        assignment = judgeAssignmentRepository.save(assignment);

        auditService.log(authPublicService.getCurrentUserId(), "JUDGE_ASSIGNMENT_ACTIVATED",
                assignmentId, "JudgeAssignment", oldValue, toAuditJson(assignment, eventId, null), ipAddress);

        UserSnapshot judge = userPublicService.findById(assignment.getJudgeUserId()).orElse(null);
        return toResponse(assignment, judge, eventId, null, computeIncompleteScopes(assignment.getRound()));
    }

    @Transactional
    public JudgeAssignmentResponse replaceAssignment(
            UUID assignmentId, ReplaceJudgeAssignmentRequest request, String ipAddress) {
        JudgeAssignment oldAssignment = getAssignment(assignmentId);
        assertNotPublished(oldAssignment.getRound().getId());
        assertMutationsAllowed(oldAssignment);

        deactivateAssignment(assignmentId, DeactivateJudgeAssignmentRequest.builder()
                .reason("Replaced by " + request.getNewJudgeUserId() + ": " + request.getReason())
                .build(), ipAddress);

        AssignJudgeRequest createRequest = AssignJudgeRequest.builder()
                .judgeUserId(request.getNewJudgeUserId())
                .scope(oldAssignment.getScope())
                .trackId(oldAssignment.getTrackId())
                .groupId(oldAssignment.getGroupId())
                .build();

        UUID eventId = oldAssignment.getRound().getHackathonEvent().getId();
        JudgeAssignmentResponse created = assignJudge(
                eventId, oldAssignment.getRound().getId(), createRequest, ipAddress);

        auditService.log(authPublicService.getCurrentUserId(), "JUDGE_REPLACED",
                assignmentId, "JudgeAssignment",
                toAuditJson(oldAssignment, eventId, request.getReason()),
                "{\"newAssignmentId\":\"" + created.getId() + "\"}", ipAddress);

        return created;
    }

    @Transactional(readOnly = true)
    public JudgeWorkloadPreviewResponse previewWorkload(
            UUID eventId, UUID roundId, AssignmentScope scope, UUID trackId, UUID groupId) {
        Round round = roundService.getRound(roundId);
        if (!round.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Round does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        ResolvedScope resolved = resolveScope(round, AssignJudgeRequest.builder()
                .scope(scope).trackId(trackId).groupId(groupId).build());
        validateScopeHierarchy(eventId, round, resolved);

        List<Team> teams = teamsInScope(eventId, resolved);
        int submissionCount = (int) teams.stream()
                .filter(t -> submissionRepository.findByTeamIdAndRoundId(t.getId(), roundId).isPresent())
                .count();

        return JudgeWorkloadPreviewResponse.builder()
                .scope(resolved.scope())
                .trackId(resolved.trackId())
                .groupId(resolved.groupId())
                .teamCount(teams.size())
                .submissionCount(submissionCount)
                .build();
    }

    @Transactional(readOnly = true)
    public void assertEventReadyForScoring(UUID eventId) {
        validateTeamsAssignedToGroups(
                eventId, new ResolvedScope(AssignmentScope.ROUND, null, null));
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        for (Round round : rounds) {
            List<IncompleteAssignmentScopeResponse> incomplete = computeIncompleteScopes(round);
            if (!incomplete.isEmpty()) {
                throw new BusinessException(
                        "Cannot start scoring: round \"" + round.getName()
                                + "\" has scopes with fewer than the required minimum judges.",
                        HttpStatus.CONFLICT) {};
            }
        }
    }

    @Transactional(readOnly = true)
    public List<IncompleteAssignmentScopeResponse> computeIncompleteScopesForGroupInEvent(
            UUID eventId, UUID groupId) {
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .flatMap(round -> computeIncompleteScopesForGroup(eventId, round.getId(), groupId).stream())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncompleteAssignmentScopeResponse> computeIncompleteScopesForGroup(
            UUID eventId, UUID roundId, UUID groupId) {
        Round round = roundService.getRound(roundId);
        CompetitionGroup group = competitionGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionGroup", "id", groupId));
        int minJudges = round.getMinJudgesPerRound() != null ? round.getMinJudgesPerRound() : 2;
        int count = countEffectiveJudgesCoveringScope(
                eventId, roundId, AssignmentScope.GROUP, group.getTrackId(), groupId);
        if (count >= minJudges) {
            return List.of();
        }
        String trackName = getTrackName(eventId, group.getTrackId());
        return List.of(IncompleteAssignmentScopeResponse.builder()
                .scope(AssignmentScope.GROUP)
                .trackId(group.getTrackId())
                .trackName(trackName)
                .groupId(groupId)
                .groupName(group.getName())
                .judgeCount(count)
                .minJudgesRequired(minJudges)
                .build());
    }

    @Transactional(readOnly = true)
    public List<IncompleteAssignmentScopeResponse> computeIncompleteScopes(UUID roundId) {
        return computeIncompleteScopes(roundService.getRound(roundId));
    }

    @Transactional(readOnly = true)
    public List<IncompleteAssignmentScopeResponse> computeIncompleteScopes(Round round) {
        UUID eventId = round.getHackathonEvent().getId();
        int minJudges = round.getMinJudgesPerRound() != null ? round.getMinJudgesPerRound() : 2;
        Map<String, IncompleteAssignmentScopeResponse> scopes = new LinkedHashMap<>();

        List<Track> tracks = trackRepository.findByHackathonEventId(eventId);
        for (Track track : tracks) {
            List<CompetitionGroup> groups = competitionGroupRepository.findByTrackIdOrderByNameAsc(track.getId());
            if (!groups.isEmpty()) {
                for (CompetitionGroup group : groups) {
                    addIncompleteScope(scopes, round.getId(), eventId, AssignmentScope.GROUP,
                            track.getId(), track.getName(), group.getId(), group.getName(), minJudges);
                }
            } else {
                addIncompleteScope(scopes, round.getId(), eventId, AssignmentScope.TRACK,
                        track.getId(), track.getName(), null, null, minJudges);
            }
        }

        if (tracks.isEmpty()) {
            addIncompleteScope(scopes, round.getId(), eventId, AssignmentScope.ROUND,
                    null, null, null, null, minJudges);
        }

        return scopes.values().stream()
                .filter(s -> s.getJudgeCount() < s.getMinJudgesRequired())
                .toList();
    }

    private void addIncompleteScope(
            Map<String, IncompleteAssignmentScopeResponse> scopes,
            UUID roundId, UUID eventId, AssignmentScope scope,
            UUID trackId, String trackName, UUID groupId, String groupName, int minJudges) {
        int count = countEffectiveJudgesCoveringScope(
                eventId, roundId, scope, trackId, groupId);
        String key = scope + ":" + trackId + ":" + groupId;
        scopes.put(key, IncompleteAssignmentScopeResponse.builder()
                .scope(scope)
                .trackId(trackId)
                .trackName(trackName)
                .groupId(groupId)
                .groupName(groupName)
                .judgeCount(count)
                .minJudgesRequired(minJudges)
                .build());
    }

    private int countJudgesCoveringScope(UUID roundId, AssignmentScope scope, UUID trackId, UUID groupId) {
        List<JudgeAssignment> assignments = judgeAssignmentRepository.findByRoundIdAndActiveTrue(roundId);
        Set<UUID> judges = new HashSet<>();
        for (JudgeAssignment assignment : assignments) {
            if (coversScopeUnit(assignment, scope, trackId, groupId)) {
                judges.add(assignment.getJudgeUserId());
            }
        }
        return judges.size();
    }

    private int countEffectiveJudgesCoveringScope(
            UUID eventId, UUID roundId, AssignmentScope scope, UUID trackId, UUID groupId) {
        List<Team> teams = switch (scope) {
            case ROUND -> teamRepository.findByEventId(eventId);
            case TRACK -> teamRepository.findByEventIdAndTrackId(eventId, trackId);
            case GROUP -> teamRepository.findByEventIdAndGroupId(eventId, groupId);
        };
        teams = teams.stream()
                .filter(team -> team.getStatus() != TeamStatus.DISBANDED)
                .toList();
        if (teams.isEmpty()) {
            return countJudgesCoveringScope(roundId, scope, trackId, groupId);
        }
        return countEffectiveJudgesByTeam(roundId, teams).values().stream()
                .mapToInt(Long::intValue)
                .min()
                .orElse(0);
    }

    private boolean coversScopeUnit(JudgeAssignment assignment, AssignmentScope unitScope, UUID trackId, UUID groupId) {
        return switch (unitScope) {
            case ROUND -> assignment.getScope() == AssignmentScope.ROUND;
            case TRACK -> assignment.getScope() == AssignmentScope.ROUND
                    || (assignment.getScope() == AssignmentScope.TRACK && trackId != null
                    && trackId.equals(assignment.getTrackId()));
            case GROUP -> assignment.getScope() == AssignmentScope.ROUND
                    || (assignment.getScope() == AssignmentScope.TRACK && trackId != null
                    && trackId.equals(assignment.getTrackId()))
                    || (assignment.getScope() == AssignmentScope.GROUP && groupId != null
                    && groupId.equals(assignment.getGroupId()));
        };
    }

    private boolean coversTeam(JudgeAssignment assignment, UUID teamTrackId, UUID teamGroupId) {
        return switch (assignment.getScope()) {
            case ROUND -> true;
            case TRACK -> teamTrackId != null && teamTrackId.equals(assignment.getTrackId());
            case GROUP -> teamGroupId != null && teamGroupId.equals(assignment.getGroupId());
        };
    }

    private boolean matchesTeamScope(JudgeAssignment assignment, UUID teamTrackId, UUID teamGroupId) {
        return coversTeam(assignment, teamTrackId, teamGroupId);
    }

    private boolean matchesTrackFilter(JudgeAssignment assignment, UUID trackId) {
        return assignment.getScope() == AssignmentScope.ROUND
                || (assignment.getScope() == AssignmentScope.TRACK && trackId.equals(assignment.getTrackId()))
                || (assignment.getScope() == AssignmentScope.GROUP && trackId.equals(assignment.getTrackId()));
    }

    private List<Team> teamsInScope(UUID eventId, ResolvedScope scope) {
        return switch (scope.scope()) {
            case ROUND -> teamRepository.findByEventId(eventId);
            case TRACK -> teamRepository.findByEventIdAndTrackId(eventId, scope.trackId());
            case GROUP -> teamRepository.findByEventIdAndGroupId(eventId, scope.groupId());
        };
    }

    private void validateScopeHierarchy(UUID eventId, Round round, ResolvedScope scope) {
        if (round.getRoundType() == RoundType.FINAL && scope.scope() != AssignmentScope.ROUND) {
            throw new BusinessException(
                    "Final rounds only support ROUND scope assignments",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (scope.scope() == AssignmentScope.GROUP && scope.trackId() == null) {
            throw new BusinessException("Select a track before choosing a group", HttpStatus.BAD_REQUEST) {};
        }
        if (scope.trackId() != null) {
            validateTrackBelongsToEvent(eventId, scope.trackId());
        }
        if (scope.groupId() != null) {
            CompetitionGroup group = competitionGroupRepository.findByIdAndTrackId(scope.groupId(), scope.trackId())
                    .orElseThrow(() -> new BusinessException(
                            "Group does not belong to the selected track", HttpStatus.BAD_REQUEST) {});
            if (!group.getTrackId().equals(scope.trackId())) {
                throw new BusinessException("Group does not belong to the selected track", HttpStatus.BAD_REQUEST) {};
            }
        }
    }

    private void validateScopeOverlap(
            UUID roundId, UUID judgeUserId, ResolvedScope newScope, UUID excludeAssignmentId) {
        List<JudgeAssignment> existing = judgeAssignmentRepository.findByRoundIdAndJudgeUserIdAndActiveTrue(
                roundId, judgeUserId).stream()
                .filter(a -> excludeAssignmentId == null || !excludeAssignmentId.equals(a.getId()))
                .toList();

        for (JudgeAssignment assignment : existing) {
            if (assignment.getScope() == AssignmentScope.ROUND || newScope.scope() == AssignmentScope.ROUND) {
                throw new BusinessException(
                        "Judge already has a ROUND-level assignment in this round. Remove it first.",
                        HttpStatus.CONFLICT) {};
            }
            if (assignment.getScope() == AssignmentScope.TRACK && newScope.scope() == AssignmentScope.TRACK
                    && assignment.getTrackId().equals(newScope.trackId())) {
                throw new DuplicateResourceException("JudgeAssignment", "judge+round+track",
                        judgeUserId + " in track " + newScope.trackId());
            }
            if (assignment.getScope() == AssignmentScope.GROUP && newScope.scope() == AssignmentScope.GROUP
                    && assignment.getGroupId().equals(newScope.groupId())) {
                throw new DuplicateResourceException("JudgeAssignment", "judge+round+group",
                        judgeUserId + " in group " + newScope.groupId());
            }
            if (assignment.getScope() == AssignmentScope.TRACK && newScope.scope() == AssignmentScope.GROUP
                    && assignment.getTrackId().equals(newScope.trackId())) {
                throw new BusinessException(
                        "Judge already assigned to the entire track. Remove track assignment before assigning a group.",
                        HttpStatus.CONFLICT) {};
            }
            if (assignment.getScope() == AssignmentScope.GROUP && newScope.scope() == AssignmentScope.TRACK
                    && assignment.getTrackId().equals(newScope.trackId())) {
                throw new BusinessException(
                        "Judge already has group assignments in this track. Remove them before assigning the whole track.",
                        HttpStatus.CONFLICT) {};
            }
        }
    }

    private void validateNoConflictInScope(UUID eventId, ResolvedScope scope, UUID judgeUserId) {
        for (Team team : teamsInScope(eventId, scope)) {
            if (team.getTrackId() != null && mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                    eventId, team.getTrackId(), judgeUserId)) {
                throw new BusinessException(
                        "Cannot assign judge who is mentor of track containing team " + team.getName(),
                        HttpStatus.CONFLICT) {};
            }
            if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), judgeUserId)) {
                throw new BusinessException(
                        "Cannot assign judge who is a member of team " + team.getName(),
                        HttpStatus.CONFLICT) {};
            }
        }
    }

    private boolean hasConflictForTeam(
            UUID judgeUserId, UUID teamId, UUID eventId, UUID trackId) {
        if (teamPublicService.isMentorOfTeam(judgeUserId, teamId)
                || teamMemberRepository.existsByTeamIdAndUserId(teamId, judgeUserId)) {
            return true;
        }
        if (eventId == null || trackId == null) {
            return false;
        }
        return mentorAssignmentRepository
                .existsByHackathonEventIdAndTrackIdAndMentorUserId(
                        eventId, trackId, judgeUserId);
    }

    private void validateTeamsAssignedToGroups(UUID eventId, ResolvedScope scope) {
        List<Team> candidateTeams = switch (scope.scope()) {
            case ROUND -> teamRepository.findByEventId(eventId);
            case TRACK, GROUP -> teamRepository.findByEventIdAndTrackId(eventId, scope.trackId());
        };
        List<Team> missingGroups = candidateTeams.stream()
                .filter(team -> team.getStatus() != TeamStatus.DISBANDED)
                .filter(team -> team.getGroupId() == null)
                .toList();
        if (missingGroups.isEmpty()) {
            return;
        }
        String teamNames = missingGroups.stream()
                .map(Team::getName)
                .limit(5)
                .collect(Collectors.joining(", "));
        if (missingGroups.size() > 5) {
            teamNames += " (+" + (missingGroups.size() - 5) + " more)";
        }
        throw new BusinessException(
                "Assign every team to a competition group before assigning judges. Missing: "
                        + teamNames,
                HttpStatus.CONFLICT) {};
    }

    private boolean hasScoresInScope(JudgeAssignment assignment) {
        UUID roundId = assignment.getRound().getId();
        UUID eventId = assignment.getRound().getHackathonEvent().getId();
        ResolvedScope scope = new ResolvedScope(assignment.getScope(), assignment.getTrackId(), assignment.getGroupId());
        for (Team team : teamsInScope(eventId, scope)) {
            if (judgeScoreRepository.existsByJudgeUserIdAndRoundIdAndTeamId(
                    assignment.getJudgeUserId(), roundId, team.getId())) {
                return true;
            }
        }
        return false;
    }

    private ResolvedScope resolveScope(Round round, AssignJudgeRequest request) {
        if (round.getRoundType() == RoundType.FINAL
                && (request.getTrackId() != null || request.getGroupId() != null)) {
            throw new BusinessException(
                    "Final rounds are scored across the whole round; trackId and groupId must not be sent",
                    HttpStatus.BAD_REQUEST) {};
        }
        AssignmentScope scope = request.getScope();
        if (scope == null) {
            if (round.getRoundType() == RoundType.FINAL) {
                scope = AssignmentScope.ROUND;
            } else if (request.getGroupId() != null) {
                scope = AssignmentScope.GROUP;
            } else if (request.getTrackId() != null) {
                scope = AssignmentScope.TRACK;
            } else {
                scope = AssignmentScope.ROUND;
            }
        }
        UUID trackId = scope == AssignmentScope.ROUND ? null : request.getTrackId();
        UUID groupId = scope == AssignmentScope.GROUP ? request.getGroupId() : null;
        if (scope == AssignmentScope.TRACK && trackId == null) {
            throw new BusinessException("trackId is required for TRACK scope", HttpStatus.BAD_REQUEST) {};
        }
        if (scope == AssignmentScope.GROUP && (trackId == null || groupId == null)) {
            throw new BusinessException("trackId and groupId are required for GROUP scope", HttpStatus.BAD_REQUEST) {};
        }
        return new ResolvedScope(scope, trackId, groupId);
    }

    private void assertNotPublished(UUID roundId) {
        if (publishedResultRepository.existsByRoundId(roundId)) {
            throw new BusinessException(
                    "Cannot change assignments after results have been published.",
                    HttpStatus.CONFLICT) {};
        }
    }

    private void assertMutationsAllowed(JudgeAssignment assignment) {
        // placeholder for additional guards
    }

    private boolean isScoringStarted(Round round) {
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(round.getStartDate()) && !now.isAfter(round.getScoringDeadline());
    }

    private JudgeAssignment getAssignment(UUID assignmentId) {
        return judgeAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("JudgeAssignment", "id", assignmentId));
    }

    private void validateTrackBelongsToEvent(UUID eventId, UUID trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("Track", "id", trackId);
        }
    }

    private JudgeAssignmentResponse toResponse(
            JudgeAssignment assignment, UserSnapshot judge, UUID eventId,
            String warning, List<IncompleteAssignmentScopeResponse> incompleteScopes) {
        String trackName = assignment.getTrackId() != null
                ? getTrackName(eventId, assignment.getTrackId()) : null;
        String groupName = assignment.getGroupId() != null
                ? competitionGroupRepository.findById(assignment.getGroupId())
                        .map(CompetitionGroup::getName).orElse(null) : null;

        ResolvedScope scope = new ResolvedScope(assignment.getScope(), assignment.getTrackId(), assignment.getGroupId());
        List<Team> teams = teamsInScope(eventId, scope);
        int submissionCount = (int) teams.stream()
                .filter(t -> submissionRepository.findByTeamIdAndRoundId(
                        t.getId(), assignment.getRound().getId()).isPresent())
                .count();

        boolean conflictRisk = teams.stream().anyMatch(team ->
                teamPublicService.isMentorOfTeam(assignment.getJudgeUserId(), team.getId())
                        || (team.getTrackId() != null && mentorAssignmentRepository
                                .existsByHackathonEventIdAndTrackIdAndMentorUserId(
                                        eventId, team.getTrackId(), assignment.getJudgeUserId()))
                        || teamMemberRepository.existsByTeamIdAndUserId(team.getId(), assignment.getJudgeUserId()));

        return JudgeAssignmentResponse.builder()
                .id(assignment.getId())
                .roundId(assignment.getRound().getId())
                .scope(assignment.getScope())
                .trackId(assignment.getTrackId())
                .trackName(trackName)
                .groupId(assignment.getGroupId())
                .groupName(groupName)
                .judgeUserId(assignment.getJudgeUserId())
                .judgeFullName(judge != null ? judge.getFullName() : null)
                .judgeEmail(judge != null ? judge.getEmail() : null)
                .active(assignment.isActive())
                .assignedAt(assignment.getAssignedAt())
                .deactivatedAt(assignment.getDeactivatedAt())
                .deactivationReason(assignment.getDeactivationReason())
                .expectedTeamCount(teams.size())
                .expectedSubmissionCount(submissionCount)
                .conflictRisk(conflictRisk)
                .warning(warning)
                .incompleteScopes(incompleteScopes)
                .build();
    }

    private String getTrackName(UUID eventId, UUID trackId) {
        return trackRepository.findByHackathonEventId(eventId).stream()
                .filter(t -> t.getId().equals(trackId))
                .map(Track::getName)
                .findFirst()
                .orElse(null);
    }

    private String toAuditJson(JudgeAssignment assignment, UUID eventId, String reason) {
        return "{\"eventId\":\"" + eventId
                + "\",\"judgeUserId\":\"" + assignment.getJudgeUserId()
                + "\",\"roundId\":\"" + assignment.getRound().getId()
                + "\",\"scope\":\"" + assignment.getScope()
                + "\",\"trackId\":" + (assignment.getTrackId() != null ? "\"" + assignment.getTrackId() + "\"" : "null")
                + ",\"groupId\":" + (assignment.getGroupId() != null ? "\"" + assignment.getGroupId() + "\"" : "null")
                + ",\"active\":" + assignment.isActive()
                + (reason != null ? ",\"reason\":\"" + reason.replace("\"", "'") + "\"" : "")
                + "}";
    }

    private void sendJudgeAssignedNotification(
            JudgeAssignment assignment, Round round, UUID eventId, UserSnapshot judge) {
        ResolvedScope scope = new ResolvedScope(assignment.getScope(), assignment.getTrackId(), assignment.getGroupId());
        JudgeWorkloadPreviewResponse workload = previewWorkload(
                eventId, round.getId(), scope.scope(), scope.trackId(), scope.groupId());
        String scopeLabel = scope.scope().name();
        notificationService.createNotification(
                NotificationType.JUDGE_ASSIGNED,
                "Judge assignment: " + round.getName(),
                "You have been assigned to " + scopeLabel + " for " + round.getName()
                        + ". Expected submissions: " + workload.getSubmissionCount()
                        + ". Scoring deadline: " + round.getScoringDeadline(),
                assignment.getId(),
                "JudgeAssignment",
                List.of(assignment.getJudgeUserId()));
    }

    private void notifyJudgeRemoved(JudgeAssignment assignment, UUID eventId) {
        notificationService.createNotification(
                NotificationType.JUDGE_ASSIGNMENT_REMOVED,
                "Judge assignment removed",
                "Your judge assignment for round " + assignment.getRound().getName() + " has been removed or deactivated.",
                assignment.getId(),
                "JudgeAssignment",
                List.of(assignment.getJudgeUserId()));
    }

    private record ResolvedScope(AssignmentScope scope, UUID trackId, UUID groupId) {}
}
