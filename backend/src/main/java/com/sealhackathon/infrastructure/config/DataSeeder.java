package com.sealhackathon.infrastructure.config;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("admin@seal.com", "System Admin", UserType.SYSTEM_ADMIN, null);
        seedUser("coordinator@seal.com", "Event Coordinator", UserType.EVENT_COORDINATOR, null);

        seedUser("lecturer1@fpt.edu.vn", "Nguyen Van A", UserType.LECTURER, null);
        seedUser("lecturer2@fpt.edu.vn", "Tran Thi B", UserType.LECTURER, null);
        seedUser("lecturer3@fpt.edu.vn", "Le Van C", UserType.LECTURER, null);
        seedUser("lecturer4@fpt.edu.vn", "Pham Thi D", UserType.LECTURER, null);
        seedUser("lecturer5@fpt.edu.vn", "Hoang Van E", UserType.LECTURER, null);

        seedUser("student1@fpt.edu.vn", "Sinh Vien 1", UserType.FPT_STUDENT, 5);
        seedUser("student2@fpt.edu.vn", "Sinh Vien 2", UserType.FPT_STUDENT, 6);
        seedUser("student3@fpt.edu.vn", "Sinh Vien 3", UserType.FPT_STUDENT, 5);
    }

    private void seedUser(String email, String fullName, UserType userType, Integer semester) {
        if (userRepository.existsByEmail(email)) return;

        User.UserBuilder builder = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("123456"))
                .fullName(fullName)
                .userType(userType)
                .status(AccountStatus.ACTIVE);

        if (userType == UserType.FPT_STUDENT) {
            String idNum = email.replaceAll("[^0-9]", "");
            builder.studentId("SE19100" + idNum);
            builder.semester(semester);
        }

        userRepository.save(builder.build());
        log.info("Seeded account: {} / 123456 [{}]", email, userType);
    }
}
