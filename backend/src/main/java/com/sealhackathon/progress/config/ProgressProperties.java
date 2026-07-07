package com.sealhackathon.progress.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class ProgressProperties {

    @Value("${app.progress.alert-lead-time-hours:6}")
    private int alertLeadTimeHours;

    @Value("${app.progress.stalled-hours:24}")
    private int stalledHours;

    @Value("${app.progress.cooldown-hours:12}")
    private int cooldownHours;
}
