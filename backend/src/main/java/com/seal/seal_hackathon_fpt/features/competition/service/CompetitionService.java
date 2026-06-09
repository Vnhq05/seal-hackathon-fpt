package com.seal.seal_hackathon_fpt.features.competition.service;

// [SỬA ĐỔI - Tính năng: Tối ưu CRUD Competition bằng DTO]
// Đã thêm: Import các class DTO
import com.seal.seal_hackathon_fpt.features.competition.dto.CreateCompetitionRequest;
import com.seal.seal_hackathon_fpt.features.competition.dto.RoundRequest;
import com.seal.seal_hackathon_fpt.features.competition.dto.UpdateCompetitionRequest;
import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import com.seal.seal_hackathon_fpt.features.competition.entity.Round;
import com.seal.seal_hackathon_fpt.features.competition.repository.CompetitionRepository;
import com.seal.seal_hackathon_fpt.features.competition.repository.RoundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompetitionService {
    private final CompetitionRepository competitionRepository;
    private final RoundRepository roundRepository;

    /** Các vòng của một cuộc thi, sắp theo sequence tăng dần (vòng cuối = sequence lớn nhất). */
    public List<Round> getRounds(Long competitionId) {
        List<Round> rounds = roundRepository.findByCompetitionId(competitionId);
        rounds.sort(Comparator.comparing(
                r -> r.getSequence() == null ? Integer.MAX_VALUE : r.getSequence()));
        return rounds;
    }

    /** Tạo một vòng mới cho cuộc thi. sequence null → tự đánh số tiếp theo. */
    public Round addRound(Long competitionId, RoundRequest req) {
        // Đảm bảo cuộc thi tồn tại.
        getById(competitionId);

        Integer sequence = req.getSequence();
        if (sequence == null) {
            sequence = roundRepository.findByCompetitionId(competitionId).stream()
                    .map(Round::getSequence)
                    .filter(java.util.Objects::nonNull)
                    .max(Integer::compareTo)
                    .map(m -> m + 1)
                    .orElse(1);
        }

        Round round = Round.builder()
                .competitionId(competitionId)
                .name(req.getName())
                .sequence(sequence)
                .startAt(req.getStartAt())
                .deadline(req.getDeadline())
                .question(req.getQuestion())
                .guidelines(req.getGuidelines())
                .isLocked(Boolean.TRUE.equals(req.getIsLocked()))
                .build();

        return roundRepository.save(round);
    }

    /** Cập nhật một vòng (chỉ set các field được gửi lên). */
    public Round updateRound(Long roundId, RoundRequest req) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new RuntimeException("Round not found"));

        if (req.getName() != null) round.setName(req.getName());
        if (req.getSequence() != null) round.setSequence(req.getSequence());
        if (req.getStartAt() != null) round.setStartAt(req.getStartAt());
        if (req.getDeadline() != null) round.setDeadline(req.getDeadline());
        if (req.getQuestion() != null) round.setQuestion(req.getQuestion());
        if (req.getGuidelines() != null) round.setGuidelines(req.getGuidelines());
        if (req.getIsLocked() != null) round.setIsLocked(req.getIsLocked());

        return roundRepository.save(round);
    }

    /** Xoá một vòng. */
    public void deleteRound(Long roundId) {
        roundRepository.deleteById(roundId);
    }

    // [SỬA ĐỔI - Tính năng: Tạo cuộc thi]
    // Đã xóa: Tham số truyền vào là Entity (Competition comp)
    // Đã thêm: Tham số truyền vào là DTO (CreateCompetitionRequest)
    public Competition create(CreateCompetitionRequest request) {
        Competition comp = Competition.builder()
                .seasonId(request.getSeasonId())
                .name(request.getName())
                .description(request.getDescription())
                .location(request.getLocation())
                .status(request.getStatus())
                .format(request.getFormat())
                .startDate(request.getStartDate())
                .registrationDeadline(request.getRegistrationDeadline())
                .build();
        return competitionRepository.save(comp);
    }

    public List<Competition> getAll() {
        return competitionRepository.findAll();
    }

    public Competition getById(Long id) {
        return competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found"));
    }

    public void delete(Long id) {
        competitionRepository.deleteById(id);
    }

    // [SỬA ĐỔI - Tính năng: Cập nhật cuộc thi]
    // Đã xóa: Tham số truyền vào là Entity
    // Đã thêm: Tham số truyền vào là DTO (UpdateCompetitionRequest)
    public Competition update(Long id, UpdateCompetitionRequest request) {
        Competition existing = getById(id);

        if (request.getName() != null) {
            existing.setName(request.getName());
        }

        if (request.getDescription() != null) {
            existing.setDescription(request.getDescription());
        }

        if (request.getLocation() != null) {
            existing.setLocation(request.getLocation());
        }

        if (request.getStatus() != null) {
            // Một cuộc thi phải có >= 1 vòng trước khi mở đăng ký (Open).
            if (request.getStatus() == Competition.Status.Open
                    && roundRepository.findByCompetitionId(id).isEmpty()) {
                throw new RuntimeException("Add at least one round before opening this competition.");
            }
            existing.setStatus(request.getStatus());
        }

        if (request.getFormat() != null) {
            existing.setFormat(request.getFormat());
        } else if (existing.getFormat() == null) {
            existing.setFormat(Competition.Format.Offline);
        }

        if (request.getStartDate() != null) {
            existing.setStartDate(request.getStartDate());
        }

        if (request.getRegistrationDeadline() != null) {
            existing.setRegistrationDeadline(request.getRegistrationDeadline());
        }

        return competitionRepository.save(existing);
    }
}