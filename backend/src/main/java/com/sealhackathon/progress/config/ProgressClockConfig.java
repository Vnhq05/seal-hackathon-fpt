package com.sealhackathon.progress.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class ProgressClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
