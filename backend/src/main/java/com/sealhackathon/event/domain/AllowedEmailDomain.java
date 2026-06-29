package com.sealhackathon.event.domain;

import com.sealhackathon.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "allowed_email_domains", uniqueConstraints = {
        @UniqueConstraint(name = "uq_allowed_domain_event_domain", columnNames = {"event_id", "domain"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllowedEmailDomain extends BaseEntity {

    @NotNull
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @NotBlank
    @Size(max = 255)
    @Column(name = "domain", nullable = false)
    private String domain;

    @Size(max = 255)
    @Column(name = "university_label")
    private String universityLabel;
}
