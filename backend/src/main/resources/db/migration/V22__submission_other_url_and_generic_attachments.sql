-- Slide + GitHub + Other (any link / any file). Progress uses 3 parts.
-- Keep demo_url for backward compatibility (mapped as Other in progress).

ALTER TABLE dbo.submission_versions
    ADD other_url NVARCHAR(500) NULL;
GO

-- Allow non-PDF attachments: nullable page_count, larger size, optional content_type
ALTER TABLE dbo.submission_attachments
    ADD content_type NVARCHAR(255) NULL;
GO

ALTER TABLE dbo.submission_attachments
    ALTER COLUMN page_count INT NULL;
GO

DECLARE @ck_page SYSNAME =
    (SELECT TOP 1 name FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.submission_attachments')
       AND name LIKE N'CK__submissio__page_%');
IF @ck_page IS NOT NULL
    EXEC(N'ALTER TABLE dbo.submission_attachments DROP CONSTRAINT [' + @ck_page + N']');
GO

DECLARE @ck_size SYSNAME =
    (SELECT TOP 1 name FROM sys.check_constraints
     WHERE parent_object_id = OBJECT_ID(N'dbo.submission_attachments')
       AND name LIKE N'CK__submissio__file_%');
IF @ck_size IS NOT NULL
    EXEC(N'ALTER TABLE dbo.submission_attachments DROP CONSTRAINT [' + @ck_size + N']');
GO

ALTER TABLE dbo.submission_attachments
    ADD CONSTRAINT CK_submission_attachments_file_size
    CHECK ([file_size] >= (1) AND [file_size] <= (26214400));
GO
