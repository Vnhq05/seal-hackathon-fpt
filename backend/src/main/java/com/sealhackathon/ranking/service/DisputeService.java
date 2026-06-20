package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.ranking.domain.Dispute;
import com.sealhackathon.ranking.domain.PublishedResult;
import com.sealhackathon.ranking.domain.enums.DisputeStatus;
import com.sealhackathon.ranking.dto.request.DisputeRequest;
import com.sealhackathon.ranking.dto.request.ResolveDisputeRequest;
import com.sealhackathon.ranking.dto.response.DisputeResponse;
import com.sealhackathon.ranking.event.DisputeFiledEvent;
import com.sealhackathon.ranking.event.DisputeResolvedEvent;
import com.sealhackathon.ranking.repository.DisputeRepository;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final PublishedResultRepository publishedResultRepository;
    private final EventPublicService eventPublicService;
    private final TeamPublicService teamPublicService;
    private final ApplicationEventPublisher eventPublisher;

    // ── BR-56: File dispute within 24h ──
    @Transactional
    public DisputeResponse fileDispute(UUID userId, UUID roundId, DisputeRequest request) {
        PublishedResult published = publishedResultRepository.findByRoundId(roundId)
                .orElseThrow(() -> new BusinessException("Results not yet published for this round",
                        HttpStatus.BAD_REQUEST) {});

        // BR-56: within 24h window
        if (LocalDateTime.now().isAfter(published.getDisputeDeadline())) {
            throw new BusinessException(
                    "Dispute window has closed. Results are final.",
                    HttpStatus.BAD_REQUEST) {};
        }

        // Must be a team leader in this event
        UUID eventId = eventPublicService.getRound(roundId)
                .map(RoundSnapshot::getEventId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));

        TeamSnapshot team = teamPublicService.getTeamByParticipantAndEvent(userId, eventId)
                .orElseThrow(() -> new BusinessException("You are not in a team for this event",
                        HttpStatus.FORBIDDEN) {});

        if (!team.getLeaderId().equals(userId)) {
            throw new BusinessException("Only the team leader can file a dispute",
                    HttpStatus.FORBIDDEN) {};
        }

        Dispute dispute = Dispute.builder()
                .teamId(team.getId())
                .roundId(roundId)
                .filedBy(userId)
                .reason(request.getReason())
                .status(DisputeStatus.PENDING)
                .filedAt(LocalDateTime.now())
                .build();

        dispute = disputeRepository.save(dispute);

        eventPublisher.publishEvent(new DisputeFiledEvent(
                dispute.getId(), team.getId(), roundId, userId));

        return toResponse(dispute);
    }

    @Transactional
    public DisputeResponse resolveDispute(UUID disputeId, UUID resolverId,
                                           ResolveDisputeRequest request) {
        Dispute dispute = getDispute(disputeId);

        if (dispute.getStatus() != DisputeStatus.PENDING
                && dispute.getStatus() != DisputeStatus.UNDER_REVIEW) {
            throw new BusinessException("Dispute is already " + dispute.getStatus(),
                    HttpStatus.BAD_REQUEST) {};
        }

        dispute.setResolvedAt(LocalDateTime.now());
        dispute.setResolvedBy(resolverId);
        dispute.setResolution(request.getResolution());
        dispute.setStatus(request.getAction() == ResolveDisputeRequest.Action.RESOLVE
                ? DisputeStatus.RESOLVED
                : DisputeStatus.REJECTED);

        dispute = disputeRepository.save(dispute);

        eventPublisher.publishEvent(new DisputeResolvedEvent(
                disputeId, request.getResolution(), resolverId));

        return toResponse(dispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> getDisputesByRound(UUID roundId) {
        return disputeRepository.findByRoundId(roundId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDisputeById(UUID disputeId) {
        return toResponse(getDispute(disputeId));
    }

    private Dispute getDispute(UUID id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute", "id", id));
    }

    private DisputeResponse toResponse(Dispute d) {
        return DisputeResponse.builder()
                .id(d.getId())
                .teamId(d.getTeamId())
                .roundId(d.getRoundId())
                .filedBy(d.getFiledBy())
                .reason(d.getReason())
                .status(d.getStatus())
                .filedAt(d.getFiledAt())
                .resolvedAt(d.getResolvedAt())
                .resolvedBy(d.getResolvedBy())
                .resolution(d.getResolution())
                .build();
    }
}
