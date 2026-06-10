package com.seal.seal_hackathon_fpt.features.staff.service;

import com.seal.seal_hackathon_fpt.features.judging.entity.Judge;
import com.seal.seal_hackathon_fpt.features.judging.repository.JudgeRepository;
import com.seal.seal_hackathon_fpt.features.mentor.entity.Mentor;
import com.seal.seal_hackathon_fpt.features.mentor.repository.MentorRepository;
import com.seal.seal_hackathon_fpt.features.staff.entity.CompetitionJudge;
import com.seal.seal_hackathon_fpt.features.staff.entity.CompetitionMentor;
import com.seal.seal_hackathon_fpt.features.staff.repository.CompetitionJudgeRepository;
import com.seal.seal_hackathon_fpt.features.staff.repository.CompetitionMentorRepository;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Quản lý "roster" judge & mentor của từng cuộc thi:
 * lấy danh sách, thêm (từ judge/mentor đã có), gỡ khỏi cuộc thi.
 */
@Service
@RequiredArgsConstructor
public class CompetitionStaffService {

    private final CompetitionJudgeRepository competitionJudgeRepository;
    private final CompetitionMentorRepository competitionMentorRepository;
    private final JudgeRepository judgeRepository;
    private final MentorRepository mentorRepository;
    private final UserRepository userRepository;

    // ===================== JUDGES =====================

    /** Danh sách judge của cuộc thi (kèm email lấy từ bảng users). */
    public List<Judge> getJudges(Long competitionId) {
        List<Judge> result = new ArrayList<>();
        for (CompetitionJudge link : competitionJudgeRepository.findByCompetitionId(competitionId)) {
            judgeRepository.findById(link.getJudgeId()).ifPresent(judge -> {
                if (judge.getUserId() != null) {
                    userRepository.findById(judge.getUserId())
                            .ifPresent(u -> judge.setEmail(u.getEmail()));
                }
                result.add(judge);
            });
        }
        return result;
    }

    /** Thêm 1 judge (đã tồn tại) vào cuộc thi. Bỏ qua nếu đã có. */
    public void addJudge(Long competitionId, Long judgeId) {
        judgeRepository.findById(judgeId)
                .orElseThrow(() -> new RuntimeException("Judge not found: " + judgeId));
        if (competitionJudgeRepository.existsByCompetitionIdAndJudgeId(competitionId, judgeId)) {
            return;
        }
        competitionJudgeRepository.save(CompetitionJudge.builder()
                .competitionId(competitionId)
                .judgeId(judgeId)
                .createdAt(LocalDateTime.now())
                .build());
    }

    /** Gỡ 1 judge khỏi cuộc thi. */
    @Transactional
    public void removeJudge(Long competitionId, Long judgeId) {
        competitionJudgeRepository.deleteByCompetitionIdAndJudgeId(competitionId, judgeId);
    }

    // ===================== MENTORS =====================

    /** Danh sách mentor của cuộc thi (kèm email lấy từ bảng users). */
    public List<Mentor> getMentors(Long competitionId) {
        List<Mentor> result = new ArrayList<>();
        for (CompetitionMentor link : competitionMentorRepository.findByCompetitionId(competitionId)) {
            mentorRepository.findById(link.getMentorId()).ifPresent(mentor -> {
                if (mentor.getUserId() != null) {
                    userRepository.findById(mentor.getUserId())
                            .ifPresent(u -> mentor.setEmail(u.getEmail()));
                }
                result.add(mentor);
            });
        }
        return result;
    }

    /** Thêm 1 mentor (đã tồn tại) vào cuộc thi. Bỏ qua nếu đã có. */
    public void addMentor(Long competitionId, Long mentorId) {
        mentorRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found: " + mentorId));
        if (competitionMentorRepository.existsByCompetitionIdAndMentorId(competitionId, mentorId)) {
            return;
        }
        competitionMentorRepository.save(CompetitionMentor.builder()
                .competitionId(competitionId)
                .mentorId(mentorId)
                .createdAt(LocalDateTime.now())
                .build());
    }

    /** Gỡ 1 mentor khỏi cuộc thi. */
    @Transactional
    public void removeMentor(Long competitionId, Long mentorId) {
        competitionMentorRepository.deleteByCompetitionIdAndMentorId(competitionId, mentorId);
    }
}
