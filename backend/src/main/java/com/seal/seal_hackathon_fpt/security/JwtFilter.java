package com.seal.seal_hackathon_fpt.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Lấy chuỗi Token từ Header của Request
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // 2. Kiểm tra xem header có chứa Token chuẩn (bắt đầu bằng "Bearer ") hay không
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Cắt bỏ chữ "Bearer " (7 ký tự) để lấy đoạn token thực sự
        jwt = authHeader.substring(7);

        // 4. Giải mã token để lấy email (hoặc username)
        userEmail = jwtService.extractUsername(jwt);

        // 5. Nếu có email và người dùng chưa được xác thực trong Context hiện tại
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Tải thông tin User từ Database lên (thông qua UserDetailsService)
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 6. Kiểm tra token có hợp lệ không
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // Nếu hợp lệ, tạo đối tượng Authentication và lưu vào SecurityContext
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 7. Cho phép request đi tiếp tục đến các Filter khác hoặc Controller
        filterChain.doFilter(request, response);
    }
}