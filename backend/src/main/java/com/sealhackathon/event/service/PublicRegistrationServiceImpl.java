package com.sealhackathon.event.service;

import com.sealhackathon.auth.service.AuthEmailService;
import com.sealhackathon.auth.service.MagicLinkTokenService;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.request.PublicEventRegisterRequest;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicRegistrationServiceImpl implements PublicRegistrationService {

    private final EventPublicService eventPublicService;
    private final AllowedEmailDomainService allowedEmailDomainService;
    private final UserPublicService userPublicService;
    private final MagicLinkTokenService magicLinkTokenService;
    private final AuthEmailService authEmailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    @Transactional
    public void register(UUID eventId, PublicEventRegisterRequest request) {
        EventSnapshot event = eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (!event.isOpenForEnrollment()) {
            throw new BusinessException("Event is not open for registration", HttpStatus.BAD_REQUEST) {};
        }

        String email = request.getEmail().trim().toLowerCase();
        String universityName = request.getUniversityName() != null
                ? request.getUniversityName().trim()
                : null;

        allowedEmailDomainService.validateExternalStudentForEvent(eventId, email, universityName);

        UUID userId = resolveOrCreateUser(request, email, universityName);

        String token = magicLinkTokenService.createToken(userId, eventId);
        String magicLinkUrl = frontendUrl + "/magic-login?token=" + token;
        String fullName = request.getFullName().trim();

        authEmailService.sendEventMagicLinkEmail(email, fullName, event.getName(), magicLinkUrl);
    }

    private UUID resolveOrCreateUser(PublicEventRegisterRequest request, String email, String universityName) {
        UserSnapshot existing = userPublicService.findByEmail(email).orElse(null);

        if (existing == null) {
            String studentId = request.getStudentId() != null ? request.getStudentId().trim() : null;
            return userPublicService.createParticipant(
                    email,
                    passwordEncoder.encode(UUID.randomUUID().toString()),
                    request.getFullName().trim(),
                    null,
                    studentId,
                    universityName,
                    UserType.EXTERNAL_STUDENT,
                    null,
                    true,
                    StudentStanding.ENROLLED);
        }

        if (existing.getStatus() == AccountStatus.REJECTED) {
            throw new BusinessException("Account registration was rejected", HttpStatus.FORBIDDEN) {};
        }

        if (existing.getUserType() != UserType.EXTERNAL_STUDENT) {
            throw new BusinessException(
                    "Email already registered with a different account type",
                    HttpStatus.CONFLICT) {};
        }

        if (existing.getStatus() == AccountStatus.ACTIVE
                || existing.getStatus() == AccountStatus.PENDING
                || existing.getStatus() == AccountStatus.LOCKED) {
            return existing.getId();
        }

        throw new BusinessException("Account cannot register via magic link", HttpStatus.BAD_REQUEST) {};
    }
}
