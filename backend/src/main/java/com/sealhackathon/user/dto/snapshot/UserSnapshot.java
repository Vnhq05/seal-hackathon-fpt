package com.sealhackathon.user.dto.snapshot;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSnapshot {

    private UUID id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String phone;
    private String studentId;
    private String universityName;
    private UserType userType;
    private AccountStatus status;
    private Integer semester;
}
