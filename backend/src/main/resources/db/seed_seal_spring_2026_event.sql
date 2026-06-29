-- Seed SEAL RAG Spring 2026 structure for existing empty Spring event (idempotent).
-- Run: sqlcmd -S localhost -E -d SEAL -i seed_seal_spring_2026_event.sql

DECLARE @eventId UNIQUEIDENTIFIER;
DECLARE @now DATETIME2 = GETUTCDATE();

SELECT TOP 1 @eventId = id
FROM hackathon_events
WHERE season = 'Spring' AND year = 2026 AND competition_format = 'GENERIC'
ORDER BY created_at;

IF @eventId IS NULL
BEGIN
    PRINT 'No empty Spring 2026 GENERIC event found — skipping.';
    RETURN;
END

UPDATE hackathon_events
SET name = N'SEAL Hackathon Spring 2026',
    competition_format = 'SEAL_RAG_2026',
    start_date = '2026-04-12',
    end_date = '2026-04-12',
    registration_open_date = '2026-03-15',
    registration_deadline = '2026-03-25',
    description = N'SEAL Hackathon Spring 2026 — Agentic RAG',
    location = N'FPT University Da Nang',
    format = 'OFFLINE',
    min_team = 3,
    max_team = 5,
    semester_min = 4,
    semester_max = 8,
    scoring_template_id = (SELECT TOP 1 id FROM scoring_templates),
    created_by = N'coordinator@seal.com',
    updated_at = @now
WHERE id = @eventId;

-- Tracks (3 boards)
IF NOT EXISTS (SELECT 1 FROM tracks WHERE event_id = @eventId)
BEGIN
    INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at)
    VALUES
        (NEWID(), @eventId, N'Bảng A', N'SEAL Spring 2026 — Bảng A', 8, 'OPEN', @now, @now),
        (NEWID(), @eventId, N'Bảng B', N'SEAL Spring 2026 — Bảng B', 8, 'OPEN', @now, @now),
        (NEWID(), @eventId, N'Bảng C', N'SEAL Spring 2026 — Bảng C', 8, 'OPEN', @now, @now);
END

-- Rounds
DECLARE @prelimId UNIQUEIDENTIFIER;
DECLARE @finalId UNIQUEIDENTIFIER;

