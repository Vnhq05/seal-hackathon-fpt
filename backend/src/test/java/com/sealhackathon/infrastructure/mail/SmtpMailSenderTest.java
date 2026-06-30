package com.sealhackathon.infrastructure.mail;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SmtpMailSenderTest {

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private SmtpMailSender smtpMailSender;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(smtpMailSender, "fromAddress", "sender@gmail.com");
    }

    @Test
    void sendEmail_setsFromAddressAndSends() {
        smtpMailSender.sendEmail("student@test.com", "Subject", "Body");

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(javaMailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getFrom()).isEqualTo("sender@gmail.com");
        assertThat(message.getTo()).containsExactly("student@test.com");
        assertThat(message.getSubject()).isEqualTo("Subject");
    }

    @Test
    void sendEmail_propagatesMailSendException() {
        doThrow(new RuntimeException("Authentication failed"))
                .when(javaMailSender).send(any(SimpleMailMessage.class));

        assertThatThrownBy(() -> smtpMailSender.sendEmail("student@test.com", "Subject", "Body"))
                .isInstanceOf(MailSendException.class)
                .hasMessageContaining("Authentication failed");
    }
}
