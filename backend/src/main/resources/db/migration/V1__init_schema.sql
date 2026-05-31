/* =============================================================================
   SEAL — Hackathon Management & Judging Platform
   Database schema for Microsoft SQL Server (T-SQL)
   Target: Spring Boot 3 + Spring Data JPA backend

   Source of truth: the TypeScript domain models in the approved prototype
     - src/lib/auth.tsx              (users, roles, account status)
     - src/lib/competition-store.ts  (competitions, prizes, rules, invites…)
     - src/lib/judging-store.ts      (rounds, teams, judges, criteria, scores…)

   SCOPE NOTE (post design-review trim — MVP):
     Removed as over-engineered / no data source in the prototype:
       - years                  -> folded into the season name ("Summer 2026")
       - season_metrics         -> no feedback/survey form exists yet (Phase 2)
       - past_results           -> derivable from final ranking of closed comps
       - mentor_invites         -> coordinator sets teams.mentor_id directly (Phase 2)
     Kept a THIN seasons table (id, name) because the program needs a
     season dashboard / archive — competitions group by season_id.
     Also removed judge_assignments.season_id (redundant; derived via competition).
     Kept on purpose: judges (guest judges), score_overrides (audited
     override is a core feature), mentor_messages (built chat — table is cheap;
     implement over plain REST for MVP, WebSocket only in Phase 2),
     team_member_invites (core to team formation).

   Notes for Flyway/Liquibase users:
     - Rename to  V1__init_schema.sql  and drop in src/main/resources/db/migration/.
     - Keep seed data in a separate V2__seed.sql.

   Conventions:
     - PK            : BIGINT IDENTITY(1,1)  -> JPA @GeneratedValue(IDENTITY)
     - Text          : NVARCHAR (Unicode — required for Vietnamese names)
     - Timestamps    : DATETIME2, default SYSUTCDATETIME() (store UTC)
     - Enums         : NVARCHAR + CHECK constraint  -> JPA @Enumerated(STRING)
     - Booleans      : BIT
     - Money/score   : DECIMAL (never FLOAT for money/scores)

   SQL Server gotchas handled below:
     1. A UNIQUE constraint allows only ONE NULL row -> use a filtered
        UNIQUE INDEX where we need "unique when not null".
     2. SQL Server forbids multiple cascade paths to the same table ->
        such FKs use ON DELETE NO ACTION; those deletes are handled in the
        service layer (also better for auditing).
============================================================================= */

/* ============================ 1. IDENTITY & AUTH ========================== */

CREATE TABLE users (
                       id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
                       full_name     NVARCHAR(150) NOT NULL,
                       email         NVARCHAR(190) NOT NULL,
                       password_hash NVARCHAR(255) NOT NULL,                 -- BCrypt/Argon2 hash, never plaintext
                       role          NVARCHAR(20)  NOT NULL          -- MVP: one active role per account (Lecturer already encodes Mentor∪Judge)
        CONSTRAINT CK_users_role CHECK (role IN ('Participant','Judge','Mentor','Lecturer','Coordinator','Admin')),
                       status        NVARCHAR(20)  NOT NULL
        CONSTRAINT DF_users_status DEFAULT 'pending'
        CONSTRAINT CK_users_status CHECK (status IN ('pending','active','suspended')),
                       student_id    NVARCHAR(20)  NULL,
                       school        NVARCHAR(150) NULL,
                       created_at    DATETIME2 NOT NULL CONSTRAINT DF_users_created DEFAULT SYSUTCDATETIME(),
                       updated_at    DATETIME2 NOT NULL CONSTRAINT DF_users_updated DEFAULT SYSUTCDATETIME(),
                       CONSTRAINT UQ_users_email UNIQUE (email)
);

