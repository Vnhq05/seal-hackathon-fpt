package com.seal.seal_hackathon_fpt.features.submission.controller;

// [SỬA ĐỔI - Tính năng: Tối ưu Controller bằng DTO]
// Đã xóa: Các tham số @RequestParam
// Đã thêm: Sử dụng @RequestBody SubmitWorkRequest

import com.seal.seal_hackathon_fpt.features.submission.dto.SubmitWorkRequest;
import com.seal.seal_hackathon_fpt.features.submission.entity.Submission;
import com.seal.seal_hackathon_fpt.features.submission.service.SubmissionService;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ResponseEntity<Submission> submit(
            @RequestBody SubmitWorkRequest request,
            @AuthenticationPrincipal User currentUser // Leader thật từ JWT
    ) {
        return ResponseEntity.ok(submissionService.submitWork(
                request.getTeamId(),
                request.getRoundId(),
                request.getGithubUrl(),
                request.getVideoUrl(),
                request.getPdfUrl(),
                request.getNotes(),
                currentUser.getId()
        ));
    }

    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Submission>> getByTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByTeam(teamId));
    }
}