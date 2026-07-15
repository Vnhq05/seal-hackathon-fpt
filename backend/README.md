# SEAL Hackathon Management System

A complete backend system for managing Hackathon competitions, built with **Spring Boot 3.5**, **Spring Modulith**, and **Domain-Driven Design**.

## Quick Start

### Prerequisites

- Java 21
- Maven 3.9+
- SQL Server (database `SEAL`)
- Docker (for Testcontainers)

### Run

```bash
# 1. Clone and enter project
cd backend

# 2. Configure database (copy backend/.env.example → backend/.env)
# Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# 3. Build
./mvnw clean package -DskipTests

# 4. Run (dev profile seeds scoring templates and default rules only)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 5. Access
# API:     http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

### Accounts and data

There are no demo accounts. `DataSeeder` seeds reference data only (scoring templates, default
rules); every account is real and is created either by self-registration or from the admin UI.

**One-time bootstrap.** `AuthService.register()` accepts only `FPT_STUDENT` and `EXTERNAL_STUDENT`,
and `AdminUserController` requires `hasRole('SYSTEM_ADMIN')` — so on an empty database there is no
way to create the first admin through the app. `bootstrap_admin.sql` exists to break that cycle:

```powershell
# 1. Generate a BCrypt hash (PowerShell hides the password as you type; Git Bash does not)
mvn -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt
java -cp "$(Get-Content target/cp.txt)" tools/GenerateAdminHash.java

# 2. Paste the hash into @passwordHash in src/main/resources/db/bootstrap_admin.sql, then:
sqlcmd -S localhost -U sa -P "<password>" -d SEAL -I `
  -i src/main/resources/db/bootstrap_admin.sql
```

Log in as that admin, then create coordinators, lecturers and students at `/admin/users`. Students
can also self-register at `/register`.

Keep the admin address in sync across `bootstrap_admin.sql`, `reset_and_seed_template.sql`
(`@ownerEmail`), `purge_demo_data.sql`, and `app.protected-emails` (`application.yml`,
`application-dev.properties`, `.env`). `app.protected-emails` is what stops the account from being
deleted through the admin UI — locking yourself out again. Re-running `bootstrap_admin.sql` with a
fresh hash resets the password if that happens.

### Test

```bash
# Unit tests always run. Integration tests require Docker (SQL Server Testcontainers).
# Without Docker, @Testcontainers(disabledWithoutDocker=true) skips ITs — they do not silently pass assertions.
./mvnw test
```

Schema for tests: Flyway applies `V0`+`V1`+… on Microsoft SQL Server (`mssqlserver` Testcontainers),
`ddl-auto=validate` — same filtered unique / CHECK constraints as production.

### SQL scripts (ops)

Schema is owned by Flyway (`db/migration/`). Manual ops scripts live under `db/archive/`:

| Script | Does |
|--------|------|
| `db/archive/bootstrap_admin.sql` | Creates (or resets) the single `SYSTEM_ADMIN` account |
| `db/archive/reset_and_seed_template.sql` | Wipes **all** events and rebuilds the SEAL template |
| `db/archive/purge_demo_data.sql` | Deletes every account except the admin |

```powershell
sqlcmd -S localhost -U sa -P "<password>" -d SEAL -I `
  -i src/main/resources/db/archive/bootstrap_admin.sql
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
| Persistence | Spring Data JPA, Hibernate, SQL Server |
| Validation | Bean Validation, Custom Validators |
| Mapping | MapStruct 1.6.3, Lombok |
| Documentation | SpringDoc OpenAPI 2.8.8 |
| Testing | JUnit 5, Mockito, Testcontainers (SQL Server) |
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
