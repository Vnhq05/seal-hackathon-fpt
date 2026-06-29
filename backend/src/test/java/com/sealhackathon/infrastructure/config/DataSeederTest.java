package com.sealhackathon.infrastructure.config;

import com.sealhackathon.common.domain.SystemConfig;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.repository.SystemConfigRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ScoringTemplateRepository scoringTemplateRepository;
    @Mock private SystemConfigRepository systemConfigRepository;
    @Mock private EventDemoSeeder eventDemoSeeder;
    @Mock private JudgingDemoSeeder judgingDemoSeeder;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private TransactionTemplate transactionTemplate;

    @InjectMocks private DataSeeder dataSeeder;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(dataSeeder, "resyncDevAccounts", true);
        lenient().doAnswer(invocation -> {
            invocation.getArgument(0, java.util.function.Consumer.class).accept(null);
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
        when(systemConfigRepository.findFirstBy()).thenReturn(Optional.of(
                SystemConfig.builder().defaultRules("rules").build()));
        when(scoringTemplateRepository.count()).thenReturn(1L);
    }

    @Test
    void run_shouldResyncExistingDevAccount_whenPasswordAndStatusStale() {
        User staleCoordinator = User.builder()
                .email("coordinator@seal.com")
                .passwordHash("old-hash")
                .fullName("Event Coordinator")
                .userType(UserType.EVENT_COORDINATOR)
                .status(AccountStatus.PENDING)
                .failedLoginAttempts(5)
                .lockedUntil(LocalDateTime.now().plusMinutes(15))
                .studentStanding(StudentStanding.GRADUATED)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByEmail("coordinator@seal.com")).thenReturn(Optional.of(staleCoordinator));
        when(passwordEncoder.encode("12345678")).thenReturn("fresh-hash");
        when(eventRepository.findAll()).thenReturn(List.of());

        dataSeeder.run();

        verify(judgingDemoSeeder).seedIfMissing();
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        User resynced = saved.getAllValues().stream()
                .filter(u -> "coordinator@seal.com".equals(u.getEmail()))
                .findFirst()
                .orElseThrow();

        assertThat(resynced.getPasswordHash()).isEqualTo("fresh-hash");
        assertThat(resynced.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(resynced.getFailedLoginAttempts()).isZero();
        assertThat(resynced.getLockedUntil()).isNull();
        assertThat(resynced.getStudentStanding()).isEqualTo(StudentStanding.ENROLLED);
    }

    @Test
    void run_shouldSkipResync_whenFlagDisabled() {
        ReflectionTestUtils.setField(dataSeeder, "resyncDevAccounts", false);

        User existing = User.builder()
                .email("coordinator@seal.com")
                .passwordHash("old-hash")
                .fullName("Event Coordinator")
                .userType(UserType.EVENT_COORDINATOR)
                .status(AccountStatus.PENDING)
                .build();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByEmail("coordinator@seal.com")).thenReturn(Optional.of(existing));

        dataSeeder.run();

        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.argThat(
                u -> u != null && "coordinator@seal.com".equals(u.getEmail())));
        assertThat(existing.getPasswordHash()).isEqualTo("old-hash");
        assertThat(existing.getStatus()).isEqualTo(AccountStatus.PENDING);
    }
}
