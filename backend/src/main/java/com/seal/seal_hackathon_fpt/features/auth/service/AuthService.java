package com.seal.seal_hackathon_fpt.features.auth.service;

import com.seal.seal_hackathon_fpt.features.auth.dto.*;
import com.seal.seal_hackathon_fpt.features.user.entity.Role;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import com.seal.seal_hackathon_fpt.features.user.entity.UserStatus;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import com.seal.seal_hackathon_fpt.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j // 2. THÊM ĐÚNG CHỮ NÀY VÀO LÀ HẾT ĐỎ!
@Data
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    // ==========================================
    // LOGIC ĐĂNG KÝ (Đã bảo mật phân quyền)
    // ==========================================
    public AuthResponse register(RegisterRequest request) {
        // 1. Kiểm tra chống trùng lặp Email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("This email address is already in use. Please choose a different one!");
        }

        // 1b. Sinh viên FPT (school = "FPT University") phải có MSSV dạng SE + 6 số.
        //     Sinh viên ngoài trường không bắt buộc MSSV.
        boolean isFpt = "FPT University".equalsIgnoreCase(request.getSchool());
        if (isFpt) {
            String sid = request.getStudentId() == null ? "" : request.getStudentId().trim();
            if (!sid.matches("(?i)^SE\\d{6}$")) {
                throw new RuntimeException("FPT student ID must be SE followed by 6 digits (e.g. SE193799).");
            }
        }

        // 2. Khởi tạo User mới với quyền mặc định an toàn
        //    status = pending: Participant tự đăng ký PHẢI được Admin/Coordinator
        //    duyệt (Account Approval) thì mới đăng nhập được.
        var user = User.builder()
                .full_name(request.getName()) // Ánh xạ đúng tên biến trong Entity
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.Participant) // ÉP CỨNG: Bảo mật hệ thống, tránh tự phong Admin
                .status(UserStatus.pending)
                .studentId(request.getStudentId())
                .school(request.getSchool())
                .build();

        userRepository.save(user);

        // 3. KHÔNG cấp token: tài khoản đang chờ duyệt, chưa được phép đăng nhập.
        //    Trả về AuthResponse rỗng (token null) để Frontend hiểu là "chờ duyệt".
        return AuthResponse.builder().build();
    }

    // ==========================================
    // LOGIC ĐĂNG NHẬP (Code sạch, tối ưu)
    // ==========================================
    // Số lần sai tối đa trước khi khóa, và thời lượng khóa.
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 15;

    public AuthResponse login(LoginRequest request) {
        var existing = userRepository.findByEmail(request.getEmail()).orElse(null);

        // 0. Nếu đang trong thời gian khóa → chặn ngay, không cho thử mật khẩu.
        if (existing != null && existing.getLockUntil() != null
                && existing.getLockUntil().isAfter(java.time.LocalDateTime.now())) {
            long mins = java.time.Duration.between(java.time.LocalDateTime.now(), existing.getLockUntil()).toMinutes() + 1;
            throw new RuntimeException("Account locked due to too many failed attempts. Try again in " + mins + " minute(s).");
        }

        // 1. Giao cho Spring Security kiểm tra thông tin đăng nhập.
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            // Sai mật khẩu → tăng số lần sai; đủ 5 lần thì khóa 15 phút.
            if (existing != null) {
                int attempts = (existing.getFailedAttempts() == null ? 0 : existing.getFailedAttempts()) + 1;
                if (attempts >= MAX_FAILED_ATTEMPTS) {
                    existing.setFailedAttempts(0);
                    existing.setLockUntil(java.time.LocalDateTime.now().plusMinutes(LOCK_MINUTES));
                    userRepository.save(existing);
                    throw new RuntimeException("Too many failed attempts. Account locked for " + LOCK_MINUTES + " minutes.");
                }
                existing.setFailedAttempts(attempts);
                userRepository.save(existing);
                throw new RuntimeException("Incorrect email or password. " + (MAX_FAILED_ATTEMPTS - attempts) + " attempt(s) left before lock.");
            }
            throw new RuntimeException("Incorrect email or password.");
        }

        // 2. Sau khi qua cửa an ninh, lôi thông tin User từ kho lên
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("System error: Unable to extract account information."));

        // 2b. Chặn tài khoản chưa được duyệt (Participant tự đăng ký).
        if (user.getStatus() == UserStatus.pending) {
            throw new RuntimeException("Your account is awaiting Admin approval. Please sign in again once approved.");
        }

        // 2c. Đăng nhập thành công → reset bộ đếm sai & bỏ khóa.
        if ((user.getFailedAttempts() != null && user.getFailedAttempts() > 0) || user.getLockUntil() != null) {
            user.setFailedAttempts(0);
            user.setLockUntil(null);
            userRepository.save(user);
        }

        // 3. Sinh bộ đôi Token cấp quyền
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        // 4. Đóng gói trả về cho Frontend
        return AuthResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    // ==========================================
    // FORGOT PASSWORD
    // ==========================================
    public String forgotPassword(ForgotPasswordRequest request) {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("This email is not registered in the system!"));

            String otp = String.format("%06d", new java.util.Random().nextInt(1000000));

            user.setResetOtp(otp);
            user.setResetOtpExpiry(java.time.LocalDateTime.now().plusMinutes(5));
            userRepository.save(user);
            // Ép Hibernate xả dữ liệu thẳng xuống SQL Server ngay lập tức!
            //userRepository.saveAndFlush(user);

            emailService.sendOtpEmail(user.getEmail(), otp);

            return "OTP has been sent to your email. Please check your inbox!";
    }


    // ==========================================
    // RESET PASSWORD
    // ==========================================
    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Account does not exist!"));

        if (user.getResetOtp() == null || !user.getResetOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP or no OTP request found!");
        }

        if (user.getResetOtpExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired! Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);
        userRepository.save(user);

        return "Password reset successful! You can now log in with your new password.";
    }
}