package com.sealhackathon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@Modulithic(sharedModules = {"common", "auth"})
@EnableAsync
@EnableScheduling
public class SealhackathonApplication {

    public static void main(String[] args) {
        SpringApplication.run(SealhackathonApplication.class, args);
    }
}
