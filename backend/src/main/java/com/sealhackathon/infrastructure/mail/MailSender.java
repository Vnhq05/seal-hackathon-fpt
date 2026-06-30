package com.sealhackathon.infrastructure.mail;

public interface MailSender {

    void sendEmail(String to, String subject, String body);

    void sendHtmlEmail(String to, String subject, String htmlBody);
}
