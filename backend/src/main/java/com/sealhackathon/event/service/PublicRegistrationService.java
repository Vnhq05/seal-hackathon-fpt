package com.sealhackathon.event.service;

import com.sealhackathon.event.dto.request.PublicEventRegisterRequest;

import java.util.UUID;

public interface PublicRegistrationService {

    void register(UUID eventId, PublicEventRegisterRequest request);
}
