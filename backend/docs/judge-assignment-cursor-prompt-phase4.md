# TASK (Phase 4): Vận hành & UX — workload, min-judges config, notification, hiển thị đầy đủ

Tiền đề: Phase 3 đã xong — assignment có vòng đời active/inactive/replace, audit log đầy đủ, khoá sau publish.
Tham chiếu chi tiết BR gốc: `backend/docs/judge-assignment-cursor-prompt.md` (BR-JA-21, 22, 23, 26, 28, 30).

## Mục tiêu Phase 4
Không thay đổi luật nghiệp vụ cốt lõi nữa — tập trung vào công cụ hỗ trợ Coordinator vận hành: xem trước khối
lượng, biết scope nào thiếu judge, nhận thông báo, và đồng bộ đúng khi Team đổi Group.

## 1. Min judges per scope — chuyển từ hardcode (Phase 1) sang cấu hình thật (BR-JA-22)
- Thêm field trên `Round`: `minJudgesPerRound` (int, `@Builder.Default = 2`), cho Coordinator sửa được ở form quản lý Round.
- Migration: `ALTER TABLE rounds ADD COLUMN min_judges_per_round INT NOT NULL DEFAULT 2`.
- Computed status runtime (không lưu DB) cho mỗi đơn vị chấm — đơn vị nhỏ nhất tồn tại: Group nếu có → Track nếu có → cả Round:
  đếm judge duy nhất có active assignment phủ đơn vị đó (ROUND scope tính vào mọi Track/Group trong round;
  TRACK scope tính vào mọi Group trong track đó). Count `< minJudgesPerRound` → đánh dấu `INCOMPLETE_ASSIGNMENT`.
- Nếu hệ thống có action "mở Scoring chính thức cho Round" (tìm trong `RoundService`/`EventService`, xác nhận tên method
  thực tế trước khi sửa) → chặn action đó nếu còn bất kỳ đơn vị nào `INCOMPLETE_ASSIGNMENT` (đúng ý BR-JA-22: "không được
  bắt đầu Scoring chính thức nếu quy định yêu cầu đủ Judge").

## 2. Workload preview (BR-JA-21)
- `GET /events/{eventId}/rounds/{roundId}/judges/preview-workload?scope=&trackId=&groupId=` — không lưu DB, trả số
  lượng team/submission dự kiến nằm trong phạm vi này (đếm team theo `trackId`/`groupId`/toàn event tuỳ scope, đếm
  submission tương ứng).
- FE: hiển thị số này ngay dưới dropdown Group/Track trong form assign, trước khi Coordinator bấm xác nhận — giúp
  tránh 1 judge bị quá tải, hoặc 1 group không có judge.

## 3. Notification (BR-JA-26) — dùng `NotificationService.createNotification(...)` có sẵn, không xây mới
- Thêm giá trị `NotificationType` mới nếu chưa có: `JUDGE_ASSIGNED`, `JUDGE_ASSIGNMENT_CHANGED`, `JUDGE_ASSIGNMENT_REMOVED`.
- Khi tạo assignment (Phase 1-3 flow): gửi cho judge — title/message gồm tên Event, Round, Track/Group (nếu có),
  `scoringDeadline`, số submission dự kiến (dùng lại logic mục 2).
- Khi deactivate/xoá/replace: gửi thông báo huỷ/thay đổi cho judge liên quan (cũ và/hoặc mới tuỳ action).

## 4. Đồng bộ khi Team đổi Group (BR-JA-30)
Trong `PATCH /teams/{teamId}/group` (đã có từ Phase 2):
- Vì visibility tính động (Phase 2-3), đổi `team.groupId` tự động cập nhật quyền — không cần thao tác thêm cho phần quyền.
- Sau khi đổi: tính lại coverage của Group mới (mục 1) — nếu `< minJudgesPerRound` → trả cảnh báo trong response để FE
  hiển thị banner cho Coordinator ngay sau khi đổi.
- Ghi Audit Log action `TEAM_GROUP_CHANGED` (targetType `"Team"`, oldValue/newValue chứa groupId cũ/mới) — dùng
  `AuditService.log(...)` như Phase 3.

## 5. Hiển thị đầy đủ (BR-JA-28) — hoàn thiện bảng phân công
Đảm bảo bảng ở `judge-assignments-page.tsx` có đủ các cột tối thiểu: Tên Judge, Email, Round, Track, Group, Trạng
thái (Active/Inactive), Số submission dự kiến (mục 2), Conflict status (nếu detect được, hiển thị badge cảnh báo),
Thời gian phân công. Badge `INCOMPLETE_ASSIGNMENT` (mục 1) hiển thị ở mức Track/Group tương ứng.

## 6. Việc cần làm khi xong
- Build backend + frontend PASS.
- JUnit: `minJudgesPerRound` tính đúng theo đơn vị nhỏ nhất tồn tại; preview-workload trả đúng số; đổi group tính
  lại coverage đúng và audit log ghi nhận.
- Test thủ công: event 2 Track, 1 Track chỉ có 1 judge → badge INCOMPLETE_ASSIGNMENT hiện đúng; thử action "mở
  Scoring chính thức" nếu có → bị chặn với thông báo rõ ràng; đổi 1 team sang Group khác → quyền chấm cập nhật
  ngay, banner cảnh báo hiện nếu Group mới thiếu judge.
