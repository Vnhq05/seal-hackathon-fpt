package com.seal.seal_hackathon_fpt.features.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("[SEAL Hackathon] Password Reset OTP");
            message.setText("Hello,\n\n" +
                    "You have requested to reset your password. Here is your OTP:\n\n" +
                    "OTP: " + otp + "\n\n" +
                    "This code will expire in 5 minutes. Please DO NOT share this code with anyone to secure your account.\n\n" +
                    "Best regards,\nSEAL Team.");

            mailSender.send(message);
            log.info("Successfully sent OTP email to: {}", toEmail);
        } catch (Exception e) {
            log.error("Error sending email: {}", e.getMessage());
            throw new RuntimeException("Cannot send OTP email at this time. Please try again later.");
        }
    }
}