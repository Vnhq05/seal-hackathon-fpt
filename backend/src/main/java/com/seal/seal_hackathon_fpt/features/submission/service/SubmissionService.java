package com.seal.seal_hackathon_fpt.features.submission.service;

import com.seal.seal_hackathon_fpt.features.submission.entity.Submission;
import com.seal.seal_hackathon_fpt.features.submission.repository.SubmissionRepository;
import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
import com.seal.seal_hackathon_fpt.features.team.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final TeamMemberRepository teamMemberRepository; // Để check quyền Leader

    public Submission submitWork(Long teamId, Long roundId, String fileUrl, Long currentUserId) {

        // [BUSINESS RULE: Chỉ Leader được Submit]
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc team này!"));

        if (!member.getIsLeader()) {
            throw new RuntimeException("LỖI: Chỉ có Nhóm trưởng (Leader) mới có quyền nộp bài!");
        }

        Submission submission = Submission.builder()
                .teamId(teamId)
                .roundId(roundId)
                .submitterId(currentUserId)
                .fileUrl(fileUrl)
                .submittedAt(LocalDateTime.now())
                .build();

        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsByTeam(Long teamId) {
        return submissionRepository.findByTeamId(teamId);
    }
}
