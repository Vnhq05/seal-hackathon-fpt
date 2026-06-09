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

    public Submission submitWork(Long teamId, Long roundId, String githubUrl, String videoUrl,
                                 String pdfUrl, String notes, Long currentUserId) {

        // [BUSINESS RULE: Chỉ Leader được Submit]
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, currentUserId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this team!"));

        if (!Boolean.TRUE.equals(member.getIsLeader())) {
            throw new RuntimeException("ERROR: Only the team Leader can submit work!");
        }

        // Mỗi (team, round) chỉ 1 bài (UNIQUE) → có thì cập nhật, chưa có thì tạo mới.
        Submission submission = submissionRepository.findByTeamIdAndRoundId(teamId, roundId)
                .orElseGet(() -> Submission.builder().teamId(teamId).roundId(roundId).build());

        submission.setGithubUrl(githubUrl);
        submission.setVideoUrl(videoUrl);
        submission.setPdfUrl(pdfUrl);
        submission.setNotes(notes);
        submission.setStatus("Submitted");
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setUpdatedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }

    public List<Submission> getSubmissionsByTeam(Long teamId) {
        return submissionRepository.findByTeamId(teamId);
    }
}
