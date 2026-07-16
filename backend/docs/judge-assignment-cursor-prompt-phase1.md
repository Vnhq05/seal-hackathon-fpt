> **SUPERSEDED — tư liệu lịch sử, không còn hiệu lực.**
> Mô hình "`trackId` nullable, suy phạm vi từ `RoundType`" mô tả ở đây đã được Phase 2 thay bằng
> `AssignmentScope { ROUND, TRACK, GROUP }` — xem `judge-assignment-cursor-prompt-phase2.md`.
> Luật hiện hành: **`trackId` phụ thuộc `scope`, không phụ thuộc `RoundType`.** PRELIMINARY +
> `scope=ROUND` (judge chấm toàn vòng loại) là hợp lệ; chỉ FINAL mới bắt buộc ROUND scope.
> Mục 0 dưới đây nói "KHÔNG thêm `scope` enum / `CompetitionGroup` / `active` flag" — cả ba
> đều đã tồn tại trong code từ Phase 2/3. Đừng dùng file này làm căn cứ luật.

# TASK (Phase 1): Judge chấm theo Round/Track — bỏ gán thủ công từng Team

## Mục tiêu Phase 1 (tối thiểu, không làm Group/audit/notification/deactivate ở bước này)
Judge được assign vào một **Round** (toàn round, FINAL) hoặc **Round + Track** (PRELIMINARY) →
tự động có quyền xem/chấm **mọi Team** trong phạm vi đó. Bỏ hẳn bước gán cứng "đúng 3 giám khảo/team".

## 0. Tận dụng nguyên trạng — KHÔNG tạo entity/migration mới
- `event.domain.JudgeAssignment(roundId, trackId nullable)` đã đủ biểu diễn phạm vi:
  PRELIMINARY → `trackId` bắt buộc (chấm 1 Track); FINAL → `trackId = null` (chấm toàn Round).
  Giữ nguyên, KHÔNG thêm `scope` enum, KHÔNG thêm `CompetitionGroup`, KHÔNG thêm `active` flag ở Phase 1.
- `JudgeAssignmentService.isJudgeAssignedToRoundScope(roundId, judgeUserId, teamTrackId)` (đã có, event/service/JudgeAssignmentService.java:120) — dùng trực tiếp, không viết lại.
- `JudgeAssignmentService.getEligibleJudgeUserIds(roundId, trackId)` (đã có, dòng 134) — dùng để hiển thị pool judge theo track ở FE, không cần method mới.
- Route FE hiện tại (xác nhận đúng, giữ nguyên): `/admin/assignments` và `/coordinator/assignments`, component `frontend/src/features/admin/components/judge-assignments-page.tsx` (`JudgeAssignmentsPage`).

## 1. Backend — sửa `JudgingService` (thay `TeamJudgeAssignment` gate bằng round/track scope)

File: `backend/src/main/java/com/sealhackathon/judging/service/JudgingService.java`
- Dòng 87 (`submitScore`) và dòng 210 (`getScoresBySubmission`, role LECTURER): thay điều kiện `isJudgeAssignedToTeam(judgeId, submissionId, roundId)` bằng gọi `judgeAssignmentService.isJudgeAssignedToRoundScope(roundId, judgeId, team.getTrackId())` (resolve `team` từ `submission.getTeamId()` như code cũ đang làm ở dòng 292).
- `getMyScoringAssignments(judgeId)` (dòng 190): hiện đang lấy từ `teamJudgeAssignmentRepository.findByJudgeUserId(judgeId)` — đổi sang:
  1. Lấy tất cả `JudgeAssignment` của judge (`judgeAssignmentRepository.findByJudgeUserId` — thêm method nếu chưa có).
  2. Với mỗi assignment: nếu `trackId == null` → lấy toàn bộ Team của Event (qua Round→Event); nếu có `trackId` → lấy Team theo `trackId`.
  3. Union danh sách Team theo `roundId` của assignment, loại trùng theo teamId, build `JudgeScoringAssignmentResponse` cho từng team (giữ nguyên field `mentorConflict` — logic COI dùng lại `TeamPublicService.isMentorOfTeam`, xem mục 2 để mở rộng).
