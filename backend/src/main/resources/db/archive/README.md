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
| `reset_and_seed_template.sql` | Wipe event graph; restore SEAL Spring 2026 template |
| `seed_demo_events.sql` | Seed 7 SEAL seasons. Each event: **3 judges + 3 mentors** (separate lecturers). Teams split evenly (3 teams / mentor / track). Mentors ≠ judges so BR-34 conflict does not block scoring. Alert event also seeds notifications. **AS2 demos:** Event 6 = team progress risks; Event 5 = ready to publish results by track/round; Event 1–3/7 = already published leaderboard. |
| `seed_track_mentor_assignment_qa.sql` | One **CLOSED_REGISTRATION** event, **2 tracks**, **20 teams without track/mentor**, event staff judges+mentors pre-added, mentor track pool ready for Draw. |
| `seed_scoring_qa.sql` | One **SCORING** event, **4 teams** with submissions, **2 judges** (`score.judge1` done / `score.judge2` pending). Password `Demo@123456`. For Lecturer Scoring UI. |
| `seed_as2_full_demo.sql` | Full AS2 demo: (1) progress 9 teams, (2) LiveScore 9 teams not published, (3) completed + published results. Password `12345678`. Regenerate: `node _gen_seed_as2_full_demo.mjs`. |
| `seed_assignment_demo.sql` | **Assignment QA:** 1 event `CLOSED_REGISTRATION` + **10 CONFIRMED teams** (no track / judge / mentor yet). Password `12345678`. Regenerate: `node _gen_seed_assignment_demo.mjs`. |
| `seed_final_advancement_qa.sql` | **Final advancement QA**: prelim fully scored + rankings, 2 groups, **no Final submissions**. Select Finalists → carry-over → score Final. See `FINAL_ADVANCEMENT_CHANGES.md`. |
| `seed_feature_demo_pack.sql` | **7 feature demos** (OPEN → Assignment → Submission → Scoring deviation → Final → Feedback). Password `Demo@123456`. Regenerate: `node _gen_seed_feature_demo_pack.mjs`. |
| `seed_summer_track_relation_mock.sql` | One **Summer 2026** event + **2 tracks** + **2 teams** (already on tracks). Demo: kì on event, tracks via `event_id`. |

### AS2 full demo cheat sheet (`seed_as2_full_demo.sql`)

Password: `12345678` · Login: `coordinator@seal.com`

| Demo | Event | ID | UI |
|------|-------|----|----|
| Tiến độ nộp bài (9 teams) | AS2 Progress Demo - 9 Teams Submission Watch | `C1000001-EEEE-4EEE-8EEE-000000000001` | `/coordinator` → Teams needing support (7 at-risk) |
| LiveScore 9 teams | AS2 LiveScore Demo - 9 Teams Arena | `C1000002-EEEE-4EEE-8EEE-000000000001` | `/coordinator/livescore/C1000002-EEEE-4EEE-8EEE-000000000001` (Preliminary — 5 teams ranked, scoring in progress) |
| Đã kết thúc + công bố | AS2 Completed Demo - Published Final Results | `C1000003-EEEE-4EEE-8EEE-000000000001` | LiveScore / ranking (đã publish, leaderboard public) |

Student samples: `as2.s01@fpt.edu.vn` (progress), `as2.s10@fpt.edu.vn` (livescore), `as2.s19@fpt.edu.vn` (completed). Mentor: `mentor.lbtest@fpt.edu.vn`.

### Assignment demo cheat sheet (`seed_assignment_demo.sql`)

Password: `12345678` · Event ID: `0D010000-EEEE-4EEE-8EEE-000000000001`

| Role | Login | Where to test |
|------|-------|----------------|
| Coordinator | `assign.coord@fpt.edu.vn` | `/coordinator/assignments/teams` → select **Assignment Demo - Closed Registration 10 Teams** |
| Judge pool | `assign.judge1@fpt.edu.vn` … `assign.judge3@fpt.edu.vn` | Assign after tracks/groups exist |
| Mentor pool | `assign.mentor1@fpt.edu.vn` … `assign.mentor3@fpt.edu.vn` | `/coordinator/assignments/mentors` |
| Team leader sample | `assign.s01@fpt.edu.vn` (team Assign Alpha) | Student portal |

State intentionally left empty for QA: **no track on teams**, **no judge/mentor assignments**, **no competition groups**. Flow: assign/draw tracks → generate groups → assign judges/mentors.

| Script | Purpose |
|--------|---------|
| `patch_as2_progress_and_publish.sql` | Patch **existing local DEV events** (Competition Progress + Submission Lock) so AS2 progress/publish can be tested without the full 7-season seed. |
| `fix_emdash_mojibake.sql` | Repair `â€”` (UTF-8 em-dash mojibake) → ASCII ` - ` in event names |
| `fix_vietnamese_name_mojibake.sql` | Repair demo `users.full_name` mojibake (sqlcmd without `-f 65001`). Regenerate: `node _gen_fix_vietnamese_names.mjs` |

`seed_demo_events.sql` is generated by `_gen_seed_demo_events.mjs` (`node _gen_seed_demo_events.mjs` from this folder). Edit the generator, then regenerate — do not hand-edit the large SQL unless fixing a one-off. Prefer ASCII `-` in event names (avoid Unicode em-dash `—`; sqlcmd without `-f 65001` stores it as mojibake `â€”`).

**Always apply Unicode seeds with UTF-8 code page**, or Vietnamese names break:

```bat
sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_demo_events.sql
```

If names already look like `Nguyá»…n` / `Tráº§n`, run `fix_vietnamese_name_mojibake.sql` the same way (`-f 65001`).

Suggested local order:

1. `bootstrap_admin.sql` (admin must exist)
2. Start backend once with `dev` (seeds `scoring_templates`)
3. `reset_and_seed_template.sql` (template event `77F2A5A3-…`)
4. `seed_demo_events.sql` (does not delete the template)

### AS2 demo cheat sheet (after seed)

Password for all seeded accounts: `Demo@123456`

| Feature | Event | Login | Where |
|--------|-------|-------|-------|
| **Xem tiến độ cuộc thi** (risk board + alerts) | `06020000-EEEE-4EEE-8EEE-000000000001` Fall Preview 2026 | Coordinator `tran.thanh.ha@fpt.edu.vn` · Mentor `pham.quoc.bao@fpt.edu.vn` · Student `nguyen.hoang.minh.preview26@fpt.edu.vn` | Teams needing support / student banner · `GET /api/events/{id}/rounds/{roundId}/progress` |
| **Công bố kết quả theo track/round** | `05020000-EEEE-4EEE-8EEE-000000000001` Summer Closing 2026 | Coordinator `tran.thanh.ha@fpt.edu.vn` | `/coordinator/livescore/05020000-EEEE-4EEE-8EEE-000000000001` — filter track → Lock → Publish Results |
| **Xem leaderboard đã công bố** | `01020000-EEEE-4EEE-8EEE-000000000001` Fall 2025 | Coordinator or `nguyen.hoang.minh@fpt.edu.vn` | LiveScore / public leaderboard (already published per round) |

Event 6 risk mix: 3× NOT_STARTED, 2× SLIDE_ONLY, 2× STALLED, 1× LAST_MINUTE, 1× OK. Deadline is ~2h after seed time (within alert lead-time).

Do **not** run ops scripts on production data without a backup.
