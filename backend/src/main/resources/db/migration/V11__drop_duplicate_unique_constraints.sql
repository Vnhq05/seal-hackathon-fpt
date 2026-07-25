-- V11: drop duplicate UNIQUE constraints.
--
-- Four tables carry two UNIQUE constraints on an identical column set: a hand-named uq_* and a
-- Hibernate-generated UK<hash>, both from the same logical rule. Each duplicate is a second unique
-- index maintained on every insert and update for no added guarantee. This is schema-dump residue.
--
-- The readable uq_* names are kept and the UK<hash> duplicates dropped. Hibernate validate does not
-- verify unique constraints, only tables and columns, so removing one of an identical pair changes
-- nothing it checks and leaves the uniqueness guarantee intact.
-- Idempotent: skip when the Hibernate UK hash is absent on this instance.

IF OBJECT_ID(N'dbo.finalist_contested_slot_teams', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UKgd614s3awdkw2r75iikqkan0r' AND parent_object_id = OBJECT_ID(N'dbo.finalist_contested_slot_teams'))
    ALTER TABLE dbo.finalist_contested_slot_teams DROP CONSTRAINT UKgd614s3awdkw2r75iikqkan0r;

IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UK4b484bu8jyfdkjnl1w04w4ia9' AND parent_object_id = OBJECT_ID(N'dbo.finalist_selections'))
    ALTER TABLE dbo.finalist_selections DROP CONSTRAINT UK4b484bu8jyfdkjnl1w04w4ia9;

IF OBJECT_ID(N'dbo.track_draw_sessions', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UKa9mj81t7o38nsry31cnr32vqc' AND parent_object_id = OBJECT_ID(N'dbo.track_draw_sessions'))
    ALTER TABLE dbo.track_draw_sessions DROP CONSTRAINT UKa9mj81t7o38nsry31cnr32vqc;

IF OBJECT_ID(N'dbo.track_draw_queue', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UK69oqex9b0mg7xd0vtipantt9g' AND parent_object_id = OBJECT_ID(N'dbo.track_draw_queue'))
    ALTER TABLE dbo.track_draw_queue DROP CONSTRAINT UK69oqex9b0mg7xd0vtipantt9g;

IF OBJECT_ID(N'dbo.track_draw_queue', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UKnyaq1hmm0mcrmqmeqa62alwqu' AND parent_object_id = OBJECT_ID(N'dbo.track_draw_queue'))
    ALTER TABLE dbo.track_draw_queue DROP CONSTRAINT UKnyaq1hmm0mcrmqmeqa62alwqu;
