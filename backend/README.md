# SEAL Hackathon Management System

A complete backend system for managing Hackathon competitions, built with **Spring Boot 3.5**, **Spring Modulith**, and **Domain-Driven Design**.

## Quick Start

### Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL 16+
- Docker (for Testcontainers)

### Run

```bash
# 1. Clone and enter project
cd seal-hackathon

# 2. Configure database
cp src/main/resources/application.yml src/main/resources/application-local.yml
# Edit application-local.yml with your PostgreSQL credentials

# 3. Build
./mvnw clean package -DskipTests

# 4. Run
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# 5. Access
# API:     http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

### Test

```bash
# Unit + Integration tests (requires Docker for Testcontainers)
./mvnw test
```

## Project Stats

| Metric | Count |
|---|---|
| Backend modules | 10 |
| Java source files | 227 |
| Test files | 31 |
| Test cases | 172 |
| API endpoints | 88 |
| Domain entities | 26 |
| Domain events | 31 |
| Business rules (BR-01 → BR-57) | 57 |
| Frontend API files | 17 |

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Java 21 |
| Framework | Spring Boot 3.5.3 |
| Architecture | Spring Modulith 1.3.3 |
| Security | Spring Security 6, JWT (jjwt 0.12.6) |
| Persistence | Spring Data JPA, Hibernate, PostgreSQL |
| Validation | Bean Validation, Custom Validators |
| Mapping | MapStruct 1.6.3, Lombok |
| Documentation | SpringDoc OpenAPI 2.8.8 |
| Testing | JUnit 5, Mockito, Testcontainers |
| Build | Maven |

## Module Overview

```
com.sealhackathon
├── common         ← Shared kernel (BaseEntity, enums, exceptions, ApiResponse)
├── auth           ← JWT authentication, RBAC, refresh tokens
├── user           ← User lifecycle, profile, account approval
├── event          ← Hackathon events, rounds, criteria, assignments
├── team           ← Team formation, invitations, mentor pairing
├── submission     ← Submission lifecycle, validation, versioning
├── judging        ← Scoring, conflict detection, score locking
├── ranking        ← Aggregation, ranking, advancement, results
├── notification   ← Email + in-app notifications (event-driven)
├── audit          ← Immutable append-only audit log
└── infrastructure ← Mail sender, file storage
```

## API Documentation

- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs
- **[API Reference](docs/API.md)**: Complete endpoint documentation

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | Spring Modulith design, DDD patterns, module boundaries |
| [Module Diagram](docs/module-diagram.md) | Dependency graph, event flows, communication patterns |
| [ERD](docs/ERD.md) | Entity-Relationship Diagram, all tables and constraints |
| [API Reference](docs/API.md) | All 88 endpoints with request/response types |
| [Deployment](docs/deployment.md) | Docker, environment variables, production configuration |

## Business Rules

57 business rules (BR-01 → BR-57) covering:

- **AUTH** (BR-01→BR-07, BR-57): Registration, login, account locking, password reset, RBAC
- **Event Config** (BR-08→BR-14): Event creation, round management, criteria, assignments
- **Team Registration** (BR-15→BR-24): Team formation, invitations, auto-matching
- **Submission** (BR-25→BR-33): GitHub/PDF/video validation, versioning, deadlines
- **Scoring** (BR-34→BR-43): Conflict detection, score validation, locking, timer
- **Results** (BR-44→BR-52): Weighted scoring, trimmed mean, tie-break, publish
- **Cross-cutting** (BR-53→BR-57): Audit log, security, disputes

## License

This project is developed for FPT University — SWP391 course, Summer 2026.
