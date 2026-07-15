# Archived ad-hoc SQL (pre-Flyway)

These scripts were applied **manually** to local/dev `SEAL` databases before Flyway
baseline existed. They are **not** executed by the application.

Schema truth is now:

- `db/migration/V0__baseline_schema.sql` — CREATE TABLE + constraints + indexes  
  dumped from live `SEAL` (includes everything these scripts historically created)
- `db/migration/V1__harden_integrity_and_security.sql` — token widen, filtered unique,
  BR-18/BR-20, missing FK indexes (idempotent)

## Absorbed into V0 (schema already present in dump)

| Script | Notes |
|--------|--------|
| `email_otp_tokens.sql` | Table `email_otp_tokens` |
| `event_magic_tokens.sql` | Table `event_magic_tokens` |
| `team_join_leave_requests.sql` | `team_join_requests`, `team_leave_requests` + FK |
| `team_matching.sql` | `team_needed_roles` + FK CASCADE |
| `event_mentor_assignments.sql` | Table + FK to `hackathon_events` |
| `participation_certificates.sql` | Table `participation_certificates` |
| `team_progress_alerts.sql` | Table `team_progress_alerts` |
| `judge_assignment_phase2_3_4.sql` | `competition_groups`, assignment scope, filtered UQ |
| `judge_assignment_phase2_3_4_fix.sql` | Follow-up index/check fixes |
| `seal_spring_2026_migration.sql` | Finalist/awards/draw/schedules/domains/review tables |
| `seal_spring_2026_schedule_criteria_fix.sql` | Schedule/criteria adjustments |
| `seal_spring_2026_encoding_fix.sql` | Encoding fixes (data-ish; schema already matching) |
| `seal_spring_2026_english_labels.sql` | Label data (ops; not DDL baseline) |
| `score_adjustment_workflow_migration.sql` | Score review tables + CHECK |
| `invitations_status_check_fix.sql` | CHECK on invitation status |
| `notifications_type_check_fix.sql` | CHECK on notification type |
| `allowed_email_domains_*.sql` | Domain table / platform NULL event_id |
| `users_avatar_url.sql` | `users.avatar_url` |
| `hackathon_events_avatar_url.sql` | Event avatar column |
| `prizes_value_extend.sql` | Prize value column widen |
| `preferred_role_extend.sql` | Role column extend |
| `system_config_add_*.sql` | System config columns |
| `event_publication_fix.sql` | Publication-related columns |
| `extend_seal_spring_2026_registration.sql` | Registration extend |

V1 still applies filtered unique indexes (`uq_team_members_one_leader`, pending join/leave/invite,
platform domains, submission version UQ, token column widen) that may not have been on every
legacy DB at dump time.

## Ops-only (never Flyway — keep for manual DBA use)

| Script | Purpose |
|--------|---------|
| `bootstrap_admin.sql` | Create bootstrap SYSTEM_ADMIN |
| `purge_demo_data.sql` | Wipe demo users (keep admin) |
| `reset_and_seed_template.sql` | Wipe event graph for reseeding |

Do **not** run ops scripts on production data without a backup.