-- Real "forgot password" flow (prototype's resetPassword was a no-op).
CREATE TABLE password_reset_tokens (
                                       id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_prt PRIMARY KEY,
                                       user_id    BIGINT NOT NULL,
                                       token      NVARCHAR(100) NOT NULL,
                                       expires_at DATETIME2 NOT NULL,
                                       used_at    DATETIME2 NULL,
                                       created_at DATETIME2 NOT NULL CONSTRAINT DF_prt_created DEFAULT SYSUTCDATETIME(),
                                       CONSTRAINT UQ_prt_token UNIQUE (token),
                                       CONSTRAINT FK_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: persisted refresh tokens for JWT rotation/revocation.
CREATE TABLE refresh_tokens (
                                id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_rt PRIMARY KEY,
                                user_id    BIGINT NOT NULL,
                                token      NVARCHAR(255) NOT NULL,
                                expires_at DATETIME2 NOT NULL,
                                revoked_at DATETIME2 NULL,
                                created_at DATETIME2 NOT NULL CONSTRAINT DF_rt_created DEFAULT SYSUTCDATETIME(),
                                CONSTRAINT UQ_rt_token UNIQUE (token),
                                CONSTRAINT FK_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

/* ======================= 2. SEASONS & COMPETITIONS ======================== */

-- Thin grouping table for the season dashboard / archive.
-- The year is folded into the name (e.g. "Summer 2026") — no separate years table.
CREATE TABLE seasons (
                         id   BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_seasons PRIMARY KEY,
                         name NVARCHAR(80) NOT NULL,                           -- "Spring 2026", "Summer 2026"
                         CONSTRAINT UQ_seasons_name UNIQUE (name)
);

CREATE TABLE competitions (
                              id                 BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_comp PRIMARY KEY,
                              season_id          BIGINT NULL,                       -- groups competitions for the season dashboard
                              name               NVARCHAR(200) NOT NULL,
                              description        NVARCHAR(MAX) NULL,
                              category           NVARCHAR(150) NULL,                -- topic / track family
                              location           NVARCHAR(200) NULL,
                              format             NVARCHAR(20) NOT NULL
        CONSTRAINT CK_comp_format CHECK (format IN ('Offline','Online','Hybrid')),
                              start_date         DATETIME2 NULL,
                              duration_days      SMALLINT NOT NULL
                                  CONSTRAINT DF_comp_dur DEFAULT 1
        CONSTRAINT CK_comp_dur CHECK (duration_days BETWEEN 1 AND 3),
                              registration_open  DATETIME2 NULL,
                              registration_close DATETIME2 NULL,
                              min_teams          INT NOT NULL CONSTRAINT DF_comp_minteams DEFAULT 0,
                              min_members        INT NULL,                          -- prototype stored as text "3"
                              max_members        INT NULL,                          -- prototype stored as text "5"
                              score_scale        INT NOT NULL CONSTRAINT DF_comp_scale DEFAULT 10,
                              status             NVARCHAR(20) NOT NULL
        CONSTRAINT DF_comp_status DEFAULT 'Draft'
        CONSTRAINT CK_comp_status CHECK (status IN ('Draft','Open','Active','Scoring','Closed','Cancelled')),
                              ranking_published  BIT NOT NULL CONSTRAINT DF_comp_rankpub DEFAULT 0,
                              created_by         BIGINT NULL,
                              created_at         DATETIME2 NOT NULL CONSTRAINT DF_comp_created DEFAULT SYSUTCDATETIME(),
                              updated_at         DATETIME2 NOT NULL CONSTRAINT DF_comp_updated DEFAULT SYSUTCDATETIME(),
                              CONSTRAINT FK_comp_season  FOREIGN KEY (season_id)  REFERENCES seasons(id),
                              CONSTRAINT FK_comp_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Merges the prototype's two duplicated "round" concepts into one table:
--   competition-store CompetitionRound (name/start/question/guidelines)
--   judging-store Round (deadline/locked)
CREATE TABLE rounds (
                        id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_rounds PRIMARY KEY,
                        competition_id BIGINT NOT NULL,
                        name           NVARCHAR(100) NOT NULL,                -- Qualifiers / Semi-finals / Finals
                        sequence       INT NOT NULL CONSTRAINT DF_rounds_seq DEFAULT 1,
                        start_at       DATETIME2 NULL,
                        deadline       DATETIME2 NULL,
                        question       NVARCHAR(MAX) NULL,
                        guidelines     NVARCHAR(MAX) NULL,
                        is_locked      BIT NOT NULL CONSTRAINT DF_rounds_locked DEFAULT 0,
                        CONSTRAINT FK_rounds_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE TABLE prize_tiers (
                             id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_prize PRIMARY KEY,
                             competition_id BIGINT NOT NULL,
                             rank_label     NVARCHAR(100) NOT NULL,                -- "1st place", "Encouragement Prize"
                             amount         DECIMAL(18,2) NULL,                    -- numeric (prototype stored display text)
                             currency       NVARCHAR(10) NOT NULL CONSTRAINT DF_prize_ccy DEFAULT 'VND',
                             winner_count   INT NOT NULL CONSTRAINT DF_prize_count DEFAULT 1,
                             display_order  INT NOT NULL CONSTRAINT DF_prize_order DEFAULT 1,
                             CONSTRAINT FK_prize_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

-- Per-round scoring criteria — the operational list judges actually score against.
-- (Competition-wide "scoring template" in the prototype seeds these on create.)
CREATE TABLE scoring_criteria (
                                  id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_crit PRIMARY KEY,
                                  round_id      BIGINT NOT NULL,
                                  name          NVARCHAR(150) NOT NULL,
                                  description   NVARCHAR(MAX) NULL,
                                  max_score     DECIMAL(6,2) NOT NULL CONSTRAINT DF_crit_max DEFAULT 10,
                                  weight_pct    DECIMAL(6,2) NOT NULL,                  -- percentage; per-round weights should total 100
                                  is_active     BIT NOT NULL CONSTRAINT DF_crit_active DEFAULT 1,
                                  display_order INT NOT NULL CONSTRAINT DF_crit_order DEFAULT 1,
                                  CONSTRAINT FK_crit_round FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE
);

-- Per-competition rules (free-form list). Prototype's rules[] — often empty
-- because most competitions inherit the global rule set below.
CREATE TABLE competition_rules (
                                   id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_crules PRIMARY KEY,
                                   competition_id BIGINT NOT NULL,
                                   rule_text      NVARCHAR(MAX) NOT NULL,
                                   display_order  INT NOT NULL CONSTRAINT DF_crules_order DEFAULT 1,
                                   CONSTRAINT FK_crules_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE TABLE honored_guests (
                                id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_guests PRIMARY KEY,
                                competition_id BIGINT NOT NULL,
                                guest_name     NVARCHAR(150) NOT NULL,
                                display_order  INT NOT NULL CONSTRAINT DF_guests_order DEFAULT 1,
                                CONSTRAINT FK_guest_comp FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

-- Global competition rules (versioned). Rows = individual rules; meta = audit header.
CREATE TABLE global_rules (
                              id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_grules PRIMARY KEY,
                              rule_text     NVARCHAR(MAX) NOT NULL,
                              display_order INT NOT NULL CONSTRAINT DF_grules_order DEFAULT 1,
                              is_active     BIT NOT NULL CONSTRAINT DF_grules_active DEFAULT 1
);

CREATE TABLE global_rules_meta (
                                   id                  INT NOT NULL CONSTRAINT PK_grm PRIMARY KEY
                                       CONSTRAINT CK_grm_singleton CHECK (id = 1),       -- single-row table
                                   version             INT NOT NULL CONSTRAINT DF_grm_ver DEFAULT 1,
                                   last_edited_by      BIGINT NULL,
                                   last_edited_by_name NVARCHAR(150) NULL,
                                   last_edited_at      DATETIME2 NOT NULL CONSTRAINT DF_grm_at DEFAULT SYSUTCDATETIME(),
                                   CONSTRAINT FK_grm_user FOREIGN KEY (last_edited_by) REFERENCES users(id)
);

/* ============================ 3. TEAMS ==================================== */

CREATE TABLE teams (
                       id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_teams PRIMARY KEY,
                       competition_id BIGINT NOT NULL,                       -- a team always belongs to one competition
                       name           NVARCHAR(150) NOT NULL,
                       track          NVARCHAR(100) NULL,                    -- e.g. "AI/Healthcare"
                       mentor_id      BIGINT NULL,                           -- assigned mentor (a user)
                       created_at     DATETIME2 NOT NULL CONSTRAINT DF_teams_created DEFAULT SYSUTCDATETIME(),
                       CONSTRAINT FK_teams_comp   FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
                       CONSTRAINT FK_teams_mentor FOREIGN KEY (mentor_id)      REFERENCES users(id)
);

-- Replaces Team.members (array of emails). Members are registered users.
CREATE TABLE team_members (
                              id        BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tm PRIMARY KEY,
                              team_id   BIGINT NOT NULL,
                              user_id   BIGINT NOT NULL,
                              is_leader BIT NOT NULL CONSTRAINT DF_tm_leader DEFAULT 0,
                              joined_at DATETIME2 NOT NULL CONSTRAINT DF_tm_joined DEFAULT SYSUTCDATETIME(),
                              CONSTRAINT FK_tm_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
                              CONSTRAINT FK_tm_user FOREIGN KEY (user_id) REFERENCES users(id),
                              CONSTRAINT UQ_tm UNIQUE (team_id, user_id)
);

-- Replaces Team.github/video/pdf + the per-round SubmissionDraft in app.team.tsx.
-- pdf_url should hold a real uploaded-file URL (R2/S3), not just a filename.
-- Business rule (enforced in the service layer):
--   only the team leader (team_members.is_leader = 1) may create/update a submission.
--   The submission is team-owned, so no per-submitter column is stored.
CREATE TABLE submissions (
                             id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sub PRIMARY KEY,
                             team_id      BIGINT NOT NULL,
                             round_id     BIGINT NOT NULL,
                             github_url   NVARCHAR(500) NULL,
                             video_url    NVARCHAR(500) NULL,
                             pdf_url      NVARCHAR(500) NULL,
                             notes        NVARCHAR(MAX) NULL,
                             status       NVARCHAR(20) NOT NULL
        CONSTRAINT DF_sub_status DEFAULT 'Draft'
        CONSTRAINT CK_sub_status CHECK (status IN ('Draft','Under Review','Submitted')),
                             submitted_at DATETIME2 NULL,
                             updated_at   DATETIME2 NOT NULL CONSTRAINT DF_sub_updated DEFAULT SYSUTCDATETIME(),
                             CONSTRAINT FK_sub_team  FOREIGN KEY (team_id)  REFERENCES teams(id),
                             CONSTRAINT FK_sub_round FOREIGN KEY (round_id) REFERENCES rounds(id),
                             CONSTRAINT UQ_sub UNIQUE (team_id, round_id)
);

/* ===================== 4. TEAM FORMATION & MENTORING ====================== */

-- Token-based invite to join a team (used by the /invite/$token route).
CREATE TABLE team_member_invites (
                                     id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tmi PRIMARY KEY,
                                     token        NVARCHAR(100) NOT NULL,
                                     team_id      BIGINT NOT NULL,
                                     track        NVARCHAR(100) NULL,
                                     to_email     NVARCHAR(190) NOT NULL,
                                     from_user_id BIGINT NULL,
                                     status       NVARCHAR(20) NOT NULL
        CONSTRAINT DF_tmi_status DEFAULT 'pending'
        CONSTRAINT CK_tmi_status CHECK (status IN ('pending','accepted','declined','cancelled')),
                                     created_at   DATETIME2 NOT NULL CONSTRAINT DF_tmi_created DEFAULT SYSUTCDATETIME(),
                                     CONSTRAINT FK_tmi_team FOREIGN KEY (team_id)      REFERENCES teams(id) ON DELETE CASCADE,
                                     CONSTRAINT FK_tmi_from FOREIGN KEY (from_user_id) REFERENCES users(id),
                                     CONSTRAINT UQ_tmi_token UNIQUE (token)
);

-- Team <-> mentor chat. The table is cheap; for MVP serve it over plain REST
-- (send + list, refresh/poll). Upgrade to WebSocket only in Phase 2.
CREATE TABLE mentor_messages (
                                 id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mm PRIMARY KEY,
                                 team_id        BIGINT NOT NULL,
                                 mentor_id      BIGINT NULL,                            -- which mentor this conversation is with (thread)
                                 sender         NVARCHAR(10) NOT NULL                   -- which side sent it
        CONSTRAINT CK_mm_sender CHECK (sender IN ('team','mentor')),
                                 sender_user_id BIGINT NULL,                            -- the actual author (which student / which mentor)
                                 body           NVARCHAR(MAX) NOT NULL,
                                 created_at     DATETIME2 NOT NULL CONSTRAINT DF_mm_created DEFAULT SYSUTCDATETIME(),
                                 CONSTRAINT FK_mm_team   FOREIGN KEY (team_id)        REFERENCES teams(id) ON DELETE CASCADE,
                                 CONSTRAINT FK_mm_mentor FOREIGN KEY (mentor_id)      REFERENCES users(id),
                                 CONSTRAINT FK_mm_sender FOREIGN KEY (sender_user_id) REFERENCES users(id)
);

/* ============================ 5. JUDGING ================================== */

-- A judge may be a platform user (user_id set) or an external "guest judge"
-- (user_id NULL). Assignments and scores reference judges.id.
CREATE TABLE judges (
                        id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_judges PRIMARY KEY,
                        user_id    BIGINT NULL,
                        full_name  NVARCHAR(150) NOT NULL,
                        is_guest   BIT NOT NULL CONSTRAINT DF_judges_guest DEFAULT 0,
                        created_at DATETIME2 NOT NULL CONSTRAINT DF_judges_created DEFAULT SYSUTCDATETIME(),
                        CONSTRAINT FK_judges_user FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Filtered unique: one judge profile per user, but many guest judges (NULL).
-- (A plain UNIQUE would reject a 2nd NULL on SQL Server.)
CREATE UNIQUE INDEX UX_judges_user ON judges(user_id) WHERE user_id IS NOT NULL;

-- Business rule (enforced in the service layer, not expressible as a CHECK here):
--   the assigned judge must NOT be the team's mentor (judges.user_id <> teams.mentor_id),
--   so a mentor never scores a team they mentor.
CREATE TABLE judge_assignments (
                                   id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ja PRIMARY KEY,
                                   judge_id       BIGINT NOT NULL,
                                   competition_id BIGINT NOT NULL,
                                   round_id       BIGINT NOT NULL,
                                   team_id        BIGINT NOT NULL,
                                   assigned_at    DATETIME2 NOT NULL CONSTRAINT DF_ja_at DEFAULT SYSUTCDATETIME(),
                                   CONSTRAINT FK_ja_judge FOREIGN KEY (judge_id)       REFERENCES judges(id),
                                   CONSTRAINT FK_ja_comp  FOREIGN KEY (competition_id) REFERENCES competitions(id),
                                   CONSTRAINT FK_ja_round FOREIGN KEY (round_id)       REFERENCES rounds(id),
                                   CONSTRAINT FK_ja_team  FOREIGN KEY (team_id)        REFERENCES teams(id),
                                   CONSTRAINT UQ_ja UNIQUE (judge_id, round_id, team_id)
);

-- One row per (judge, team, round, criterion) — matches the prototype upsert key.
CREATE TABLE scores (
                        id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_scores PRIMARY KEY,
                        judge_id     BIGINT NOT NULL,
                        team_id      BIGINT NOT NULL,
                        round_id     BIGINT NOT NULL,
                        criterion_id BIGINT NOT NULL,
                        score        DECIMAL(6,2) NOT NULL
                            CONSTRAINT CK_scores_range CHECK (score >= 0 AND score <= 100),  -- DB sanity bound; per-criterion max_score ceiling enforced in service
                        comment      NVARCHAR(MAX) NULL,
                        status       NVARCHAR(20) NOT NULL
        CONSTRAINT DF_scores_status DEFAULT 'PENDING_REVIEW'
        CONSTRAINT CK_scores_status CHECK (status IN ('PENDING_REVIEW','APPROVED')),
                        reviewed_by  BIGINT NULL,
                        reviewed_at  DATETIME2 NULL,
                        created_at   DATETIME2 NOT NULL CONSTRAINT DF_scores_created DEFAULT SYSUTCDATETIME(),
                        updated_at   DATETIME2 NOT NULL CONSTRAINT DF_scores_updated DEFAULT SYSUTCDATETIME(),
                        CONSTRAINT FK_scores_judge    FOREIGN KEY (judge_id)     REFERENCES judges(id),
                        CONSTRAINT FK_scores_team     FOREIGN KEY (team_id)      REFERENCES teams(id),
                        CONSTRAINT FK_scores_round    FOREIGN KEY (round_id)     REFERENCES rounds(id),
                        CONSTRAINT FK_scores_crit     FOREIGN KEY (criterion_id) REFERENCES scoring_criteria(id),
                        CONSTRAINT FK_scores_reviewer FOREIGN KEY (reviewed_by)  REFERENCES users(id),
                        CONSTRAINT UQ_scores UNIQUE (judge_id, team_id, round_id, criterion_id)
);

-- Coordinator/Admin weighted-score override (one per team+round). Reason required.
-- Core feature: computeRanking() uses these; >20pt change is flagged in audit_log.
CREATE TABLE score_overrides (
                                 id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ov PRIMARY KEY,
                                 team_id         BIGINT NOT NULL,
                                 round_id        BIGINT NOT NULL,
                                 override_score  DECIMAL(6,2) NOT NULL
                                     CONSTRAINT CK_ov_range CHECK (override_score BETWEEN 0 AND 100),
                                 reason          NVARCHAR(MAX) NOT NULL,
                                 created_by      BIGINT NULL,
                                 created_by_name NVARCHAR(150) NULL,
                                 created_at      DATETIME2 NOT NULL CONSTRAINT DF_ov_created DEFAULT SYSUTCDATETIME(),
                                 CONSTRAINT FK_ov_team  FOREIGN KEY (team_id)    REFERENCES teams(id),
                                 CONSTRAINT FK_ov_round FOREIGN KEY (round_id)   REFERENCES rounds(id),
                                 CONSTRAINT FK_ov_user  FOREIGN KEY (created_by) REFERENCES users(id),
                                 CONSTRAINT UQ_ov UNIQUE (team_id, round_id)
);

/* ====================== 6. AUDIT & NOTIFICATIONS ========================== */

-- Server-written, append-only audit trail (prototype let the client write it).
-- user_name / team_name are denormalized so history survives row deletion.
CREATE TABLE audit_log (
                           id          BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit PRIMARY KEY,
                           user_id     BIGINT NULL,
                           user_name   NVARCHAR(150) NULL,
                           action      NVARCHAR(300) NOT NULL,
                           entity_type NVARCHAR(20) NOT NULL
        CONSTRAINT CK_audit_entity CHECK (entity_type IN
            ('Score','Criteria','Assignment','Ranking','Round','Competition','User','Rules')),
                           entity_id   NVARCHAR(100) NULL,
                           old_value   NVARCHAR(MAX) NULL,
                           new_value   NVARCHAR(MAX) NULL,
                           reason      NVARCHAR(MAX) NULL,
                           flagged     BIT NOT NULL CONSTRAINT DF_audit_flagged DEFAULT 0,
                           team_name   NVARCHAR(150) NULL,
                           created_at  DATETIME2 NOT NULL CONSTRAINT DF_audit_created DEFAULT SYSUTCDATETIME(),
                           CONSTRAINT FK_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notifications (
                               id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notif PRIMARY KEY,
                               user_id    BIGINT NULL,                               -- NULL = broadcast to everyone
                               title      NVARCHAR(200) NOT NULL,
                               body       NVARCHAR(MAX) NULL,
                               type       NVARCHAR(20) NOT NULL
        CONSTRAINT DF_notif_type DEFAULT 'info'
        CONSTRAINT CK_notif_type CHECK (type IN ('info','warning','success','error')),
                               is_read    BIT NOT NULL CONSTRAINT DF_notif_read DEFAULT 0,
                               created_at DATETIME2 NOT NULL CONSTRAINT DF_notif_created DEFAULT SYSUTCDATETIME(),
                               CONSTRAINT FK_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

/* ===================== 7. INDEXES (query performance) ===================== */
-- SQL Server does NOT auto-index foreign keys. Index the hot read paths.

CREATE INDEX IX_comp_season   ON competitions(season_id);   -- season dashboard / archive
CREATE INDEX IX_rounds_comp   ON rounds(competition_id);
CREATE INDEX IX_crit_round    ON scoring_criteria(round_id);
CREATE INDEX IX_teams_comp    ON teams(competition_id);
CREATE INDEX IX_teams_mentor  ON teams(mentor_id);
CREATE INDEX IX_tm_user       ON team_members(user_id);
CREATE INDEX IX_sub_round     ON submissions(round_id);
CREATE INDEX IX_mm_team       ON mentor_messages(team_id);

CREATE INDEX IX_ja_round      ON judge_assignments(round_id);
CREATE INDEX IX_ja_judge      ON judge_assignments(judge_id);
CREATE INDEX IX_ja_team       ON judge_assignments(team_id);

CREATE INDEX IX_scores_round  ON scores(round_id);
CREATE INDEX IX_scores_team   ON scores(team_id);
CREATE INDEX IX_scores_judge  ON scores(judge_id);
CREATE INDEX IX_scores_status ON scores(status);

CREATE INDEX IX_audit_created ON audit_log(created_at DESC);
CREATE INDEX IX_audit_entity  ON audit_log(entity_type);
CREATE INDEX IX_notif_user    ON notifications(user_id);

-- Only one PENDING team invite per (team, email); allows re-invite after decline.
CREATE UNIQUE INDEX UX_tmi_pending
    ON team_member_invites(team_id, to_email)
    WHERE status = 'pending';

/* ============================ END OF SCHEMA =============================== */
