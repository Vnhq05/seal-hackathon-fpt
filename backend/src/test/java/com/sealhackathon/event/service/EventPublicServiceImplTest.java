package com.sealhackathon.event.service;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventPublicServiceImplTest {

    @Mock private HackathonEventRepository eventRepository;
    @Mock private EventService eventService;
    @Mock private RoundRepository roundRepository;
    @Mock private CriteriaRepository criteriaRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private JudgeAssignmentRepository judgeAssignmentRepository;
    @Mock private MentorAssignmentRepository mentorAssignmentRepository;

    @InjectMocks private EventPublicServiceImpl eventPublicService;

    @Test
    void getRegistrationDeadline_shouldReturnEndOfDeadlineDay() {
        UUID eventId = UUID.randomUUID();
        LocalDate deadlineDate = LocalDate.of(2026, 6, 24);
        HackathonEvent event = HackathonEvent.builder()
                .registrationDeadline(deadlineDate)
                .build();
        event.setId(eventId);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        LocalDateTime deadline = eventPublicService.getRegistrationDeadline(eventId);

        assertThat(deadline).isEqualTo(deadlineDate.atTime(23, 59, 59));
    }
}
