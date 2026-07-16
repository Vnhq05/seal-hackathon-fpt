-- V8: make audit payload columns Unicode-capable.
--
-- V0 baked old_value/new_value as `text` -- the only two non-Unicode LOB columns in the whole
-- 59-table baseline. `text` is a non-Unicode type (and deprecated since SQL Server 2005), so every
-- Vietnamese character written to it is transcoded to the database codepage and lost. The audit
-- payloads carry team names, event names and rejection reasons: free text, routinely Vietnamese.
--
-- db/archive/seal_spring_2026_encoding_fix.sql (under src/main/resources) fixed this same class of
-- mojibake on users, hackathon_events, tracks, rounds and criteria, but never touched audit_logs.
--
-- This is a forward fix only. Rows already written through `text` lost their bytes at INSERT time
-- and cannot be recovered by widening the column.
ALTER TABLE dbo.audit_logs ALTER COLUMN old_value NVARCHAR(MAX) NULL;
GO

ALTER TABLE dbo.audit_logs ALTER COLUMN new_value NVARCHAR(MAX) NULL;
GO
