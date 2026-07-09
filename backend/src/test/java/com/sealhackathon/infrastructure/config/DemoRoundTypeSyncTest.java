package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.RoundRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DemoRoundTypeSyncTest {

    @Mock private RoundRepository roundRepository;

    @InjectMocks private DemoRoundTypeSync demoRoundTypeSync;

    @Test
    void sync_shouldAssignPreliminaryAndFinal_whenMultipleRoundsMissingTypes() {
        HackathonEvent event = HackathonEvent.builder().name("Demo").build();
        event.setId(UUID.randomUUID());

        Round preliminary = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .build();
        preliminary.setId(UUID.randomUUID());

        Round finals = Round.builder()
                .hackathonEvent(event)
                .roundNumber(2)
                .name("Final Round")
                .build();
        finals.setId(UUID.randomUUID());

        demoRoundTypeSync.sync(List.of(preliminary, finals));

        ArgumentCaptor<Round> captor = ArgumentCaptor.forClass(Round.class);
        verify(roundRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(Round::getRoundType)
                .containsExactly(RoundType.PRELIMINARY, RoundType.FINAL);
    }

    @Test
    void syncAndReload_shouldPersistAndReturnUpdatedRounds() {
        UUID eventId = UUID.randomUUID();
        Round only = Round.builder().roundNumber(1).name("Round One").build();
        only.setId(UUID.randomUUID());

        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId))
                .thenReturn(List.of(only))
                .thenReturn(List.of(only));
        when(roundRepository.save(any(Round.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Round> result = demoRoundTypeSync.syncAndReload(eventId);

        assertThat(result).hasSize(1);
        verify(roundRepository).save(any(Round.class));
    }
}
