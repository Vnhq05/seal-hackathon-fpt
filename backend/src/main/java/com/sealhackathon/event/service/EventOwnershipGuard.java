package com.sealhackathon.event.service;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventOwnershipGuard {

    private final EventFinder eventFinder;
    private final AuthPublicService authPublicService;

    public void enforceOwnership(HackathonEvent event) {
        UserType role = authPublicService.getCurrentUserRole();
        if (role == UserType.SYSTEM_ADMIN) {
            return;
        }
        String currentEmail = authPublicService.getCurrentUserEmail();
        if (!currentEmail.equals(event.getCreatedBy())) {
            throw new BusinessException("You can only manage events you created", HttpStatus.FORBIDDEN) {};
        }
    }

    public void enforceEventOwnership(UUID eventId) {
        enforceOwnership(eventFinder.getEvent(eventId));
    }
}
