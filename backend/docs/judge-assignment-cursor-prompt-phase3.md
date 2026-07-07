# TASK (Phase 3): Lifecycle — active/deactivate/replace, audit, khoá sau khi publish

Tiền đề: Phase 2 đã xong — `JudgeAssignment` có `scope` (ROUND/TRACK/GROUP) + `groupId`, validate hierarchy/trùng/chồng chéo đầy đủ.
Tham chiếu chi tiết BR gốc: `backend/docs/judge-assignment-cursor-prompt.md` (BR-JA-11–13, 16–20, 25).

## Mục tiêu Phase 3
Assignment không còn chỉ "tồn tại/bị xoá" mà có vòng đời: active ⇄ inactive, replace judge, và bị khoá cứng
sau khi Result publish. Mọi thay đổi được ghi Audit Log bằng `AuditService` có sẵn (không viết audit riêng).

## 1. Domain — thêm cột lifecycle vào `JudgeAssignment`
```java
@Column(name = "active", nullable = false)
@Builder.Default
private boolean active = true;

@Column(name = "deactivated_at")
private LocalDateTime deactivatedAt;

@Column(name = "deactivation_reason", length = 500)
private String deactivationReason;
```
Migration: `ALTER TABLE judge_assignments ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE`, `deactivated_at`, `deactivation_reason`.
Cập nhật lại unique index Phase 2 để chỉ tính assignment `active = TRUE` (thêm `WHERE active = TRUE`), vì giờ có thể có
lịch sử nhiều assignment inactive cho cùng scope.

**Quan trọng**: mọi query dùng cho visibility (`isJudgeAssignedToSubmissionScope`, `getMyScoringAssignments`) và validate
trùng/chồng chéo (Phase 2 mục 4) phải thêm điều kiện `active = true` — assignment bị deactivate không còn hiệu lực ngay lập tức (BR-JA-15).

## 2. Conflict of interest đầy đủ (BR-JA-11, 12)
Nâng cấp check ở Phase 1/2 (mới chỉ có `isMentorOfTeam`), thêm 2 điều kiện còn thiếu:
- Judge đang là Mentor của **toàn Track** chứa team — check thêm bảng `event.domain.MentorAssignment` (pool theo Track, khác với `MentorTeam` theo team): tồn tại active `MentorAssignment` của judgeUserId trên `trackId = team.trackId`.
- Judge là **thành viên** (`TeamMember`) của team đó — check `teamMemberRepository.existsByTeamIdAndUserId(teamId, judgeUserId)`.
Bất kỳ điều kiện nào đúng (kể cả 2 điều kiện Phase 1 đã có) → reject 409, **không override** (BR-JA-13 — không có cờ bỏ qua).

## 3. Gỡ / Deactivate / Replace (BR-JA-16, 17, 18)
- `DELETE /judges/{assignmentId}` — hard delete **chỉ khi** chưa có score nào trong phạm vi (mở rộng `judgeScoreRepository` check hiện có để lọc đúng theo scope ROUND/TRACK/GROUP thay vì chỉ theo round).
- `PATCH /judges/{assignmentId}/deactivate` body `{ reason }` (bắt buộc, 400 nếu thiếu) → `active=false`, `deactivatedAt=now()`, `deactivationReason=reason`. Dùng khi đã có score, không hard-delete được.
- `PATCH /judges/{assignmentId}/activate` — chạy lại toàn bộ validate Phase 2 mục 3+4 trước khi set `active=true` (đảm bảo không tái tạo trùng/chồng chéo/conflict tại thời điểm bật lại).
- `POST /judges/{assignmentId}/replace` body `{ newJudgeUserId, reason }`:
  1. Deactivate assignment cũ.
  2. Validate + tạo assignment mới cho `newJudgeUserId`, cùng scope/trackId/groupId.
  3. KHÔNG chuyển score cũ — `JudgeScore` của judge cũ giữ nguyên `judgeUserId`.
  4. Submission chưa chấm tự động thuộc judge mới (visibility tính động, không cần thao tác gì thêm).

## 4. Audit Log (BR-JA-25) — dùng `AuditService.log(actorId, action, targetId, targetType, oldValue, newValue, ipAddress)` có sẵn
Gọi ở mọi mutation:
- `JUDGE_ASSIGNMENT_CREATED`, `JUDGE_ASSIGNMENT_DEACTIVATED`, `JUDGE_ASSIGNMENT_ACTIVATED`, `JUDGE_ASSIGNMENT_DELETED`, `JUDGE_REPLACED`.
- `targetType = "JudgeAssignment"`, `targetId` = assignment id.
- `oldValue`/`newValue` = JSON string tối thiểu gồm `eventId, judgeUserId, roundId, trackId, groupId, scope, reason`.

## 5. Khoá sau khi Result Published (BR-JA-20)
- Xác nhận field/flag thực tế đánh dấu "Result đã publish" (tìm trong module `ranking` hoặc nơi implement PublishFlowPanel/AwardsPanel trước đây — grep `Publish` trong backend, đừng đoán tên).
- Thêm check đầu vào mọi endpoint mutate assignment (create/deactivate/activate/replace/delete): nếu round/event đã publish result → 409 "Không thể thay đổi phân công sau khi kết quả đã công bố."

## 6. Assign sau khi Scoring đã bắt đầu (BR-JA-19)
- Xác nhận field trên `Round` đại diện đúng "thời điểm bắt đầu chấm" (có thể là `startDate`, hoặc cần field riêng — kiểm tra cách `scoringDeadline` được dùng ở nơi khác để suy ra điểm bắt đầu tương ứng).
- Nếu `now()` nằm trong khoảng scoring của round tại thời điểm tạo assignment → vẫn cho tạo, nhưng ghi thêm Audit action `JUDGE_ASSIGNED_AFTER_SCORING_STARTED` và trả cảnh báo trong response.

## 7. Frontend
- Bảng phân công: Active/Inactive switch (gọi activate/deactivate, deactivate mở dialog nhập reason bắt buộc).
- Nút "Thay Judge" mở dialog chọn judge mới + reason, gọi `/replace`.
- Banner cảnh báo nếu tạo assignment sau khi scoring đã bắt đầu (hiển thị response warning từ mục 6).
- Chặn hoàn toàn form phân công (disable, không chỉ ẩn) nếu Result đã publish — kèm giải thích ngắn.

## 8. Việc cần làm khi xong
- Build backend + frontend PASS.
- JUnit: deactivate/activate/replace đúng flow; không hard-delete khi có score; conflict check bắt được cả 2 case mới (mentor-of-track qua MentorAssignment, team-member); khoá hoàn toàn sau publish; audit log ghi đủ field tối thiểu cho từng action.
- Test thủ công: tạo assignment, chấm 1 submission, thử xoá (phải bị chặn) → deactivate thành công (có reason) → activate lại → replace judge, xác nhận score cũ vẫn thuộc judge cũ và bài chưa chấm chuyển sang judge mới.
