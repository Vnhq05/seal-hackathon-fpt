package com.seal.seal_hackathon_fpt.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 0. Cấu hình CORS để Frontend (như trang HTML test của bạn) có thể gọi API
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 1. Tắt CSRF vì chúng ta dùng JWT (State-less)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Xử lý ngoại lệ (bắt lỗi chưa đăng nhập trả về 401 thay vì trang HTML)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                )

                // 3. Cấu hình session là STATELESS (không lưu trạng thái, mọi request đều phải có vé JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 4. Phân quyền đường dẫn (API)
                .authorizeHttpRequests(auth -> auth
                        // THÊM DÒNG NÀY: Cho phép tất cả các request OPTIONS (Preflight) đi qua không cần Token
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Mở khóa cho các API công khai (Đăng ký, Đăng nhập)
                        .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                        // Mở khóa cho API quên mật khẩu
                        .requestMatchers("/api/auth/forgot-password").permitAll()

                        // Mở khóa cho giao diện tài liệu Swagger
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                        // Bắt buộc tất cả các API còn lại ĐỀU PHẢI có Token hợp lệ mới được vào
                        .anyRequest().authenticated()
                )

                // 5. Khai báo nhà cung cấp dịch vụ xác thực và nhét JwtFilter vào bảo vệ cửa
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // =========================================
    // HÀM ĐỊNH NGHĨA QUY TẮC CORS CHO TRÌNH DUYỆT
    // =========================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép mọi nguồn (domain frontend) gọi vào backend (Dùng "*" để dễ test ở localhost)
        configuration.setAllowedOrigins(List.of("*"));

        // Cho phép các phương thức HTTP
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Cho phép mọi loại header (cực kỳ quan trọng để Frontend gửi được Header Authorization chứa Token)
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}