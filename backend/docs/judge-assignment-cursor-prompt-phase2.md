# TASK (Phase 2): Thêm Competition Group + scope 3 cấp (Round / Track / Group)

Tiền đề: Phase 1 đã xong — `JudgingService` gate qua `isJudgeAssignedToRoundScope`, FE đã bỏ modal gán-3-judge/team.
Tham chiếu chi tiết BR gốc: `backend/docs/judge-assignment-cursor-prompt.md` (BR-JA-04, 06, 07, 08, 09, 10).

## Mục tiêu Phase 2
Đưa `CompetitionGroup` vào hệ thống thật (không còn né tránh như Phase 1), nâng `JudgeAssignment` từ mô hình
nhị phân (trackId null/not-null) lên mô hình 3 cấp tường minh `AssignmentScope { ROUND, TRACK, GROUP }`,
vì mô hình cũ không đủ chỗ chứa cấp Group.

## 1. Domain model mới
- Entity `CompetitionGroup` (package `event.domain`): `trackId` (bắt buộc), `name`, unique `(track_id, name)`.
- `Team` thêm `groupId` (nullable UUID).
- `JudgeAssignment` thêm:
  - `scope: AssignmentScope { ROUND, TRACK, GROUP }` (not null).
  - `groupId` (nullable, chỉ set khi `scope = GROUP`).
  Giữ nguyên cột `trackId` hiện có (không đổi tên), chỉ diễn giải lại theo `scope` thay vì suy ra từ null/not-null như Phase 1.

## 2. Migration
1. `judge_assignments`: thêm `scope` — backfill từ dữ liệu Phase 1: `trackId IS NULL → 'ROUND'`, `trackId IS NOT NULL → 'TRACK'`. Set `NOT NULL` sau backfill.
2. `judge_assignments`: thêm `group_id UUID NULL`.
3. Drop unique constraint cũ `(round_id, judge_user_id, track_id)`; tạo lại theo BR-JA-08 (null tính là 1 phần phạm vi, chỉ tính assignment tồn tại — Phase 2 chưa có cột `active`, sẽ thêm ở Phase 3, nên unique index áp dụng cho toàn bộ row):
   ```sql
   CREATE UNIQUE INDEX uq_judge_assignment_scope
   ON judge_assignments (
     judge_user_id, round_id,
     COALESCE(track_id, '00000000-0000-0000-0000-000000000000'),
     COALESCE(group_id, '00000000-0000-0000-0000-000000000000')
   );
   ```
4. Tạo bảng `competition_groups`.
5. `teams`: thêm `group_id UUID NULL`.

## 3. Backend — validate hierarchy (BR-JA-04, 06, 07)
Trong `JudgeAssignmentService.assignJudge`, thay `resolveTrackIdForAssignment` (dựa vào `RoundType`) bằng validate theo `scope` tường minh do FE gửi lên:
- `scope=GROUP` mà không có `trackId` → 400 "Phải chọn Track trước khi chọn Group".
- Có `trackId` → `track.eventId == round.hackathonEvent.id`, nếu không → 400.
- Có `groupId` → `group.trackId == trackId đã chọn`, nếu không → 400.
- Giữ tương thích ngược: nếu Round là FINAL, không cho `scope=TRACK`/`GROUP` (đúng ý nghĩa hiện tại của `RoundType.FINAL` — xác nhận với business xem FINAL có được phép chia Track/Group không, nếu có thì bỏ ràng buộc này).

## 4. Backend — chống trùng & chồng chéo (BR-JA-08, 09, 10)
Thay `isDuplicate` (Phase 1, chỉ check theo trackId) bằng logic đầy đủ, xét theo TẤT CẢ assignment cùng judge + cùng round (Phase 2 chưa có `active`, nên xét toàn bộ row hiện có — sẽ thu hẹp lại còn "active" ở Phase 3):
- Có `ROUND` → chặn thêm bất kỳ gì khác trong round này.
- Thêm `ROUND` mà đã có `TRACK`/`GROUP` → chặn, yêu cầu gỡ trước.
- Thêm `TRACK` trùng track đang có → chặn trùng; đã có `GROUP` con thuộc track đó → chặn chồng chéo.
- Thêm `GROUP` trùng group đang có → chặn trùng; đã có `TRACK` bao trùm group đó → chặn chồng chéo.
Message lỗi rõ ràng cho từng trường hợp (xem bảng chi tiết ở file full-spec mục 3.7).

## 5. Backend — mở rộng visibility (JudgingService)
- `isJudgeAssignedToRoundScope` (Phase 1) → đổi tên/mở rộng thành `isJudgeAssignedToSubmissionScope(judgeUserId, submissionId, roundId)`: resolve team → `(trackId, groupId)`, match theo `scope=ROUND` hoặc (`scope=TRACK` và trackId khớp) hoặc (`scope=GROUP` và groupId khớp).
- `getMyScoringAssignments`: expand theo 3 nhánh (ROUND→toàn bộ team event; TRACK→team theo trackId; GROUP→team theo groupId) thay vì chỉ 2 nhánh của Phase 1.

## 6. Frontend
- CRUD Group: trang quản lý Track cần thêm phần "Competition Groups" (tạo/sửa/xoá group trong 1 track) — có thể là section nhỏ trong trang quản lý Track hiện có, không cần trang riêng.
- Gán team vào group: thêm ở trang quản lý Team (PATCH endpoint mới `/teams/{teamId}/group`).
- Form assign judge (`judge-assignments-page.tsx`): thêm radio Scope (Toàn Round / Track / Group); Group dropdown chỉ hiện khi đã chọn Track, chỉ liệt kê group thuộc track đó.
- Bảng phân công: thêm cột Group.

## 7. Việc cần làm khi xong
- Build backend + frontend PASS.
- JUnit: trùng lặp cả 3 cấp, chồng chéo cả 2 chiều (rộng→hẹp, hẹp→rộng) giữa ROUND/TRACK/GROUP, group sai track/event bị chặn.
- Test thủ công: event có Track A với Group A1/A2 — gán judge vào Group A1 → chỉ thấy team A1; gán thêm judge khác vào cả Track A → bị chặn (đã có Group con); gỡ assignment Group A1 trước thì gán Track A mới được.
