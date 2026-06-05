package com.seal.seal_hackathon_fpt; // Đổi lại package cho khớp với máy bạn nhé

import com.seal.seal_hackathon_fpt.features.user.entity.Role;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import com.seal.seal_hackathon_fpt.features.user.entity.UserStatus;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra xem đã có trùm cuối chưa
        if (userRepository.findByEmail("admin_xin@fpt.edu.vn").isEmpty()) {

            // Tự động đẻ ra tài khoản Admin với mật khẩu "123" được mã hóa chuẩn chỉnh
            User admin = User.builder()
                    .full_name("Trùm Cuối Swagger")
                    .email("admin_xin@fpt.edu.vn")
                    .password(passwordEncoder.encode("123"))
                    .role(Role.Admin) // Chỗ này được làm Admin vì là code chạy ngầm nội bộ
                    .status(UserStatus.active)
                    .build();

            userRepository.save(admin);
            System.out.println("=======> ĐÃ TẠO THÀNH CÔNG ADMIN: admin_xin@fpt.edu.vn / 123 <=======");
        }
    }
}