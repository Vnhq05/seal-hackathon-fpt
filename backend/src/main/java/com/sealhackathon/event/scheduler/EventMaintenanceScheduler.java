package com.sealhackathon.event.scheduler;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventMaintenanceScheduler {

    private final HackathonEventRepository eventRepository;
    private final TeamRepository teamRepository;

    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public void cancelEventsBelowMinTeamsOnStartDate() {
        LocalDate today = LocalDate.now();
        List<HackathonEvent> events = eventRepository.findStartingTodayWithMinTeam(today);

        for (HackathonEvent event : events) {
            long teamCount = teamRepository.countByEventId(event.getId());
            if (teamCount < event.getMinTeam()) {
                event.setStatus(EventStatus.CANCELLED);
                eventRepository.save(event);
                log.info("Cancelled event {} — only {} teams registered, minimum is {}",
                        event.getId(), teamCount, event.getMinTeam());
            }
        }
    }
}
