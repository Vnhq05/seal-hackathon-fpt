-- Event-level scoring scale (min fixed at 1; max is 5, 10, or 100). Default 100.
ALTER TABLE dbo.hackathon_events
    ADD score_scale_max INT NULL;
GO

UPDATE dbo.hackathon_events
SET score_scale_max = 100
WHERE score_scale_max IS NULL;
GO

ALTER TABLE dbo.hackathon_events
    ALTER COLUMN score_scale_max INT NOT NULL;
GO

ALTER TABLE dbo.hackathon_events
    ADD CONSTRAINT DF_hackathon_events_score_scale_max
        DEFAULT (100) FOR score_scale_max;
GO

ALTER TABLE dbo.hackathon_events
    ADD CONSTRAINT CK_hackathon_events_score_scale_max
        CHECK (score_scale_max IN (5, 10, 100));
GO
