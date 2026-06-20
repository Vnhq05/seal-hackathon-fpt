package com.sealhackathon.user.dto.response;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserListResponse {

    private UUID id;
    private String email;
    private String fullName;
    private UserType userType;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