- KHÔNG xoá bảng/entity `TeamJudgeAssignment` — chỉ ngừng dùng nó để gate quyền. Giữ lại trong DB cho dữ liệu cũ, không insert mới.

## 2. Conflict of interest khi assign (mở rộng nhẹ, không cần entity mới)

Trong `JudgeAssignmentService.assignJudge(...)`, sau các check hiện có (LECTURER, roster, duplicate), thêm:
- Xác định tập Team trong phạm vi: `trackId == null` → toàn bộ team của event; `trackId != null` → team theo trackId (dùng repository query có sẵn kiểu `teamRepository.findByEventIdAndTrackId` — kiểm tra tên method thực tế trong `TeamRepository` trước khi gọi).
- Với mỗi team: reject (400/409) nếu `teamPublicService.isMentorOfTeam(judgeUserId, team.id)` là true.
- (Không cần check `MentorAssignment` pool-level ở Phase 1 — để Phase 2, vì ít gặp và cần thêm method mới bên module mentor).

## 3. Frontend — bỏ gán thủ công từng Team

Trong `judge-assignments-page.tsx` và liên quan (`frontend/src/app/(admin)/admin/assignments/team-judges/page.tsx` nếu route này chỉ phục vụ gán-cứng-3-judge/team):
- Xoá/ẩn `AssignJudgesModal` (yêu cầu chọn đúng 3 giám khảo/team) khỏi luồng thao tác — không xoá code nếu còn dùng chỗ khác, nhưng ngừng gọi trong trang assignment chính.
- Giữ nguyên `JudgePoolSection` (chọn Judge + Round + Track) — đây chính là form Phase 1 cần, không cần sửa nhiều.
- Bảng "Team overview": đổi cột "Judge (x/3)" thành danh sách judge suy ra từ pool đang active cho track của team đó (đọc qua `getEligibleJudgeUserIds` hoặc endpoint tương đương) — chỉ hiển thị read-only, không cho sửa trực tiếp ở bảng này.
- Không cần thêm UI Group (chưa có ở Phase 1).

## 4. Min 2 judge/track (hiển thị cảnh báo, KHÔNG hard-block ở Phase 1)

- Ở bảng phân công theo Track/Round: đếm số judge duy nhất trong `getEligibleJudgeUserIds(roundId, trackId)`. Nếu `< 2` → hiển thị badge cảnh báo "Chưa đủ giám khảo (tối thiểu 2)". Không chặn hành động nào khác ở Phase 1 (không có action "mở Scoring chính thức" bị gate — để Phase 2 nếu cần).
- Không thêm field `minJudgesPerRound` vào entity `Round` ở Phase 1 — hardcode ngưỡng 2 ở tầng service/FE, dễ đổi thành config sau.

## 5. KHÔNG làm ở Phase 1 (để Phase 2, đã có sẵn trong `judge-assignment-cursor-prompt.md` full spec)
- `CompetitionGroup`, `team.groupId`, scope `GROUP`.
- `active`/`deactivate`/`replace judge` endpoints.
- Audit Log đầy đủ theo BR-JA-25 (có thể thêm 1-2 dòng `AuditService.log(...)` tối thiểu ở chỗ tạo/xoá assignment nếu rảnh, nhưng không bắt buộc).
- Notification khi assign/thay đổi.
- Workload preview API riêng.
- Chặn thao tác sau khi Result Published (BR-JA-20) — nên thêm sớm ở Phase 1.5 vì rủi ro dữ liệu nếu bỏ qua, nhưng không phải yêu cầu cứng của Phase 1 này.

## 6. Bắt buộc khi xong Phase 1
- Build backend + frontend (`tsc --noEmit`, lint) — PASS.
- JUnit: `isJudgeAssignedToRoundScope` gate đúng cho PRELIMINARY (theo track) và FINAL (toàn round); `getMyScoringAssignments` trả đúng team theo scope; conflict-of-interest reject khi judge là mentor của team trong phạm vi.
- Test thủ công: 1 event có Track A/B, gán judge X vào Track A → X chỉ thấy/chấm được team thuộc Track A, không thấy team Track B; gán judge Y vào FINAL round (trackId=null) → Y thấy toàn bộ finalist.
