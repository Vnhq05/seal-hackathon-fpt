package com.sealhackathon.progress.scheduler;

import com.sealhackathon.progress.service.TeamProgressScanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class TeamProgressScheduler {

    private final TeamProgressScanService teamProgressScanService;

    @Scheduled(cron = "0 */15 6-23 * * *")
    @Transactional
    public void scanTeamProgress() {
        log.debug("Running scheduled team progress scan");
        teamProgressScanService.scanActiveRounds();
    }
}
