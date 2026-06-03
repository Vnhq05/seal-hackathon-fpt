package com.seal.seal_hackathon_fpt.features.user.repository;

import com.seal.seal_hackathon_fpt.features.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}