package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DemoRoundTypeSync {

    private final RoundRepository roundRepository;

    List<Round> syncAndReload(UUID eventId) {
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
        sync(rounds);
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId);
    }

    void sync(List<Round> rounds) {
        if (rounds.isEmpty()) {
            return;
        }

        if (rounds.size() == 1) {
            Round only = rounds.getFirst();
            if (only.getRoundType() == null) {
                only.setRoundType(RoundType.PRELIMINARY);
                roundRepository.save(only);
                log.info("Assigned roundType PRELIMINARY to '{}'", only.getName());
            }
            return;
        }

        Round first = rounds.getFirst();
        Round last = rounds.getLast();
        boolean changed = false;

        if (first.getRoundType() != RoundType.PRELIMINARY) {
            first.setRoundType(RoundType.PRELIMINARY);
            roundRepository.save(first);
            changed = true;
            log.info("Assigned roundType PRELIMINARY to '{}'", first.getName());
        }

        if (last.getId() != first.getId() && last.getRoundType() != RoundType.FINAL) {
            last.setRoundType(RoundType.FINAL);
            roundRepository.save(last);
            changed = true;
            log.info("Assigned roundType FINAL to '{}'", last.getName());
        }

        if (changed) {
            log.debug("Synced round types for {} round(s)", rounds.size());
        }
    }
}
