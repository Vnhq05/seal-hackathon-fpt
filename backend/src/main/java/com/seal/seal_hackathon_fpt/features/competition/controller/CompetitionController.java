package com.seal.seal_hackathon_fpt.features.competition.controller;

// [SỬA ĐỔI - Tính năng: Xây dựng API Competition với DTO]
// Đã thêm: Toàn bộ nội dung Controller sử dụng chuẩn RESTful và DTO
import com.seal.seal_hackathon_fpt.features.competition.dto.CreateCompetitionRequest;
import com.seal.seal_hackathon_fpt.features.competition.dto.UpdateCompetitionRequest;
import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import com.seal.seal_hackathon_fpt.features.competition.service.CompetitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
public class CompetitionController {

    private final CompetitionService competitionService;

    @PostMapping
    public ResponseEntity<Competition> create(@RequestBody CreateCompetitionRequest request) {
        return ResponseEntity.ok(competitionService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<Competition>> getAll() {
        return ResponseEntity.ok(competitionService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Competition> getById(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Competition> update(
            @PathVariable Long id,
            @RequestBody UpdateCompetitionRequest request) {
        return ResponseEntity.ok(competitionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        competitionService.delete(id);
        return ResponseEntity.ok("Deleted successfully");
    }
}