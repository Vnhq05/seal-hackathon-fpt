package com.sealhackathon.notification.service;

import com.sealhackathon.infrastructure.mail.MailSender;
import com.sealhackathon.notification.domain.Notification;
import com.sealhackathon.notification.domain.NotificationRecipient;
import com.sealhackathon.notification.domain.enums.NotificationChannel;
import com.sealhackathon.notification.repository.NotificationRecipientRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final MailSender mailSender;
    private final UserPublicService userPublicService;
    private final NotificationRecipientRepository recipientRepository;

    @Transactional
    public void sendEmailsForNotification(Notification notification) {
        List<NotificationRecipient> emailRecipients = notification.getRecipients().stream()
                .filter(r -> r.getChannel() == NotificationChannel.EMAIL)
                .toList();

        for (NotificationRecipient recipient : emailRecipients) {
            userPublicService.findById(recipient.getUserId()).ifPresent(user ->
                    sendAndMark(user, notification, recipient));
        }
    }

    private void sendAndMark(UserSnapshot user, Notification notification,
                              NotificationRecipient recipient) {
        String subject = "[SEAL Hackathon] " + notification.getTitle();
        String body = buildEmailBody(user.getFullName(), notification);

        mailSender.sendEmail(user.getEmail(), subject, body);

        recipient.setSentAt(LocalDateTime.now());
        recipientRepository.save(recipient);
    }

    private String buildEmailBody(String name, Notification notification) {
        return String.format("""
                Dear %s,

                %s

                Type: %s

                ---
                This is an automated notification from the SEAL Hackathon Management System.
                """, name, notification.getMessage(), notification.getType());
    }
}
