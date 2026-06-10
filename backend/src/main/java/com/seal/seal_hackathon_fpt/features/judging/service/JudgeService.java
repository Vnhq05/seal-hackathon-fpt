package com.seal.seal_hackathon_fpt.features.judging.service;

import com.seal.seal_hackathon_fpt.features.judging.dto.CreateJudgeRequest;
import com.seal.seal_hackathon_fpt.features.judging.dto.JudgeResponse;
import com.seal.seal_hackathon_fpt.features.judging.entity.Judge;
import com.seal.seal_hackathon_fpt.features.judging.repository.JudgeRepository;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JudgeService {

    private final JudgeRepository judgeRepository;
    private final UserRepository userRepository;

    public JudgeResponse createJudge(
            CreateJudgeRequest request
    ) {

        Judge judge = Judge.builder()
                .userId(request.getUserId())
                .fullName(request.getFullName())
                .isGuest(request.getIsGuest())
                .createdAt(LocalDateTime.now())
                .build();

        judgeRepository.save(judge);

        return JudgeResponse.builder()
                .id(judge.getId())
                .userId(judge.getUserId())
                .fullName(judge.getFullName())
                .isGuest(judge.getIsGuest())
                .build();
    }

    public List<Judge> getAllJudges() {
        List<Judge> judges = judgeRepository.findAll();
        // Gắn email (từ bảng users) để hiển thị/tìm kiếm judge cho dễ phân biệt.
        judges.forEach(j -> {
            if (j.getUserId() != null) {
                userRepository.findById(j.getUserId())
                        .ifPresent(u -> j.setEmail(u.getEmail()));
            }
        });
        return judges;
    }
}