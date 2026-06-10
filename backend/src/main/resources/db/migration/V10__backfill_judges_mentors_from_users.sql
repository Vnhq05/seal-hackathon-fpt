-- Trước đây tạo account nhân sự chỉ lưu vào users (không tạo bản ghi judges/mentors),
-- nên màn hình "Judge & Mentor assignment" không có dữ liệu để chọn.
-- Backfill: sinh hồ sơ judge/mentor cho các user đã có theo role.
--   Judge   <- role Judge hoặc Lecturer
--   Mentor  <- role Mentor hoặc Lecturer   (Lecturer = vừa Judge vừa Mentor)
-- Có NOT EXISTS nên chạy lại an toàn (không tạo trùng).

INSERT INTO judges (user_id, full_name, is_guest, created_at)
SELECT u.id, u.full_name, 0, SYSUTCDATETIME()
FROM users u
WHERE u.role IN ('Judge', 'Lecturer')
  AND NOT EXISTS (SELECT 1 FROM judges j WHERE j.user_id = u.id);

INSERT INTO mentors (user_id, full_name, specialty, organization)
SELECT u.id, u.full_name, NULL, NULL
FROM users u
WHERE u.role IN ('Mentor', 'Lecturer')
  AND NOT EXISTS (SELECT 1 FROM mentors m WHERE m.user_id = u.id);
