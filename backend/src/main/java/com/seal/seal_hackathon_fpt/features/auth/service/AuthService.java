package com.seal.seal_hackathon_fpt.features.auth.service;

import com.seal.seal_hackathon_fpt.features.auth.dto.AuthResponse;
import com.seal.seal_hackathon_fpt.features.auth.dto.LoginRequest;
import com.seal.seal_hackathon_fpt.features.auth.dto.RegisterRequest;
import com.seal.seal_hackathon_fpt.features.user.entity.Role;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import com.seal.seal_hackathon_fpt.features.user.entity.UserStatus;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import com.seal.seal_hackathon_fpt.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // Logic Đăng ký
    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra xem email đã tồn tại chưa
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        // Tạo User mới, băm mật khẩu, set default role và status theo đúng yêu cầu Task
        var user = User.builder()
                .full_name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.Coordinator)
                .status(UserStatus.active)
                .build();

        // Lưu xuống Database
        userRepository.save(user);

        // Tạo tokens
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    // Logic Đăng nhập
    public AuthResponse login(LoginRequest request) {
        // Spring Security sẽ tự động kiểm tra email và mật khẩu (đã băm) ở đây
        // Nếu sai nó sẽ ném ra lỗi (Exception), nếu đúng sẽ đi tiếp
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Lấy thông tin user từ DB
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        // Tạo tokens mới
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }
}