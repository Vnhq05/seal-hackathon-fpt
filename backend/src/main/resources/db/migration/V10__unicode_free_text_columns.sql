-- V10: make user-facing free-text columns Unicode-capable.
--
-- V8 fixed audit_logs, but ~20 other free-text columns were baked as varchar in V0. varchar stores
-- text in the database codepage, not Unicode, so on any non-Vietnamese collation every diacritic is
-- transcoded away on insert. These columns all hold text users type: team and event names, chat
-- messages, dispute reasons, feedback comments. db/archive/seal_spring_2026_encoding_fix.sql is a
-- manual one-off that promoted a handful of these on one database and is NOT on the Flyway path
-- (locations = classpath:db/migration), so a database built from V0..V9 has them all as varchar.
--
-- No entity changes accompany this: Hibernate validate already accepts a plain String field against
-- an nvarchar column (RefreshToken.token maps String to the NVARCHAR(64) that V1 produced, and the
-- schema-integrity test passes). Lengths and nullability below match V0 exactly.
--
-- Forward fix only: rows already written through varchar on a non-Vietnamese collation lost their
-- bytes at insert and cannot be recovered by widening the column.

-- ── Columns not covered by any index or constraint: direct ALTER ──
ALTER TABLE dbo.disputes                  ALTER COLUMN reason           NVARCHAR(2000) NOT NULL;
GO
ALTER TABLE dbo.disputes                  ALTER COLUMN resolution       NVARCHAR(2000) NULL;
GO
ALTER TABLE dbo.honored_guests            ALTER COLUMN full_name        NVARCHAR(255)  NOT NULL;
GO
ALTER TABLE dbo.honored_guests            ALTER COLUMN title            NVARCHAR(255)  NULL;
GO
ALTER TABLE dbo.judge_comments            ALTER COLUMN comment          NVARCHAR(2000) NOT NULL;
GO
ALTER TABLE dbo.mentor_chat_messages      ALTER COLUMN message          NVARCHAR(2000) NOT NULL;
GO
-- varchar(5000) exceeds the nvarchar row-length limit of 4000, so this one must be MAX, not (5000).
ALTER TABLE dbo.mentor_feedbacks          ALTER COLUMN content          NVARCHAR(MAX)  NOT NULL;
GO
ALTER TABLE dbo.mentor_invitations        ALTER COLUMN message          NVARCHAR(500)  NULL;
GO
ALTER TABLE dbo.notifications             ALTER COLUMN message          NVARCHAR(2000) NOT NULL;
GO
ALTER TABLE dbo.notifications             ALTER COLUMN title            NVARCHAR(255)  NOT NULL;
GO
ALTER TABLE dbo.participant_feedbacks     ALTER COLUMN comment          NVARCHAR(2000) NULL;
GO
ALTER TABLE dbo.score_review_requests     ALTER COLUMN resolution_note  NVARCHAR(2000) NULL;
GO
ALTER TABLE dbo.scoring_template_criteria ALTER COLUMN description      NVARCHAR(1000) NULL;
GO
ALTER TABLE dbo.scoring_template_criteria ALTER COLUMN name             NVARCHAR(255)  NOT NULL;
GO
ALTER TABLE dbo.scoring_templates         ALTER COLUMN description      NVARCHAR(1000) NULL;
GO
ALTER TABLE dbo.submission_attachments    ALTER COLUMN file_name        NVARCHAR(255)  NOT NULL;
GO
ALTER TABLE dbo.team_join_requests        ALTER COLUMN message          NVARCHAR(500)  NULL;
GO
ALTER TABLE dbo.team_leave_requests       ALTER COLUMN reason           NVARCHAR(500)  NULL;
GO
ALTER TABLE dbo.teams                     ALTER COLUMN recruitment_note NVARCHAR(1000) NULL;
GO

-- ── name columns backing a UNIQUE constraint: SQL Server blocks a type change while the constraint
--    exists, so drop, alter, recreate. Constraint names and column lists are kept identical to V0. ──
ALTER TABLE dbo.hackathon_events DROP CONSTRAINT UKg1t6o5chi9anma0jefjohyb24;
GO
ALTER TABLE dbo.hackathon_events ALTER COLUMN name NVARCHAR(255) NOT NULL;
GO
ALTER TABLE dbo.hackathon_events ADD CONSTRAINT UKg1t6o5chi9anma0jefjohyb24 UNIQUE NONCLUSTERED (name);
GO

ALTER TABLE dbo.teams DROP CONSTRAINT UKh96ggvfjvw458isq93w50kmrf;
GO
ALTER TABLE dbo.teams ALTER COLUMN name NVARCHAR(255) NOT NULL;
GO
ALTER TABLE dbo.teams ADD CONSTRAINT UKh96ggvfjvw458isq93w50kmrf UNIQUE NONCLUSTERED (event_id, name);
GO

ALTER TABLE dbo.scoring_templates DROP CONSTRAINT UKiuba4qcryl7vky426lsp5ufhu;
GO
ALTER TABLE dbo.scoring_templates ALTER COLUMN name NVARCHAR(255) NOT NULL;
GO
ALTER TABLE dbo.scoring_templates ADD CONSTRAINT UKiuba4qcryl7vky426lsp5ufhu UNIQUE NONCLUSTERED (name);
GO
