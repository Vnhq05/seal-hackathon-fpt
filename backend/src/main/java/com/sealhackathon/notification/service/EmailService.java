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

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final MailSender mailSender;
    private final UserPublicService userPublicService;
    private final NotificationRecipientRepository recipientRepository;

    /**
     * Deliberately NOT @Transactional. Its only caller, NotificationEventListener.notify(), persists
     * the in-app notification in the same transaction and then swallows whatever this throws. A
     * @Transactional boundary here would catch an SMTP failure and mark that shared transaction
     * rollback-only, so an unreachable mail relay would destroy the notification the outage has
     * nothing to do with (proven by NotificationMailFailureIntegrationTest). Without the boundary the
     * mail exception propagates as an ordinary exception to notify()'s catch and the notification
     * commits. recipientRepository.save() still joins the caller's transaction via REQUIRED.
     *
     * REQUIRES_NEW is not the fix here: the recipient rows are written but uncommitted in the
     * caller's transaction, and a suspended-outer / new-inner pair would deadlock on their locks.
     */
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
