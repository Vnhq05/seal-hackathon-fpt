package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Dev-only: enrolls {@link DataSeeder#ALT_EVENT_TEST_STUDENT_EMAILS} into a non-demo event
 * so they are not blocked by the Fall Demo enrollment on student1–4.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class OtherEventStudentSeeder {

    private final HackathonEventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventEnrollmentRepository enrollmentRepository;

    @Transactional
    public void seed() {
        HackathonEvent event = eventRepository.findAll().stream()
                .filter(e -> DataSeeder.ALT_EVENT_TEST_STUDENT_TARGET_EVENT.equals(e.getName()))
                .findFirst()
                .orElse(null);
        if (event == null) {
            log.warn("Alt-event test student seeder: event '{}' not found — skip enrollments",
                    DataSeeder.ALT_EVENT_TEST_STUDENT_TARGET_EVENT);
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        int enrolled = 0;
        for (String email : DataSeeder.ALT_EVENT_TEST_STUDENT_EMAILS) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                log.warn("Alt-event test student seeder: user {} not found", email);
                continue;
            }
            if (enrollmentRepository.existsByUserIdAndEventId(user.getId(), event.getId())) {
                enrollmentRepository.findByUserIdAndEventId(user.getId(), event.getId()).ifPresent(existing -> {
                    if (existing.getStatus() != EnrollmentStatus.APPROVED) {
                        existing.setStatus(EnrollmentStatus.APPROVED);
                        enrollmentRepository.save(existing);
                    }
                });
                continue;
            }
            enrollmentRepository.save(EventEnrollment.builder()
                    .userId(user.getId())
                    .eventId(event.getId())
                    .status(EnrollmentStatus.APPROVED)
                    .enrolledAt(now)
                    .build());
            enrolled++;
        }

        log.info("Alt-event test students (password {}): {} — enrolled in '{}'",
                DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT,
                String.join(", ", DataSeeder.ALT_EVENT_TEST_STUDENT_EMAILS),
                event.getName());
        if (enrolled > 0) {
            log.info("Created {} new APPROVED enrollment(s) for '{}'", enrolled, event.getName());
        }
    }
}
