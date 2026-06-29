package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.util.EmailDomainValidator;
import com.sealhackathon.event.domain.AllowedEmailDomain;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.dto.request.AddAllowedEmailDomainRequest;
import com.sealhackathon.event.dto.response.AllowedEmailDomainResponse;
import com.sealhackathon.event.repository.AllowedEmailDomainRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.template.SealSpring2026Template;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AllowedEmailDomainService {

    private final AllowedEmailDomainRepository domainRepository;
    private final HackathonEventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<AllowedEmailDomainResponse> listByEvent(UUID eventId) {
        ensureEventExists(eventId);
        return domainRepository.findByEventIdOrderByDomainAsc(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AllowedEmailDomainResponse addDomain(UUID eventId, AddAllowedEmailDomainRequest request) {
        HackathonEvent event = ensureEventExists(eventId);
        String normalizedDomain = EmailDomainValidator.normalizeRuleDomain(request.getDomain());
        if (normalizedDomain.isEmpty()) {
            throw new BusinessException("Domain is required", HttpStatus.BAD_REQUEST) {};
        }

        boolean duplicate = domainRepository.findByEventIdOrderByDomainAsc(eventId).stream()
                .anyMatch(d -> d.getDomain().equalsIgnoreCase(normalizedDomain));
        if (duplicate) {
            throw new DuplicateResourceException("AllowedEmailDomain", "domain", normalizedDomain);
        }

        AllowedEmailDomain domain = AllowedEmailDomain.builder()
                .eventId(event.getId())
                .domain(normalizedDomain)
                .universityLabel(request.getUniversityLabel())
                .build();
        return toResponse(domainRepository.save(domain));
    }

    @Transactional
    public void removeDomain(UUID eventId, UUID domainId) {
        ensureEventExists(eventId);
        AllowedEmailDomain domain = domainRepository.findById(domainId)
                .orElseThrow(() -> new ResourceNotFoundException("AllowedEmailDomain", "id", domainId));
        if (!domain.getEventId().equals(eventId)) {
            throw new BusinessException("Domain does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        domainRepository.delete(domain);
    }

    @Transactional
    public void seedDomains(UUID eventId, List<AllowedEmailDomain> domains) {
        domainRepository.findByEventIdOrderByDomainAsc(eventId).forEach(domainRepository::delete);
        for (AllowedEmailDomain domain : domains) {
            domain.setEventId(eventId);
            domainRepository.save(domain);
        }
    }

    @Transactional(readOnly = true)
    public List<AllowedEmailDomainResponse> listDefaultRegistrationDomains() {
        return SealSpring2026Template.buildDefaultEmailDomains().stream()
                .map(d -> AllowedEmailDomainResponse.builder()
                        .domain(d.getDomain())
                        .universityLabel(d.getUniversityLabel())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public void validateExternalRegistration(String email, String universityName) {
        validateEmailAndUniversity(SealSpring2026Template.buildDefaultEmailDomains(), email, universityName);
    }

    @Transactional(readOnly = true)
    public void validateEmailForEvent(UUID eventId, String email) {
        validateExternalStudentForEvent(eventId, email, null);
    }

    @Transactional(readOnly = true)
    public void validateExternalStudentForEvent(UUID eventId, String email, String universityName) {
        HackathonEvent event = ensureEventExists(eventId);
        List<AllowedEmailDomain> domains = domainRepository.findByEventIdOrderByDomainAsc(eventId);
        if (domains.isEmpty()) {
            if (event.getCompetitionFormat() == CompetitionFormat.SEAL_RAG_2026) {
                throw new BusinessException(
                        "No allowed email domains configured for this event. Contact the organizer.",
                        HttpStatus.BAD_REQUEST) {};
            }
            return;
        }
        if (universityName != null && !universityName.isBlank()) {
            validateEmailAndUniversity(domains, email, universityName);
        } else {
            validateEmailOnly(domains, email);
        }
    }

    private void validateEmailOnly(List<AllowedEmailDomain> domains, String email) {
        List<String> rules = domains.stream().map(AllowedEmailDomain::getDomain).toList();
        if (!EmailDomainValidator.matchesAllowedDomain(email, rules)) {
            throw new BusinessException(
                    "Email domain is not allowed for this event. Use a university email from the approved list.",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateEmailAndUniversity(List<AllowedEmailDomain> domains, String email, String universityName) {
        if (universityName == null || universityName.isBlank()) {
            throw new BusinessException("University name is required", HttpStatus.BAD_REQUEST) {};
        }
        validateEmailOnly(domains, email);

        String normalizedUniversity = universityName.trim();
        boolean universityMatches = domains.stream()
                .filter(d -> EmailDomainValidator.matchesAllowedDomain(email, List.of(d.getDomain())))
                .anyMatch(d -> d.getUniversityLabel() != null
                        && normalizedUniversity.equalsIgnoreCase(d.getUniversityLabel().trim()));
        if (!universityMatches) {
            throw new BusinessException(
                    "University name does not match your email domain.",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private HackathonEvent ensureEventExists(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }

    private AllowedEmailDomainResponse toResponse(AllowedEmailDomain domain) {
        return AllowedEmailDomainResponse.builder()
                .id(domain.getId())
                .eventId(domain.getEventId())
                .domain(domain.getDomain())
                .universityLabel(domain.getUniversityLabel())
                .build();
    }
}
