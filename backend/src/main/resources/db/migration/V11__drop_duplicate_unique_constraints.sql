-- V11: drop duplicate UNIQUE constraints.
--
-- Four tables carry two UNIQUE constraints on an identical column set: a hand-named uq_* and a
-- Hibernate-generated UK<hash>, both from the same logical rule. Each duplicate is a second unique
-- index maintained on every insert and update for no added guarantee. This is schema-dump residue.
--
-- The readable uq_* names are kept and the UK<hash> duplicates dropped. Hibernate validate does not
-- verify unique constraints, only tables and columns, so removing one of an identical pair changes
-- nothing it checks and leaves the uniqueness guarantee intact.
ALTER TABLE dbo.finalist_contested_slot_teams DROP CONSTRAINT UKgd614s3awdkw2r75iikqkan0r;
GO
ALTER TABLE dbo.finalist_selections DROP CONSTRAINT UK4b484bu8jyfdkjnl1w04w4ia9;
GO
ALTER TABLE dbo.track_draw_sessions DROP CONSTRAINT UKa9mj81t7o38nsry31cnr32vqc;
GO
ALTER TABLE dbo.track_draw_queue DROP CONSTRAINT UK69oqex9b0mg7xd0vtipantt9g;
GO
ALTER TABLE dbo.track_draw_queue DROP CONSTRAINT UKnyaq1hmm0mcrmqmeqa62alwqu;
GO
