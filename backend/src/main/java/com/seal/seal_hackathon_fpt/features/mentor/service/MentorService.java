package com.seal.seal_hackathon_fpt.features.mentor.service;

import com.seal.seal_hackathon_fpt.features.mentor.entity.Mentor;
import com.seal.seal_hackathon_fpt.features.mentor.repository.MentorRepository;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MentorService { // 🌟 Viết thẳng Class, không qua Interface

    private final MentorRepository mentorRepository;

    // 1. Logic tạo mới hồ sơ Mentor từ đối tượng User hệ thống
    public Mentor createMentor(User user, String specialty, String organization) {
        // Chặn trùng lặp user_id dưới DB để bảo vệ ràng buộc UNIQUE
        if (mentorRepository.findByUserId(user.getId()).isPresent()) {
            throw new RuntimeException("Tài khoản User này đã có hồ sơ Mentor trong hệ thống!");
        }

        Mentor mentor = Mentor.builder()
                .userId(user.getId())
                .fullName(user.getFull_name())
                .specialty(specialty)
                .organization(organization)
                .build();

        return mentorRepository.save(mentor);
    }

    // 2. Logic lấy toàn bộ danh sách Mentor hiển thị lên màn hình chọn của Đội thi
    public List<Mentor> getAllMentors() {
        return mentorRepository.findAll();
    }
}