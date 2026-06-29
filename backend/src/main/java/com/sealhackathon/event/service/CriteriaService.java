package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.dto.request.CriteriaRequest;
import com.sealhackathon.event.dto.response.CriteriaResponse;
import com.sealhackathon.event.repository.CriteriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CriteriaService {

    private static final int DEFAULT_MIN_SCORE = 1;
    private static final int DEFAULT_MAX_SCORE = 5;

    private final CriteriaRepository criteriaRepository;
    private final RoundService roundService;

    @Transactional
    public CriteriaResponse addCriteria(UUID roundId, CriteriaRequest request) {
        Round round = roundService.getRound(roundId);
        validateScoreRange(request);

        int currentSum = criteriaRepository.sumWeightsByRoundId(roundId);
        if (currentSum + request.getWeight() > 100) {
            throw new BusinessException(
                    String.format("Total weight would be %d%%. Criteria weights for a round must sum to exactly 100%%.",
                            currentSum + request.getWeight()),
                    HttpStatus.BAD_REQUEST) {};
        }

        Criteria criteria = Criteria.builder()
                .round(round)
                .name(request.getName())
                .description(request.getDescription())
                .weight(request.getWeight())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .minScore(resolveMinScore(request))
                .maxScore(resolveMaxScore(request))
                .build();

        criteria = criteriaRepository.save(criteria);
        return toResponse(criteria);
    }

    @Transactional
    public CriteriaResponse updateCriteria(UUID criteriaId, CriteriaRequest request) {
        Criteria criteria = getCriteria(criteriaId);
        validateScoreRange(request);

        if (criteriaRepository.countScoresByCriteriaId(criteriaId) > 0) {
            throw new BusinessException(
                    "Cannot modify criteria that already has judge scores",
                    HttpStatus.BAD_REQUEST) {};
        }

        int otherSum = criteriaRepository.sumWeightsByRoundIdExcluding(
                criteria.getRound().getId(), criteriaId);
        if (otherSum + request.getWeight() > 100) {
            throw new BusinessException(
                    String.format("Total weight would be %d%%. Criteria weights for a round must sum to exactly 100%%.",
                            otherSum + request.getWeight()),
                    HttpStatus.BAD_REQUEST) {};
        }

        criteria.setName(request.getName());
        criteria.setDescription(request.getDescription());
        criteria.setWeight(request.getWeight());
        if (request.getSortOrder() != null) {
            criteria.setSortOrder(request.getSortOrder());
        }
        criteria.setMinScore(resolveMinScore(request));
        criteria.setMaxScore(resolveMaxScore(request));

        criteria = criteriaRepository.save(criteria);
        return toResponse(criteria);
    }

    @Transactional
    public void deleteCriteria(UUID criteriaId) {
        Criteria criteria = getCriteria(criteriaId);

        if (criteriaRepository.countScoresByCriteriaId(criteriaId) > 0) {
            throw new BusinessException(
                    "Cannot delete criteria that already has judge scores",
                    HttpStatus.BAD_REQUEST) {};
        }

        criteriaRepository.delete(criteria);
    }

    @Transactional
    public List<CriteriaResponse> replaceCriteria(UUID roundId, List<CriteriaRequest> requests) {
        Round round = roundService.getRound(roundId);

        if (criteriaRepository.countScoresByRoundId(roundId) > 0) {
            throw new BusinessException(
                    "Cannot replace criteria after scoring has started for this round",
                    HttpStatus.BAD_REQUEST) {};
        }

        int totalWeight = requests.stream().mapToInt(CriteriaRequest::getWeight).sum();
        if (totalWeight != 100) {
            throw new BusinessException(
                    String.format("Criteria weights must sum to exactly 100%%. Got: %d%%.", totalWeight),
                    HttpStatus.BAD_REQUEST) {};
        }

        for (CriteriaRequest req : requests) {
            validateScoreRange(req);
        }

        criteriaRepository.deleteAllByRoundId(roundId);
        criteriaRepository.flush();

        List<Criteria> newCriteria = requests.stream()
                .map(req -> Criteria.builder()
                        .round(round)
                        .name(req.getName())
                        .description(req.getDescription())
                        .weight(req.getWeight())
                        .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                        .minScore(resolveMinScore(req))
                        .maxScore(resolveMaxScore(req))
                        .build())
                .toList();

        return criteriaRepository.saveAll(newCriteria).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CriteriaResponse> getCriteriaByRound(UUID roundId) {
        roundService.getRound(roundId);
        return criteriaRepository.findByRoundIdOrderBySortOrderAsc(roundId).stream()
                .map(this::toResponse)
                .toList();
    }

    Criteria getCriteria(UUID criteriaId) {
        return criteriaRepository.findById(criteriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Criteria", "id", criteriaId));
    }

    private void validateScoreRange(CriteriaRequest request) {
        int minScore = resolveMinScore(request);
        int maxScore = resolveMaxScore(request);
        if (minScore >= maxScore) {
            throw new BusinessException(
                    "minScore must be less than maxScore",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private int resolveMinScore(CriteriaRequest request) {
        return request.getMinScore() != null ? request.getMinScore() : DEFAULT_MIN_SCORE;
    }

    private int resolveMaxScore(CriteriaRequest request) {
        return request.getMaxScore() != null ? request.getMaxScore() : DEFAULT_MAX_SCORE;
    }

    private CriteriaResponse toResponse(Criteria c) {
        return CriteriaResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .weight(c.getWeight())
                .sortOrder(c.getSortOrder())
                .minScore(c.getMinScore())
                .maxScore(c.getMaxScore())
                .build();
    }
}
