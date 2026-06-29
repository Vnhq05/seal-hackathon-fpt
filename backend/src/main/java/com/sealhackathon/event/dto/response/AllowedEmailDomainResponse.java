package com.sealhackathon.event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllowedEmailDomainResponse {

    private UUID id;
    private UUID eventId;
    private String domain;
    private String universityLabel;
}
