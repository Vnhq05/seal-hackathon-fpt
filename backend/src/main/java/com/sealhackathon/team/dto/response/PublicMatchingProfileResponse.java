package com.sealhackathon.team.dto.response;

import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicMatchingProfileResponse {

    private UUID userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String studentId;
    private UserType userType;
    private String universityName;
    private StudentStanding studentStanding;
    private Integer semester;
    private boolean temporaryAccount;
    private LocalDateTime createdAt;
    private List<CompetitionHistoryItem> competitions;
}
