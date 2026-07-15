-- Migrate SEAL Spring 2026 event labels from Vietnamese to English.
-- Run once on existing databases: sqlcmd -S <host> -d SEAL -i seal_spring_2026_english_labels.sql

-- ── tracks ──
UPDATE t
SET t.name = CASE
        WHEN t.name IN (N'Bảng A', N'Track A') OR t.name LIKE N'% A' THEN N'Track A'
        WHEN t.name IN (N'Bảng B', N'Track B') OR t.name LIKE N'% B' THEN N'Track B'
        WHEN t.name IN (N'Bảng C', N'Track C') OR t.name LIKE N'% C' THEN N'Track C'
        ELSE t.name
    END,
    t.description = CASE
        WHEN t.name IN (N'Bảng A', N'Track A') OR t.name LIKE N'% A' THEN N'SEAL Spring 2026 — Track A'
        WHEN t.name IN (N'Bảng B', N'Track B') OR t.name LIKE N'% B' THEN N'SEAL Spring 2026 — Track B'
        WHEN t.name IN (N'Bảng C', N'Track C') OR t.name LIKE N'% C' THEN N'SEAL Spring 2026 — Track C'
        ELSE t.description
    END,
    t.updated_at = SYSUTCDATETIME()
FROM tracks t
INNER JOIN hackathon_events e ON t.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026';
GO

-- ── rounds ──
UPDATE r
SET r.name = CASE
        WHEN r.round_type = 'PRELIMINARY' THEN N'Preliminary Round'
        WHEN r.round_type = 'FINAL'       THEN N'Finals'
        ELSE r.name
    END,
    r.updated_at = SYSUTCDATETIME()
FROM rounds r
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026';
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
    c.description = CASE
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
        ELSE c.description
    END,
    c.updated_at = SYSUTCDATETIME()
FROM criteria c
INNER JOIN rounds r ON c.round_id = r.id
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026';
GO

-- ── prizes ──
UPDATE p
SET p.label = CASE p.rank
        WHEN 'FIRST' THEN N'First Prize'
        WHEN 'SECOND' THEN N'Second Prize'
        WHEN 'THIRD' THEN N'Third Prize'
        WHEN 'CONSOLATION' THEN N'Consolation Prize'
        ELSE p.label
    END,
    p.updated_at = SYSUTCDATETIME()
FROM prizes p
INNER JOIN hackathon_events e ON p.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026';
GO

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

-- ── allowed email domains (all events) ──
UPDATE allowed_email_domains SET university_label = N'Ho Chi Minh City University of Technology', updated_at = SYSUTCDATETIME() WHERE domain = 'hcmut.edu.vn';
UPDATE allowed_email_domains SET university_label = N'Vietnam National University Ho Chi Minh City - University of Science', updated_at = SYSUTCDATETIME() WHERE domain IN ('hcmus.edu.vn', 'student.hcmus.edu.vn');
UPDATE allowed_email_domains SET university_label = N'University of Information Technology', updated_at = SYSUTCDATETIME() WHERE domain = 'uit.edu.vn';
UPDATE allowed_email_domains SET university_label = N'Ho Chi Minh City University of Education and Technology', updated_at = SYSUTCDATETIME() WHERE domain = 'hcmute.edu.vn';
UPDATE allowed_email_domains SET university_label = N'University of Economics Ho Chi Minh City', updated_at = SYSUTCDATETIME() WHERE domain IN ('ueh.edu.vn', 'student.ueh.edu.vn');
UPDATE allowed_email_domains SET university_label = N'Industrial University of Ho Chi Minh City', updated_at = SYSUTCDATETIME() WHERE domain = 'student.iuh.edu.vn';
GO

-- ── scoring templates ──
UPDATE scoring_templates
SET name = N'SEAL Spring 2026 — Preliminary Round', updated_at = SYSUTCDATETIME()
WHERE name = N'SEAL Spring 2026 — Vòng bảng';

UPDATE scoring_templates
SET name = N'SEAL Spring 2026 — Finals', updated_at = SYSUTCDATETIME()
WHERE name = N'SEAL Spring 2026 — Chung kết';
GO

-- ── sync external student university names from domain labels ──
UPDATE u
SET u.university_name = d.university_label,
    u.updated_at = SYSUTCDATETIME()
FROM users u
INNER JOIN allowed_email_domains d
    ON LOWER(SUBSTRING(u.email, CHARINDEX('@', u.email) + 1, LEN(u.email))) = d.domain
WHERE u.user_type = 'EXTERNAL_STUDENT'
  AND d.university_label IS NOT NULL
  AND (u.university_name IS NULL OR u.university_name <> d.university_label);
GO

PRINT 'SEAL Spring 2026 English label migration completed.';