IF NOT EXISTS (SELECT 1 FROM rounds WHERE event_id = @eventId)
BEGIN
    SET @prelimId = NEWID();
    SET @finalId = NEWID();

    INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date,
        slide_deadline, submission_deadline, scoring_deadline,
        advancement_cutoff, advancement_rule, round_weight, created_at, updated_at)
    VALUES
        (@prelimId, @eventId, 1, N'Vòng bảng', 'PRELIMINARY',
         '2026-04-12 07:00:00', '2026-04-12 15:30:00',
         '2026-04-12 10:00:00', '2026-04-12 14:00:00', '2026-04-12 15:30:00',
         2, 'PER_TRACK_TOP_N', 40, @now, @now),
        (@finalId, @eventId, 2, N'Chung kết', 'FINAL',
         '2026-04-12 15:30:00', '2026-04-12 17:00:00',
         NULL, '2026-04-12 15:30:00', '2026-04-12 17:00:00',
         6, 'FINALIST_POOL', 60, @now, @now);

    -- Preliminary criteria
    INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at)
    VALUES
        (NEWID(), @prelimId, N'Tính chính xác và phù hợp với Domain', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
        (NEWID(), @prelimId, N'Kiến trúc Agentic RAG & Giải thuật', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
        (NEWID(), @prelimId, N'Ý tưởng & Thuyết trình', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
        (NEWID(), @prelimId, N'Khả năng thực thi & tính sáng tạo', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
        (NEWID(), @prelimId, N'Trải nghiệm người dùng & giao diện tương tác', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now);

    -- Final criteria
    INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at)
    VALUES
        (NEWID(), @finalId, N'Chất lượng xử lý & truy xuất dữ liệu', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
        (NEWID(), @finalId, N'Độ tin cậy & chống ảo giác', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
        (NEWID(), @finalId, N'Tư duy Agent & xử lý đa tầng', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
        (NEWID(), @finalId, N'Tính thực tế & tối ưu vận hành', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
        (NEWID(), @finalId, N'Khả năng mở rộng & sáng tạo', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);
END

-- Prizes
IF NOT EXISTS (SELECT 1 FROM prizes WHERE event_id = @eventId)
BEGIN
    INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at)
    VALUES
        (NEWID(), @eventId, 'FIRST', '7000000', 1, N'Giải Nhất', @now, @now),
        (NEWID(), @eventId, 'SECOND', '5000000', 1, N'Giải Nhì', @now, @now),
        (NEWID(), @eventId, 'THIRD', '3000000', 1, N'Giải Ba', @now, @now),
        (NEWID(), @eventId, 'CONSOLATION', '1500000', 1, N'Khuyến khích', @now, @now);
END

-- Event schedules
IF NOT EXISTS (SELECT 1 FROM event_schedules WHERE event_id = @eventId)
BEGIN
    INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at)
    VALUES
        (NEWID(), @eventId, 'WORKSHOP', N'Workshop', NULL, '2026-04-09 09:00:00', '2026-04-09 12:00:00', NULL, 0, @now, @now),
        (NEWID(), @eventId, 'OPENING', N'Khai mạc & bốc thăm bảng', N'Đội tự chọn bảng theo lượt; BTC bốc thăm topic cho từng bảng', '2026-04-11 14:00:00', '2026-04-11 17:00:00', NULL, 1, @now, @now),
        (NEWID(), @eventId, 'TRACK_DRAW', N'Bốc thăm chọn bảng', NULL, '2026-04-11 14:00:00', '2026-04-11 16:00:00', NULL, 2, @now, @now),
        (NEWID(), @eventId, 'MILESTONE', N'Milestone 1 — Hoàn thiện ý tưởng & kiến trúc', N'Thiết kế Agentic RAG architecture', '2026-04-12 07:00:00', '2026-04-12 10:00:00', 'SLIDE_SUBMISSION', 3, @now, @now),
        (NEWID(), @eventId, 'MILESTONE', N'Milestone 2 — Pitching & hoàn thiện sản phẩm', N'Pitching song song với coding', '2026-04-12 10:00:00', '2026-04-12 14:00:00', 'DEMO_SUBMISSION', 4, @now, @now),
        (NEWID(), @eventId, 'SCORING', N'Chấm vòng bảng', N'5 phút thuyết trình + 3 phút Q&A', '2026-04-12 14:00:00', '2026-04-12 15:30:00', NULL, 5, @now, @now),
        (NEWID(), @eventId, 'FINAL', N'Chung kết', N'7 phút thuyết trình + 3 phút Q&A — Top 6 đội', '2026-04-12 15:30:00', '2026-04-12 17:00:00', NULL, 6, @now, @now),
        (NEWID(), @eventId, 'CEREMONY', N'Trao giải & bế mạc', NULL, '2026-04-12 17:00:00', '2026-04-12 18:00:00', NULL, 7, @now, @now);
END

-- Allowed email domains
IF NOT EXISTS (SELECT 1 FROM allowed_email_domains WHERE event_id = @eventId)
BEGIN
    INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at)
    VALUES
        (NEWID(), @eventId, 'fpt.edu.vn', N'FPT University', @now, @now),
        (NEWID(), @eventId, 'fe.edu.vn', N'FPT Education', @now, @now),
        (NEWID(), @eventId, 'hcmut.edu.vn', N'ĐH Bách khoa TP.HCM', @now, @now),
        (NEWID(), @eventId, 'hcmus.edu.vn', N'ĐH Khoa học Tự nhiên TP.HCM', @now, @now),
        (NEWID(), @eventId, 'student.hcmus.edu.vn', N'ĐH Khoa học Tự nhiên TP.HCM', @now, @now),
        (NEWID(), @eventId, 'uit.edu.vn', N'ĐH Công nghệ Thông tin TP.HCM', @now, @now),
        (NEWID(), @eventId, 'hcmute.edu.vn', N'ĐH Sư phạm Kỹ thuật TP.HCM', @now, @now),
        (NEWID(), @eventId, 'ueh.edu.vn', N'ĐH Kinh tế TP.HCM', @now, @now),
        (NEWID(), @eventId, 'student.ueh.edu.vn', N'ĐH Kinh tế TP.HCM', @now, @now);
END

PRINT 'SEAL Spring 2026 event seeded for event ' + CAST(@eventId AS NVARCHAR(36));
