package com.seal.seal_hackathon_fpt.common.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    public void sendTeamInviteEmail(
            String toEmail,
            String teamName,
            String competitionName,
            String competitionLink
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(toEmail);
        message.setSubject("SEAL Hackathon - Team Invitation");

        message.setText(
                "Hello,\n\n" +
                        "You have been invited to join a team in SEAL Hackathon.\n\n" +
                        "Team: " + teamName + "\n" +
                        "Competition: " + competitionName + "\n\n" +
                        "You can view the competition information here:\n" +
                        competitionLink + "\n\n" +
                        "Regards,\n" +
                        "SEAL Hackathon System"
        );

        mailSender.send(message);
    }
}