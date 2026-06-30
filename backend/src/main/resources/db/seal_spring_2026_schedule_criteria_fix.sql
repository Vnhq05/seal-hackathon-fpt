-- Supplemental fix: repair event_schedules and criteria for SEAL Spring 2026.
-- The original seal_spring_2026_encoding_fix.sql promoted columns to NVARCHAR but
-- did not UPDATE data in these two tables. Run once after the original script.
-- sqlcmd -S <host> -d SEAL -i seal_spring_2026_schedule_criteria_fix.sql

-- ── event_schedules ──
UPDATE es
SET es.title = CASE
        WHEN es.type = 'OPENING'                          THEN N'Opening & track draw'
        WHEN es.type = 'TRACK_DRAW'                       THEN N'Track selection draw'
        WHEN es.type = 'MILESTONE' AND es.sort_order = 3  THEN N'Milestone 1 — Idea & architecture completion'
        WHEN es.type = 'MILESTONE' AND es.sort_order = 4  THEN N'Milestone 2 — Pitching & product completion'
        WHEN es.type = 'SCORING'                          THEN N'Preliminary scoring'
        WHEN es.type = 'FINAL'                            THEN N'Finals'
        WHEN es.type = 'CEREMONY'                         THEN N'Awards & closing ceremony'
        ELSE es.title
    END,
    es.description = CASE
        WHEN es.type = 'OPENING'                          THEN N'Teams pick tracks in turn; organizers draw topics per track'
        WHEN es.type = 'MILESTONE' AND es.sort_order = 3  THEN N'Design Agentic RAG architecture'
        WHEN es.type = 'MILESTONE' AND es.sort_order = 4  THEN N'Parallel pitching and coding'
        WHEN es.type = 'SCORING'                          THEN N'5-minute presentation + 3-minute Q&A'
        WHEN es.type = 'FINAL'                            THEN N'7-minute presentation + 3-minute Q&A — Top 6 teams'
        ELSE es.description
    END,
    es.updated_at = SYSUTCDATETIME()
FROM event_schedules es
INNER JOIN hackathon_events e ON es.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND es.type IN ('OPENING', 'TRACK_DRAW', 'MILESTONE', 'SCORING', 'FINAL', 'CEREMONY');
GO

-- ── criteria ──
UPDATE c
SET c.name = CASE
        WHEN r.round_type = 'PRELIMINARY' AND c.sort_order = 0 THEN N'Accuracy and Domain Relevance'
        WHEN r.round_type = 'PRELIMINARY' AND c.sort_order = 1 THEN N'Agentic RAG Architecture & Algorithm'
        WHEN r.round_type = 'PRELIMINARY' AND c.sort_order = 2 THEN N'Ideas & Presentation'
        WHEN r.round_type = 'PRELIMINARY' AND c.sort_order = 3 THEN N'Feasibility & Creativity'
        WHEN r.round_type = 'PRELIMINARY' AND c.sort_order = 4 THEN N'User Experience & Interactive Interface'
        WHEN r.round_type = 'FINAL'       AND c.sort_order = 0 THEN N'Data Processing & Retrieval Quality'
        WHEN r.round_type = 'FINAL'       AND c.sort_order = 1 THEN N'Reliability & Hallucination Resistance'
        WHEN r.round_type = 'FINAL'       AND c.sort_order = 2 THEN N'Agent Reasoning & Multi-hop Processing'
        WHEN r.round_type = 'FINAL'       AND c.sort_order = 3 THEN N'Practicality & Operational Optimization'
        WHEN r.round_type = 'FINAL'       AND c.sort_order = 4 THEN N'Scalability & Innovation'
        ELSE c.name
    END,
    c.updated_at = SYSUTCDATETIME()
FROM criteria c
INNER JOIN rounds r   ON c.round_id  = r.id
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026';
GO

PRINT 'SEAL Spring 2026 schedule + criteria repair completed.';
