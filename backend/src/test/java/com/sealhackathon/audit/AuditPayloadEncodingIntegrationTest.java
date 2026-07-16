package com.sealhackathon.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.audit.service.AuditService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the two audit-payload defects together, through the real column rather than a mock:
 * V8 widened old_value/new_value from the non-Unicode `text` baked into V0, and the listener now
 * serialises with Jackson instead of concatenating strings. Both only matter end to end -- a unit
 * test cannot show what SQL Server actually stored.
 */
class AuditPayloadEncodingIntegrationTest extends BaseIntegrationTest {

    /** Vietnamese diacritics plus the two characters that used to break hand-built JSON. */
    private static final String HOSTILE_NAME = "Đội \"Rồng Vàng\" \\ Huế 2026";

    @Autowired private AuditService auditService;
    @Autowired private TransactionTemplate txTemplate;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void auditPayload_survivesVietnameseAndQuotes_throughTheDatabase() throws Exception {
        UUID targetId = UUID.randomUUID();
        String payload = objectMapper.writeValueAsString(java.util.Map.of("name", HOSTILE_NAME));

        txTemplate.executeWithoutResult(status ->
                auditService.log(UUID.randomUUID(), "EVENT_CREATED", targetId, "HackathonEvent",
                        null, payload, null));

        entityManager.clear();
        String stored = jdbc.queryForObject(
                "SELECT new_value FROM audit_logs WHERE target_id = ?", String.class, targetId);

        assertThat(stored)
                .as("payload must round-trip byte-for-byte; `text` would transcode the diacritics away")
                .isEqualTo(payload);

        JsonNode parsed = objectMapper.readTree(stored);
        assertThat(parsed.get("name").asText()).isEqualTo(HOSTILE_NAME);
    }
}
