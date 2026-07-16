package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.util.EmailDomainValidator;
import com.sealhackathon.event.domain.AllowedEmailDomain;
import com.sealhackathon.event.domain.HackathonEvent;
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
    private final FormatRuleEngine formatRuleEngine;

    @Transactional
    public List<AllowedEmailDomainResponse> listPlatformDomains() {
        return ensurePlatformDomainsPersisted().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AllowedEmailDomainResponse addPlatformDomain(AddAllowedEmailDomainRequest request) {
        String normalizedDomain = normalizeDomain(request.getDomain());

        boolean duplicate = effectivePlatformDomains().stream()
                .anyMatch(d -> d.getDomain().equalsIgnoreCase(normalizedDomain));
        if (duplicate) {
            throw new DuplicateResourceException("AllowedEmailDomain", "domain", normalizedDomain);
        }

        AllowedEmailDomain domain = AllowedEmailDomain.builder()
                .domain(normalizedDomain)
                .universityLabel(request.getUniversityLabel())
                .build();
        return toResponse(domainRepository.save(domain));
    }

    @Transactional
    public void removePlatformDomain(UUID domainId) {
        AllowedEmailDomain domain = domainRepository.findById(domainId)
                .orElseThrow(() -> new ResourceNotFoundException("AllowedEmailDomain", "id", domainId));
        if (domain.getEventId() != null) {
            throw new BusinessException("Only platform-wide domains can be removed here", HttpStatus.BAD_REQUEST) {};
        }
        domainRepository.delete(domain);
    }

    @Transactional(readOnly = true)
    public List<AllowedEmailDomainResponse> listByEvent(UUID eventId) {
        ensureEventExists(eventId);
        return listPlatformDomains();
    }

    /** Removes an event's whitelist rows. Called when the owning event is deleted (V12 FK). */
    @Transactional
    public void deleteByEvent(UUID eventId) {
        domainRepository.deleteByEventId(eventId);
    }

    @Transactional
    public void seedDomains(UUID eventId, List<AllowedEmailDomain> domains) {
        List<AllowedEmailDomain> source = effectivePlatformDomains();
        if (source.isEmpty()) {
            source = domains;
        }

        domainRepository.findByEventIdOrderByDomainAsc(eventId).forEach(domainRepository::delete);
        for (AllowedEmailDomain domain : source) {
            AllowedEmailDomain copy = AllowedEmailDomain.builder()
                    .eventId(eventId)
                    .domain(domain.getDomain())
                    .universityLabel(domain.getUniversityLabel())
                    .build();
            domainRepository.save(copy);
        }
    }

    @Transactional(readOnly = true)
    public List<AllowedEmailDomainResponse> listDefaultRegistrationDomains() {
        return listPlatformDomains();
    }

    @Transactional(readOnly = true)
    public void validateExternalRegistration(String email, String universityName) {
        validateEmailAndUniversity(effectivePlatformDomains(), email, universityName);
    }

    @Transactional(readOnly = true)
    public void validateEmailForEvent(UUID eventId, String email) {
        validateExternalStudentForEvent(eventId, email, null);
    }

    @Transactional(readOnly = true)
    public void validateExternalStudentForEvent(UUID eventId, String email, String universityName) {
        HackathonEvent event = ensureEventExists(eventId);
        List<AllowedEmailDomain> domains = effectivePlatformDomains();
        if (domains.isEmpty()) {
            if (formatRuleEngine.isSealFormat(event)) {
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

    private List<AllowedEmailDomain> effectivePlatformDomains() {
        List<AllowedEmailDomain> platformDomains = domainRepository.findByEventIdIsNullOrderByDomainAsc();
        if (!platformDomains.isEmpty()) {
            return platformDomains;
        }
        return SealSpring2026Template.buildDefaultEmailDomains();
    }

    private List<AllowedEmailDomain> ensurePlatformDomainsPersisted() {
        List<AllowedEmailDomain> platformDomains = domainRepository.findByEventIdIsNullOrderByDomainAsc();
        if (!platformDomains.isEmpty()) {
            return platformDomains;
        }

        List<AllowedEmailDomain> seeded = SealSpring2026Template.buildDefaultEmailDomains().stream()
                .map(template -> AllowedEmailDomain.builder()
                        .domain(template.getDomain())
                        .universityLabel(template.getUniversityLabel())
                        .build())
                .toList();
        return domainRepository.saveAll(seeded);
    }

    private String normalizeDomain(String domain) {
        String normalizedDomain = EmailDomainValidator.normalizeRuleDomain(domain);
        if (normalizedDomain.isEmpty()) {
            throw new BusinessException("Domain is required", HttpStatus.BAD_REQUEST) {};
        }
        return normalizedDomain;
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
