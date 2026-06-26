package com.sealhackathon.user.repository;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByStatus(AccountStatus status, Pageable pageable);

    Page<User> findByUserType(UserType userType, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
            "(:status IS NULL OR u.status = :status) AND " +
            "(:userType IS NULL OR u.userType = :userType) AND " +
            "(:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findByFilters(@Param("status") AccountStatus status,
                             @Param("userType") UserType userType,
                             @Param("search") String search,
                             Pageable pageable);

    long countByStatus(AccountStatus status);

    @Query("SELECT u FROM User u WHERE u.status = com.sealhackathon.common.enums.AccountStatus.ACTIVE "
            + "AND u.userType IN (com.sealhackathon.common.enums.UserType.FPT_STUDENT, "
            + "com.sealhackathon.common.enums.UserType.EXTERNAL_STUDENT) "
            + "AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "ORDER BY u.fullName ASC")
    List<User> searchActiveStudents(@Param("query") String query, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.userType IN "
            + "(com.sealhackathon.common.enums.UserType.FPT_STUDENT, "
            + "com.sealhackathon.common.enums.UserType.EXTERNAL_STUDENT) AND "
            + "(:status IS NULL OR u.status = :status) AND "
            + "(:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findStudentParticipants(@Param("status") AccountStatus status,
                                       @Param("search") String search,
                                       Pageable pageable);
}
