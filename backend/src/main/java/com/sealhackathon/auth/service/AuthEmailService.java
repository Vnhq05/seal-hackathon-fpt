package com.sealhackathon.auth.service;

import com.sealhackathon.infrastructure.mail.MailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthEmailService {

    private final MailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String email, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject = "[SEAL Hackathon] Password Reset";
        String body = String.format("""
                Hello,

                We received a request to reset your SEAL Hackathon account password.

                Click the link below to set a new password (valid for 15 minutes):
                %s

                If you did not request this, you can safely ignore this email.

                ---
                SEAL Hackathon Management System
                """, resetLink);
        mailSender.sendEmail(email, subject, body);
    }

    public void sendEnrollmentCredentialsEmail(String email, String fullName, String temporaryPassword) {
        String loginLink = frontendUrl + "/login";
        String subject = "[SEAL Hackathon] Your Account Credentials";
        String body = String.format("""
                Dear %s,

                Your enrollment has been approved. Use the credentials below to access the student portal.

                Email: %s
                Temporary password: %s

                Please sign in at %s and change your password after your first login.

                ---
                SEAL Hackathon Management System
                """, fullName, email, temporaryPassword, loginLink);
        mailSender.sendEmail(email, subject, body);
    }
}
