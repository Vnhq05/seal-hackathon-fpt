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
        // Compare owner-first so a null owner rejects rather than matching a null caller:
        // an unattributable event is admin-only, never open.
        UUID ownerUserId = event.getOwnerUserId();
        if (ownerUserId == null || !ownerUserId.equals(authPublicService.getCurrentUserId())) {
            throw new BusinessException("You can only manage events you own", HttpStatus.FORBIDDEN) {};
        }
    }

    public void enforceEventOwnership(UUID eventId) {
        enforceOwnership(eventFinder.getEvent(eventId));
    }
}
