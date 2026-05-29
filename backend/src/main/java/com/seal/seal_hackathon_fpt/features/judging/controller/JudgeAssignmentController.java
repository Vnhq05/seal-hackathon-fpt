package com.seal.seal_hackathon_fpt.features.judging.controller;

import com.seal.seal_hackathon_fpt.features.judging.dto.CreateJudgeAssignmentRequest;
import com.seal.seal_hackathon_fpt.features.judging.entity.JudgeAssignment;
import com.seal.seal_hackathon_fpt.features.judging.service.JudgeAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// [SỬA ĐỔI - Tính năng: API lấy danh sách phân công]
// Đã thêm: Import java.util.List
import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class JudgeAssignmentController {

    private final JudgeAssignmentService assignmentService;

    @PostMapping
    public ResponseEntity<JudgeAssignment> createAssignment(
            @RequestBody CreateJudgeAssignmentRequest request
    ) {

        return ResponseEntity.ok(
                assignmentService.createAssignment(request)
        );
    }

    // [SỬA ĐỔI - Tính năng: Thêm API GET /assignments]
    // Đã xóa: Không xóa gì
    // Đã thêm: Endpoint GET
    @GetMapping
    public ResponseEntity<List<JudgeAssignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }
}