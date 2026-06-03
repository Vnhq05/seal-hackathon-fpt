package com.seal.seal_hackathon_fpt.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        // Trả về mã lỗi 401 Unauthorized khi user chưa xác thực
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Bạn chưa đăng nhập hoặc Token không hợp lệ!");
    }
}