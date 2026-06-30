package com.sealhackathon.auth.service;

import com.sealhackathon.infrastructure.mail.MailSender;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthEmailService {

    private final MailSender mailSender;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.otp.expiration-seconds:180}")
    private int otpExpirationSeconds;

    @Value("${app.magic-link.expiration-minutes:30}")
    private int magicLinkExpirationMinutes;

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

    public void sendEventMagicLinkEmail(String email, String fullName, String eventName, String magicLinkUrl) {
        String subject = "[SEAL Hackathon] Your Registration Link — " + eventName;
        String body = """
                Thank you for registering for <strong>%s</strong>.
                Click the button below to complete your registration and sign in.
                """.formatted(eventName);
        String htmlBody = buildMagicLinkHtml(fullName, body, "Complete My Registration", magicLinkUrl);
        mailSender.sendHtmlEmail(email, subject, htmlBody);
    }

    public void sendEnrollmentApprovedMagicLinkEmail(
            String email, String fullName, String eventName, String magicLinkUrl) {
        String subject = "[SEAL Hackathon] Your enrollment is approved — " + eventName;
        String body = """
                Your enrollment for <strong>%s</strong> has been approved.
                Click the button below to sign in to the student portal.
                """.formatted(eventName);
        String htmlBody = buildMagicLinkHtml(fullName, body, "Sign In to Portal", magicLinkUrl);
        mailSender.sendHtmlEmail(email, subject, htmlBody);
    }

    public void sendOtpEmail(String email, String fullName, String code) {
        String subject = "[SEAL Hackathon] Your Verification Code";
        String htmlBody = buildOtpHtml(fullName, code);
        mailSender.sendHtmlEmail(email, subject, htmlBody);
    }

    private String buildOtpHtml(String fullName, String code) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
                          <tr>
                            <td style="background-color:#5b5bd6;padding:32px 40px;text-align:center;">
                              <h1 style="margin:0;color:#ffffff;font-size:24px;">SEAL Hackathon</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:40px;">
                              <p style="margin:0 0 16px;font-size:16px;color:#333333;">Hello <strong>%s</strong>,</p>
                              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                                Use the verification code below to confirm your email address and complete registration.
                              </p>
                              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                                <tr>
                                  <td style="background-color:#f4f4f7;border-radius:8px;padding:20px 40px;text-align:center;">
                                    <span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#5b5bd6;">%s</span>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0 0 16px;font-size:14px;color:#888888;">
                                This code expires in %d minutes. If you did not request this, you can safely ignore this email.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#f4f4f7;padding:20px 40px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#aaaaaa;">SEAL Hackathon Management System</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(fullName, code, otpExpirationSeconds / 60);
    }

    private String buildMagicLinkHtml(
            String fullName, String bodyHtml, String ctaText, String magicLinkUrl) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
                          <tr>
                            <td style="background-color:#5b5bd6;padding:32px 40px;text-align:center;">
                              <h1 style="margin:0;color:#ffffff;font-size:24px;">SEAL Hackathon</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:40px;">
                              <p style="margin:0 0 16px;font-size:16px;color:#333333;">Hello <strong>%s</strong>,</p>
                              <p style="margin:0 0 24px;font-size:16px;color:#333333;line-height:1.6;">
                                %s
                              </p>
                              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                                <tr>
                                  <td style="background-color:#5b5bd6;border-radius:6px;">
                                    <a href="%s" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">
                                      %s
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              <p style="margin:0 0 16px;font-size:14px;color:#888888;">
                                This link expires in %d minutes. If you did not request this, you can safely ignore this email.
                              </p>
                              <p style="margin:0;font-size:13px;color:#aaaaaa;word-break:break-all;">
                                If the button does not work, copy and paste this URL into your browser:<br>
                                <a href="%s" style="color:#5b5bd6;">%s</a>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#f4f4f7;padding:20px 40px;text-align:center;">
                              <p style="margin:0;font-size:12px;color:#aaaaaa;">SEAL Hackathon Management System</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(fullName, bodyHtml, magicLinkUrl, ctaText, magicLinkExpirationMinutes, magicLinkUrl, magicLinkUrl);
    }
}
