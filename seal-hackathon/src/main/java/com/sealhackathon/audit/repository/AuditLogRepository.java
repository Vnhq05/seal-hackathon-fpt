package com.sealhackathon.audit.repository;

import com.sealhackathon.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * BR-54: Append-only repository.
 * Extends Repository (not JpaRepository) to deliberately exclude
 * delete, deleteById, deleteAll, deleteAllById methods.
 * Only save and read operations are exposed.
 */
public interface AuditLogRepository extends Repository<AuditLog, UUID> {

    AuditLog save(AuditLog auditLog);

    Optional<AuditLog> findById(UUID id);

    Page<AuditLog> findAll(Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :from AND :to ORDER BY a.timestamp DESC")
    Page<AuditLog> findByTimestampRange(@Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to,
                                        Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.timestamp BETWEEN :from AND :to ORDER BY a.timestamp DESC")
    List<AuditLog> findAllByTimestampRange(@Param("from") LocalDateTime from,
                                           @Param("to") LocalDateTime to);

    @Query("SELECT a FROM AuditLog a WHERE " +
            "(:actorId IS NULL OR a.actorId = :actorId) AND " +
            "(:action IS NULL OR a.action = :action) AND " +
            "(:targetType IS NULL OR a.targetType = :targetType) " +
            "ORDER BY a.timestamp DESC")
    Page<AuditLog> findByFilters(@Param("actorId") UUID actorId,
                                 @Param("action") String action,
                                 @Param("targetType") String targetType,
                                 Pageable pageable);

    Page<AuditLog> findByActorId(UUID actorId, Pageable pageable);

    Page<AuditLog> findByTargetIdAndTargetType(UUID targetId, String targetType, Pageable pageable);
}
