# SEAL HACKATHON MANAGEMENT SYSTEM

## Project Overview

Build a complete backend system for managing Hackathon competitions.

The source of truth is:

1. SRS Document
2. Business Rules Document (BR-01 → BR-57)

If any implementation decision conflicts with Business Rules, Business Rules always win.

---

# Architecture

This project MUST follow:

* Modular Monolith Architecture
* Spring Modulith
* Domain Driven Design (DDD Lite)
* JPA / Hibernate Code First

Database schema must be generated from JPA Entities.

DO NOT design database first.

Entities are the source of truth.

---

# Tech Stack

## Core

* Java 21
* Spring Boot 3.5+
* Spring Modulith

## Security

* Spring Security 6
* JWT Authentication
* Refresh Token

## Persistence

* Spring Data JPA
* Hibernate
* PostgreSQL

## Utilities

* Lombok
* MapStruct
* Bean Validation

## Documentation

* OpenAPI / Swagger

## Testing

* JUnit 5
* Mockito
* Testcontainers

Build Tool:

* Maven

---

# High Level Modules

```text
com.sealhackathon

├── common
├── auth
├── user
├── event
├── team
├── submission
├── judging
├── ranking
├── notification
├── audit
└── infrastructure
```

---

# Modulith Rules

Modules are independent.

Modules communicate ONLY through:

* Public Service Interfaces
* Domain Events

Forbidden:

```java
// BAD

TeamModule
 -> inject SubmissionRepository

EventModule
 -> inject TeamRepository
```

Allowed:

```java
SubmissionPublicService

TeamPublicService

Domain Events
```

Never access repositories across modules.

---

# Common Module

Contains:

```text
common
├── entity
├── enums
├── exception
├── response
├── validation
├── config
└── util
```

---

# Base Entity

Every entity must inherit:

```java
BaseEntity
```

Fields:

```java
UUID id

LocalDateTime createdAt

LocalDateTime updatedAt

String createdBy

String updatedBy
```

Use:

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
```

---

# User Model

The system contains 2 groups.

## External Users

* FPT Student
* External Student

## Internal Users

* Mentor
* Judge
* Lecturer
* Event Coordinator
* System Admin

---

# UserType

```java
public enum UserType {

    FPT_STUDENT,

    EXTERNAL_STUDENT,

    MENTOR,

    JUDGE,

    LECTURER,

    EVENT_COORDINATOR,

    SYSTEM_ADMIN
}
```

---

# Account Status

```java
public enum AccountStatus {

    PENDING,

    ACTIVE,

    REJECTED,

    LOCKED
}
```

---

# Auth Module

Responsible for:

* Register
* Login
* Refresh Token
* Logout
* Forgot Password
* Reset Password
* RBAC

Business Rules:

BR-01
BR-02
BR-03
BR-04
BR-05
BR-06
BR-07
BR-57

Entities:

```java
User
RefreshToken
PasswordResetToken
```

Requirements:

* Participant can self-register
* Internal accounts only created by Admin
* Email unique
* JWT Authentication
* Refresh Token
* Account Locking
* Forgot Password
* RBAC

---

# User Module

Responsible for:

* Profile Management
* User Approval
* Internal Account Management

Entity:

```java
User
```

Fields:

```java
email
passwordHash
fullName
phone
studentId
universityName
userType
status
failedLoginAttempts
lockedUntil
```

Validation:

FPT_STUDENT

studentId required

regex:

SE[0-9]{6}

EXTERNAL_STUDENT

studentId required

universityName required

Internal Roles

studentId nullable

universityName nullable

---

# Event Module

Responsible for:

* Hackathon Management
* Round Management
* Criteria Configuration
* Judge Assignment
* Mentor Assignment

Business Rules:

BR-08 → BR-14

Entities:

```java
HackathonEvent

Round

Criteria

JudgeAssignment

MentorAssignment
```

---

# Team Module

Responsible for:

* Team Registration
* Team Invitation
* Team Member Management
* Mentor-Team Assignment
* Auto Matching

Business Rules:

BR-15 → BR-24

Entities:

```java
Team

TeamMember

Invitation

MentorTeam
```

Rules:

* Team size 3-5
* One participant only belongs to one team in an event
* Team leader unique
* Team name unique per event

---

# Submission Module

Responsible for:

* Submission
* Submission Validation
* Version History

Business Rules:

BR-25 → BR-33

Entities:

```java
Submission

SubmissionVersion

SubmissionAttachment
```

Validation:

* GitHub URL
* PDF <= 5MB
* PDF <= 2 pages
* Demo URL whitelist

---

# Judging Module

Responsible for:

* Scoring
* Judge Comment
* Conflict Detection

Business Rules:

BR-34 → BR-43

Entities:

```java
JudgeScore

JudgeScoreDetail

JudgeComment
```

Rules:

* Judge cannot score their own mentored team
* Score range 0-100
* Comment required when score < 50 or > 90

---

# Ranking Module

Responsible for:

* Score Aggregation
* Ranking
* Advancement
* Publish Result

Business Rules:

BR-44 → BR-52

Entities:

```java
Ranking

Advancement

PublishedResult
```

Rules:

* Weighted score
* Trimmed mean
* Tie breaker
* Auto ranking recalculation

---

# Notification Module

Responsible for:

* Email Notification
* In-App Notification

Entities:

```java
Notification

NotificationRecipient
```

Must support:

* User Approved
* Team Registered
* Submission Created
* Judge Assigned
* Results Published

---

# Audit Module

Responsible for:

* Immutable Audit Log

Business Rules:

BR-53
BR-54
BR-55

Entity:

```java
AuditLog
```

Rules:

* Append only
* No update
* No delete

---

# JPA Rules

Use:

```java
@Entity

@Table

@ManyToOne

@OneToMany
```

Avoid ManyToMany.

Always:

```java
FetchType.LAZY
```

Never:

```java
FetchType.EAGER
```

Use UUID Primary Keys.

---

# Security Rules

RBAC:

```java
SYSTEM_ADMIN

EVENT_COORDINATOR

LECTURER

MENTOR

JUDGE

FPT_STUDENT

EXTERNAL_STUDENT
```

JWT Access Token:

15 minutes

Refresh Token:

7 days

Use:

```java
JwtAuthenticationFilter

CustomUserDetailsService

SecurityConfig
```

---

# API Standards

All APIs must return:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Use:

```java
@RestController
```

Use:

```java
@Valid
```

for all requests.

---

# Testing Standards

Each module must contain:

* Unit Tests
* Integration Tests

Use:

* JUnit 5
* Mockito
* Testcontainers

Coverage target:

80%+

---

# Development Workflow

When implementing:

Step 1:
Generate package structure.

Step 2:
Generate entities.

Step 3:
Generate repositories.

Step 4:
Generate services.

Step 5:
Generate DTOs.

Step 6:
Generate mappers.

Step 7:
Generate controllers.

Step 8:
Generate security.

Step 9:
Generate tests.

Never skip steps.

Never generate pseudo code.

Never generate TODO comments.

Always generate production-ready code.
