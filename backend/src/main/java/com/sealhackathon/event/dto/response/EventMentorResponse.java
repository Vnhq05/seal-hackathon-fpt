package com.sealhackathon.event.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventMentorResponse {

    private UUID id;
    private UUID mentorUserId;
    private String mentorFullName;
    private String mentorEmail;
    private LocalDateTime assignedAt;
}
