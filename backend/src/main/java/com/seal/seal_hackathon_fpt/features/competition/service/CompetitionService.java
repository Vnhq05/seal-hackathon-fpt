package com.seal.seal_hackathon_fpt.features.competition.service;

// [SỬA ĐỔI - Tính năng: Tối ưu CRUD Competition bằng DTO]
// Đã thêm: Import các class DTO
import com.seal.seal_hackathon_fpt.features.competition.dto.CreateCompetitionRequest;
import com.seal.seal_hackathon_fpt.features.competition.dto.UpdateCompetitionRequest;
import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import com.seal.seal_hackathon_fpt.features.competition.repository.CompetitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompetitionService {
    private final CompetitionRepository competitionRepository;

    // [SỬA ĐỔI - Tính năng: Tạo cuộc thi]
    // Đã xóa: Tham số truyền vào là Entity (Competition comp)
    // Đã thêm: Tham số truyền vào là DTO (CreateCompetitionRequest)
    public Competition create(CreateCompetitionRequest request) {
        Competition comp = Competition.builder()
                .seasonId(request.getSeasonId())
                .name(request.getName())
                .description(request.getDescription())
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
        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setStatus(request.getStatus());
        existing.setFormat(request.getFormat());
        existing.setStartDate(request.getStartDate());
        existing.setRegistrationDeadline(request.getRegistrationDeadline());
        return competitionRepository.save(existing);
    }
}