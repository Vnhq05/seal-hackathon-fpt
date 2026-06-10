package com.seal.seal_hackathon_fpt.features.staff.controller;

import com.seal.seal_hackathon_fpt.features.judging.entity.Judge;
import com.seal.seal_hackathon_fpt.features.mentor.entity.Mentor;
import com.seal.seal_hackathon_fpt.features.staff.service.CompetitionStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Roster judge & mentor của 1 cuộc thi (màn hình Judge/Mentor assignment).
 * Base path /api/competitions — bổ sung cho CompetitionController.
 */
@RestController
@RequestMapping("/api/competitions")
@RequiredArgsConstructor
public class CompetitionStaffController {

    private final CompetitionStaffService staffService;

    // ---------- Judges ----------

    @GetMapping("/{competitionId}/judges")
    public ResponseEntity<List<Judge>> getJudges(@PathVariable Long competitionId) {
        return ResponseEntity.ok(staffService.getJudges(competitionId));
    }

    @PostMapping("/{competitionId}/judges/{judgeId}")
    public ResponseEntity<String> addJudge(
            @PathVariable Long competitionId,
            @PathVariable Long judgeId) {
        staffService.addJudge(competitionId, judgeId);
        return ResponseEntity.ok("Judge added to competition");
    }

    @DeleteMapping("/{competitionId}/judges/{judgeId}")
    public ResponseEntity<String> removeJudge(
            @PathVariable Long competitionId,
            @PathVariable Long judgeId) {
        staffService.removeJudge(competitionId, judgeId);
        return ResponseEntity.ok("Judge removed from competition");
    }

    // ---------- Mentors ----------

    @GetMapping("/{competitionId}/mentors")
    public ResponseEntity<List<Mentor>> getMentors(@PathVariable Long competitionId) {
        return ResponseEntity.ok(staffService.getMentors(competitionId));
    }

    @PostMapping("/{competitionId}/mentors/{mentorId}")
    public ResponseEntity<String> addMentor(
            @PathVariable Long competitionId,
            @PathVariable Long mentorId) {
        staffService.addMentor(competitionId, mentorId);
        return ResponseEntity.ok("Mentor added to competition");
    }

    @DeleteMapping("/{competitionId}/mentors/{mentorId}")
    public ResponseEntity<String> removeMentor(
            @PathVariable Long competitionId,
            @PathVariable Long mentorId) {
        staffService.removeMentor(competitionId, mentorId);
        return ResponseEntity.ok("Mentor removed from competition");
    }
}
