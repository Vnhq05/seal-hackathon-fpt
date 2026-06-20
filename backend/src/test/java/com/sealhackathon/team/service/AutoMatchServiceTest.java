package com.sealhackathon.team.service;

import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoMatchServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private AutoMatchService autoMatchService;

    @Test
    void autoMatch_shouldCreateTeams_fromUnassignedUsers() {
        UUID eventId = UUID.randomUUID();
        List<UUID> users = IntStream.range(0, 8).mapToObj(i -> UUID.randomUUID()).toList();

        when(teamRepository.save(any(Team.class))).thenAnswer(i -> {
            Team t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(teamMemberRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        List<Team> created = autoMatchService.autoMatch(eventId, users);

        assertThat(created).hasSizeGreaterThanOrEqualTo(2);
        created.forEach(t -> assertThat(t.getStatus()).isEqualTo(TeamStatus.CONFIRMED));
    }

    @Test
    void autoMatch_shouldReturnEmpty_whenTooFewUsers() {
        List<Team> result = autoMatchService.autoMatch(UUID.randomUUID(),
                List.of(UUID.randomUUID(), UUID.randomUUID()));
        assertThat(result).isEmpty();
    }

    @Test
    void autoMatch_shouldHandleExactly3Users() {
        UUID eventId = UUID.randomUUID();
        List<UUID> users = IntStream.range(0, 3).mapToObj(i -> UUID.randomUUID()).toList();

        when(teamRepository.save(any(Team.class))).thenAnswer(i -> {
            Team t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });
        when(teamMemberRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        List<Team> created = autoMatchService.autoMatch(eventId, users);

        assertThat(created).hasSize(1);
    }
}
