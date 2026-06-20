package com.sealhackathon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@SpringBootApplication
@Modulithic(sharedModules = {"common", "auth"})
public class SealhackathonApplication {

    public static void main(String[] args) {
        SpringApplication.run(SealhackathonApplication.class, args);
    }
}
