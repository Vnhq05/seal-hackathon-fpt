package com.sealhackathon.auth.security;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserPublicService userPublicService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserSnapshot user = userPublicService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus() == AccountStatus.ACTIVE,
                true,
                true,
                user.getStatus() != AccountStatus.LOCKED,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getUserType().name()))
        );
    }
}
