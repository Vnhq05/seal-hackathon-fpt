package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.event.MemberJoinedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.event.TeamCreatedEvent;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AutoMatchService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final int TARGET_TEAM_SIZE = 4;
    private static final int MIN_TEAM_SIZE = 3;

    @Transactional
    public List<Team> autoMatch(UUID eventId, List<UUID> unassignedUserIds) {
        if (unassignedUserIds.size() < MIN_TEAM_SIZE) {
            return List.of();
        }

        List<UUID> shuffled = new ArrayList<>(unassignedUserIds);
        Collections.shuffle(shuffled);

        List<Team> created = new ArrayList<>();
        int i = 0;

        while (i + MIN_TEAM_SIZE <= shuffled.size()) {
            int remaining = shuffled.size() - i;
            int groupSize = Math.min(TARGET_TEAM_SIZE, remaining);

            // Avoid leaving < MIN_TEAM_SIZE stragglers
            if (remaining - groupSize > 0 && remaining - groupSize < MIN_TEAM_SIZE) {
                groupSize = remaining / 2;
                if (groupSize < MIN_TEAM_SIZE) {
                    groupSize = MIN_TEAM_SIZE;
                }
            }

            List<UUID> group = shuffled.subList(i, i + groupSize);
            UUID leaderId = group.get(0);

            Team team = Team.builder()
                    .eventId(eventId)
                    .name("Auto Team " + (created.size() + 1))
                    .leaderId(leaderId)
                    .status(groupSize >= MIN_TEAM_SIZE ? TeamStatus.CONFIRMED : TeamStatus.FORMING)
                    .build();
            team = teamRepository.save(team);

            for (int j = 0; j < group.size(); j++) {
                UUID userId = group.get(j);
                TeamMember member = TeamMember.builder()
                        .team(team)
                        .userId(userId)
                        .role(j == 0 ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER)
                        .joinedAt(LocalDateTime.now())
                        .build();
                teamMemberRepository.save(member);

                eventPublisher.publishEvent(new MemberJoinedEvent(
                        team.getId(), userId,
                        j == 0 ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER));
            }

            eventPublisher.publishEvent(new TeamCreatedEvent(
                    team.getId(), eventId, leaderId, team.getName()));

            if (team.getStatus() == TeamStatus.CONFIRMED) {
                eventPublisher.publishEvent(new TeamConfirmedEvent(team.getId(), groupSize));
            }

            created.add(team);
            i += groupSize;
        }

        return created;
    }
}
