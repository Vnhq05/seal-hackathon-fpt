# TASK: Judge Assignment theo Round / Track / Competition Group (BR-JA-01 → BR-JA-30)

## 0. Hiện trạng đã xác minh trong repo (không suy đoán)
- 3 bảng judge rời rạc: `EventJudgeAssignment` (roster toàn event), `JudgeAssignment` (pool theo Round + trackId nullable), `TeamJudgeAssignment` (gán cứng theo team, bắt buộc 3 giám khảo/team — bảng này hiện quyết định quyền chấm thật sự).
- `CompetitionGroup` **chưa tồn tại** — phải tạo mới.
- `Round` (event.domain.Round) đã có sẵn: `startDate`, `endDate`, `submissionDeadline`, `scoringDeadline`, `slideDeadline`, `roundType` — không có `minJudgesPerGroup`, phải thêm.
- `Track` và `Round` đều chỉ tham chiếu `event_id`, không có bảng nối Round↔Track.
- `Team` có sẵn `trackId` (nullable), **chưa có `groupId`**.
- Mentor có 2 tầng y hệt cấu trúc Judge cũ: `event.domain.MentorAssignment` (pool theo Track, method liên quan cần thêm) và `team.domain.MentorTeam` (gán cứng theo team, có sẵn `TeamPublicService.isMentorOfTeam(userId, teamId)`).
- Đã có sẵn hạ tầng dùng lại, KHÔNG xây mới:
  - `audit.service.AuditService.log(actorId, action, targetId, targetType, oldValue, newValue, ipAddress)`.
  - `notification.service.NotificationService.createNotification(NotificationType, title, message, referenceId, referenceType, recipientUserIds)` — cần thêm giá trị enum `NotificationType` cho judge assignment nếu chưa có (VD `JUDGE_ASSIGNED`, `JUDGE_ASSIGNMENT_CHANGED`, `JUDGE_ASSIGNMENT_REMOVED`).
- `EventStatus` enum: UPCOMING, OPEN, CLOSED_REGISTRATION, ACTIVE, SCORING, COMPLETED, CANCELLED — **cần xác nhận cách hệ thống đánh dấu "Result đã Publish"** (theo memory dự án, tính năng Result Publication đã có `PublishFlowPanel`/`AwardsPanel` — tìm field/flag thực tế trong `ranking` hoặc `event` module trước khi code BR-JA-20, đừng đoán tên field).

## 1. Quyết định dung hoà mâu thuẫn trong BR gốc (áp dụng các rule dưới đây)
- Chồng chéo phạm vi (BR-JA-10) và conflict of interest (BR-JA-11..13): **cả hai đều reject cứng (409)**, không có chế độ "chỉ cảnh báo rồi vẫn lưu".
- "Override conflict" (nhắc tới ở BR-JA-25) **không làm ở phiên bản này** — luồng assign luôn reject khi có conflict, không có nút override. Chỉ chừa cột `reason`/action name trong Audit Log để tương lai mở rộng.
- Kiểm tra conflict "Mentor của Track" phải xét **cả `MentorTeam` lẫn `MentorAssignment`** (pool theo Track), không chỉ `isMentorOfTeam`.
- BR-JA-22 (đủ Judge tối thiểu) áp dụng theo đơn vị nhỏ nhất tồn tại: có Group → tính theo Group; không Group nhưng có Track → tính theo Track; không cả hai → tính theo toàn Round.
- Số Judge tối thiểu mặc định: **2** (cấu hình được qua field mới trên Round, tên gợi ý `minJudgesPerRound`).
- Mô hình 2 tầng cũ (pool + gán cứng theo team, đúng 3 giám khảo/team) bị **thay thế** bằng mô hình 1 tầng: phân công Round/Track/Group là nguồn DUY NHẤT cấp quyền xem & chấm bài (xem mục 6). Giữ bảng `TeamJudgeAssignment` lại cho lịch sử/audit, ngừng dùng để gate quyền.

## 2. Domain model mới

### 2.1 `CompetitionGroup` (entity mới, package `event.domain`)
```java
@Entity
@Table(name = "competition_groups", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"track_id", "name"})
})
public class CompetitionGroup extends BaseEntity {
    @Column(name = "track_id", nullable = false)
    private UUID trackId;

    @Column(name = "name", nullable = false)
    private String name;
}
```
- `Team` thêm `@Column(name = "group_id") private UUID groupId;` (nullable).
- CRUD Group: `POST/GET/DELETE /api/events/{eventId}/tracks/{trackId}/groups`.
- Gán team vào group: `PATCH /api/teams/{teamId}/group` `{ groupId }` (chỉ SYSTEM_ADMIN/EVENT_COORDINATOR). Khi đổi group, xem BR-JA-30 (mục 8).

### 2.2 Sửa `Round` — thêm cấu hình tối thiểu Judge
```java
@Column(name = "min_judges_per_round", nullable = false)
@Builder.Default
private Integer minJudgesPerRound = 2; // BR-JA-22, mặc định 2
```

### 2.3 Sửa `JudgeAssignment` (event.domain.JudgeAssignment)
```java
public enum AssignmentScope { ROUND, TRACK, GROUP } // BR-JA-04

@Enumerated(EnumType.STRING)
@Column(name = "scope", nullable = false)
private AssignmentScope scope;

@Column(name = "group_id")
private UUID groupId; // chỉ set khi scope = GROUP, BR-JA-06

@Column(name = "active", nullable = false)
@Builder.Default
private boolean active = true; // BR-JA-15

@Column(name = "deactivated_at")
private LocalDateTime deactivatedAt;

@Column(name = "deactivation_reason", length = 500)
private String deactivationReason; // BR-JA-17
```
Ràng buộc theo scope (validate ở service, không chỉ ở DB):
- `ROUND` → `trackId = null`, `groupId = null`.
- `TRACK` → `trackId` bắt buộc, `groupId = null`.
- `GROUP` → `trackId` bắt buộc, `groupId` bắt buộc.

### 2.4 Migration
1. `judge_assignments`: thêm cột `scope` (backfill: `trackId IS NULL → 'ROUND'`, ngược lại `'TRACK'`), `group_id`, `active DEFAULT TRUE`, `deactivated_at`, `deactivation_reason`.
2. Drop unique constraint cũ `(round_id, judge_user_id, track_id)`.
3. Tạo unique index đúng nghĩa BR-JA-08 ("null cũng tính là 1 phần phạm vi", chỉ tính assignment đang active):
   ```sql
   CREATE UNIQUE INDEX uq_judge_assignment_scope
   ON judge_assignments (
     judge_user_id, round_id,
     COALESCE(track_id, '00000000-0000-0000-0000-000000000000'),
     COALESCE(group_id, '00000000-0000-0000-0000-000000000000')
   )
   WHERE active = TRUE;
   ```
4. `rounds`: thêm `min_judges_per_round INT NOT NULL DEFAULT 2`.
5. Tạo bảng `competition_groups` theo entity ở 2.1.
6. `teams`: thêm `group_id UUID NULL`.

## 3. Quy trình validate khi tạo Judge Assignment (`JudgeAssignmentService.assignJudge`)

Thứ tự check, fail nhanh, message rõ ràng:

1. **BR-JA-01**: chỉ cho phép gọi API này sau khi Event tồn tại (đương nhiên vì route có `{eventId}`) — đảm bảo KHÔNG có logic phân công nào bị gọi từ luồng tạo Event (kiểm tra lại `event-publish.utils.ts` / wizard, xoá nếu còn sót).
2. **BR-JA-02**: `@PreAuthorize` chỉ SYSTEM_ADMIN hoặc EVENT_COORDINATOR **được phân quyền quản lý đúng event đó** (tái dùng pattern coordinator-scope check hiện có trong `AssignmentController`).
3. **BR-JA-03**: Judge phải có tài khoản Active, đúng loại tài khoản được phép làm Judge (hiện tại: `UserType.LECTURER`), không bị khoá/từ chối, và đã có mặt trong `EventJudgeAssignment` (roster) của event — dùng lại `EventJudgeService.isEventJudge`.
4. **BR-JA-05, 06**: `roundId` bắt buộc. Nếu có `groupId` mà không có `trackId` → 400 "Phải chọn Track trước khi chọn Group".
5. **BR-JA-07**: `round.hackathonEvent.id == eventId`; nếu có `trackId` → `track.eventId == eventId`; nếu có `groupId` → `group.trackId == trackId đã chọn` (và qua đó suy ra cùng event).
6. **BR-JA-08**: check trùng — tồn tại active assignment cùng `(judgeUserId, roundId, trackId, groupId)` → 409 (được unique index ở 2.4 bảo vệ ở DB level, nhưng vẫn check ở service để trả message rõ trước khi đụng DB constraint).
7. **BR-JA-09, 10**: check chồng chéo (chỉ xét active assignment cùng judge + cùng round):
   - Đã có active `ROUND` → chặn mọi request mới trong round này (kể cả TRACK/GROUP) → 409 "Giám khảo đã được phân công toàn bộ Round này".
   - Request mới là `ROUND` mà đã có active `TRACK`/`GROUP` trong round này → 409 "Đã có phân công hẹp hơn trong Round này, hãy gỡ trước khi gán toàn Round".
   - Request mới là `TRACK` mà đã có active `TRACK` cùng track → 409 trùng lặp; đã có active `GROUP` thuộc track đó → 409 "Có phân công Group con trong Track này, hãy gỡ trước".
   - Request mới là `GROUP` mà đã có active `GROUP` cùng group → 409 trùng lặp; đã có active `TRACK` bao trùm track chứa group đó → 409 "Giám khảo đã được phân công cả Track chứa Group này".
8. **BR-JA-11, 12, 13**: Conflict of interest — xác định tập Team trong phạm vi:
   - `GROUP` → `teamRepository.findByGroupId(groupId)`
   - `TRACK` → `teamRepository.findByTrackId(trackId)`
   - `ROUND` → toàn bộ team thuộc event của round (xác nhận với round có tách track hay không; nếu Round áp dụng toàn bộ track thì lấy hết team của event)
   Với mỗi team: reject nếu (a) `teamPublicService.isMentorOfTeam(judgeUserId, team.id)` **HOẶC** (b) tồn tại active `MentorAssignment` của judgeUserId trên `track_id = team.trackId` **HOẶC** (c) judgeUserId là thành viên (`TeamMember`) của team đó. Bất kỳ điều kiện nào đúng → 409 kèm tên team vi phạm, **không lưu, không có override**.
9. Sau khi qua hết check → `save()`, `active = true`, ghi Audit Log (mục 7), gửi Notification (mục 9).
10. **BR-JA-19**: nếu `now()` nằm trong khoảng chấm điểm của round (giữa `round.startDate` và `round.scoringDeadline` — xác nhận field chính xác đại diện "bắt đầu chấm" trước khi code, có thể cần thêm field riêng nếu `startDate` không đúng ngữ nghĩa) → vẫn cho phép tạo, nhưng ghi thêm Audit Log action riêng `JUDGE_ASSIGNED_AFTER_SCORING_STARTED` và trả về cảnh báo trong response để FE hiển thị banner cho Coordinator.
11. **BR-JA-20**: nếu Result của event/round đã Published → chặn tuyệt đối tạo/sửa/gỡ assignment, trả 409 "Không thể thay đổi phân công sau khi kết quả đã công bố. Vui lòng reopen Scoring/Result trước."

## 4. Gỡ / Vô hiệu hoá / Thay Judge

- **BR-JA-16, 17**: `DELETE /judges/{assignmentId}` — hard delete **chỉ khi** judge chưa submit bất kỳ score nào trong phạm vi assignment (mở rộng check hiện có `judgeScoreRepository` để lọc theo scope thực tế: ROUND/TRACK/GROUP). Nếu đã có score → **không hard-delete**, bắt buộc gọi API deactivate với `reason` bắt buộc (400 nếu thiếu reason).
- `PATCH /judges/{assignmentId}/deactivate` body `{ reason: string }` — set `active=false`, `deactivatedAt=now()`, `deactivationReason=reason`. Không xoá dữ liệu.
- `PATCH /judges/{assignmentId}/activate` — bật lại active (chỉ khi không vi phạm lại check BR-JA-08/09/10/11 tại thời điểm bật — chạy lại toàn bộ validate ở mục 3 trước khi set active=true).
- **BR-JA-18 (thay Judge)**: endpoint `POST /judges/{assignmentId}/replace` body `{ newJudgeUserId, reason }`:
  1. Deactivate assignment cũ (reason = "Replaced by {newJudgeUserId}: {reason}").
  2. Validate và tạo assignment mới cho `newJudgeUserId` với cùng scope (chạy lại toàn bộ mục 3).
  3. KHÔNG chuyển score cũ sang judge mới. Score đã submit vẫn gắn với judge cũ (không đổi `judgeUserId` trên các row `JudgeScore` đã có).
  4. Submission chưa được chấm sẽ tự động thuộc về judge mới (vì visibility tính động theo mục 6, không cần thao tác thủ công).
  5. Ghi Audit Log action `JUDGE_REPLACED`.

## 5. BR-JA-21 — Workload preview

Trước khi submit form tạo assignment, thêm endpoint preview (không lưu DB):
`GET /api/events/{eventId}/rounds/{roundId}/judges/preview-workload?scope=&trackId=&groupId=`
→ trả số lượng team/submission dự kiến sẽ thuộc phạm vi này, để Coordinator cân nhắc trước khi xác nhận (hiển thị ở FE ngay dưới dropdown Group/Track, mục 10).

## 6. BR-JA-14, 15, 24 — Quyền xem & chấm bài (thay thế cơ chế `TeamJudgeAssignment` cũ)

Trong `JudgingService`:
- Thay `isJudgeAssignedToTeam(...)` bằng `isJudgeAssignedToSubmissionScope(judgeUserId, submissionId, roundId)`:
  1. Resolve `submission → team (trackId, groupId)`.
  2. Query active `JudgeAssignment` của judge trong `roundId`.
  3. `true` nếu tồn tại row thoả: `scope=ROUND` HOẶC (`scope=TRACK AND trackId=team.trackId`) HOẶC (`scope=GROUP AND groupId=team.groupId`).
  4. Áp dụng gate này ở `submitScore`, `getScoresBySubmission` (role LECTURER).
- `getMyScoringAssignments(judgeId)`: với mỗi active assignment của judge, expand ra team tương ứng (ROUND→toàn bộ team event; TRACK→team theo trackId; GROUP→team theo groupId), UNION, loại trùng theo teamId. Giữ cờ `mentorConflict` phòng trường hợp team đổi track/group sau khi gán (mục 8).
- BR-JA-24: không có bất kỳ đường tắt nào cho phép `isEventJudge`/roster membership tự động cấp quyền xem toàn Event — chỉ query qua `JudgeAssignment` active.

## 7. BR-JA-25 — Audit Log (dùng `AuditService.log(...)` có sẵn, KHÔNG viết audit riêng)

Gọi ở mọi action: tạo/deactivate/activate/replace/gỡ, và assign-sau-khi-scoring-bắt-đầu.
- `actorId` = current user.
- `action` ∈ {`JUDGE_ASSIGNMENT_CREATED`, `JUDGE_ASSIGNMENT_DEACTIVATED`, `JUDGE_ASSIGNMENT_ACTIVATED`, `JUDGE_ASSIGNMENT_DELETED`, `JUDGE_REPLACED`, `JUDGE_ASSIGNED_AFTER_SCORING_STARTED`}.
- `targetId` = assignment id, `targetType` = `"JudgeAssignment"`.
- `oldValue`/`newValue` = JSON string chứa tối thiểu: `eventId, judgeUserId, roundId, trackId, groupId, scope, reason` (theo đúng field tối thiểu BR-JA-25 yêu cầu).

## 8. BR-JA-30 — Đồng bộ khi Team đổi Group

Trong endpoint `PATCH /teams/{teamId}/group`:
1. Vì quyền xem/chấm tính động theo mục 6 (không có bảng cache), việc đổi `team.groupId` **tự động** làm judge cũ (nếu scope GROUP không khớp group mới) mất quyền và judge mới (nếu có scope khớp group mới) có quyền — không cần thao tác gì thêm cho phần này.
2. Sau khi đổi, tính lại coverage của Group mới theo mục "BR-JA-22" (mục 9) — nếu Group mới có active-judge-count < `round.minJudgesPerRound` → trả cảnh báo trong response để FE hiển thị banner cho Coordinator.
3. Ghi Audit Log action `TEAM_GROUP_CHANGED` (targetType `"Team"`, oldValue/newValue chứa groupId cũ/mới).

## 9. BR-JA-22, 23 — Trạng thái đủ/thiếu Judge

- Thêm computed status (không lưu DB, tính runtime) cho mỗi đơn vị chấm (Group nếu có, else Track, else Round): đếm số **judge duy nhất** có active assignment phủ đơn vị đó (ROUND scope tính vào mọi Group/Track trong round; TRACK scope tính vào mọi Group trong track đó; GROUP scope tính đúng group).
- Nếu count < `round.minJudgesPerRound` → đánh dấu `INCOMPLETE_ASSIGNMENT` trong response overview (mục 10).
- Nếu có cờ cấu hình "yêu cầu đủ Judge mới cho bắt đầu Scoring chính thức" (kiểm tra xem hệ thống hiện có action "mở Scoring cho Round" ở đâu, có thể trong `RoundService`/`EventService`) → chặn action đó nếu còn bất kỳ Group/Track nào `INCOMPLETE_ASSIGNMENT`.
- BR-JA-23: một judge có thể có nhiều assignment (nhiều Group/Track/Round) miễn không vi phạm mục 3 — không giới hạn thêm gì khác trừ khi có cấu hình workload riêng (không bắt buộc ở v1, để mở rộng sau).

## 10. BR-JA-26, 27, 28, 29 — Notification & Frontend

**Notification** (dùng `NotificationService.createNotification`, thêm `NotificationType` mới nếu chưa có):
- Khi tạo assignment: gửi cho judge — title/message gồm tên Event, Round, Track/Group (nếu có), `scoringDeadline`, số submission dự kiến (dùng lại logic ở mục 5).
- Khi deactivate/xoá/replace: gửi thông báo huỷ/thay đổi cho judge liên quan.

**Trang quản lý** (BR-JA-27 — đã đúng route sẵn có, không sửa): `/admin/hackathons/{eventId}/assignments` — KHÔNG thêm logic này vào Event Creation Wizard.

**Form phân công** (thay `JudgePoolSection` trong `judge-assignments-page.tsx`):
1. Chọn Judge (dùng lại picker sẵn có).
2. Chọn Round.
3. Radio Scope: "Toàn bộ Round" / "Một Track" / "Một Competition Group".
4. Scope=Track hoặc Group → hiện dropdown Track (lọc theo Round→Event).
5. Scope=Group → bắt buộc đã có Track ở bước 4, dropdown Group chỉ liệt kê group thuộc Track đã chọn (`GET /tracks/{trackId}/groups`), disable nếu chưa chọn Track.
6. Hiển thị workload preview (mục 5) ngay dưới form trước khi submit.
7. Submit lỗi 400/409 → hiển thị message backend nguyên văn.

**Bảng phân công hiện tại** (BR-JA-28, tối thiểu các cột):
Tên Judge, Email, Round, Track, Group, Trạng thái (Active/Inactive — switch gọi activate/deactivate, deactivate yêu cầu nhập reason qua dialog), Số submission dự kiến, Conflict status (nếu có), Thời gian phân công. Nút "Gỡ" gọi DELETE, disable + tooltip lý do nếu đã có score.

Xoá `AssignJudgesModal` (bắt chọn đúng 3 giám khảo/team) và giới hạn 3-giám-khảo/team khỏi UI — thay bằng view read-only: mỗi team hiển thị danh sách judge suy ra từ scope đang active + badge `INCOMPLETE_ASSIGNMENT` nếu thiếu Judge tối thiểu (mục 9).

**BR-JA-29**: mọi nút Assign/Deactivate/Delete/Replace ở FE chỉ là UX — toàn bộ authorization phải enforce lại ở backend (`@PreAuthorize`), không được tin FE.

## 11. Việc cần làm khi code xong (bắt buộc)
- Build backend + frontend (`tsc --noEmit`, lint) — PASS.
- Test JUnit tối thiểu:
  - Trùng lặp ROUND/TRACK/GROUP (BR-JA-08).
  - Chồng chéo cả 2 chiều rộng→hẹp và hẹp→rộng (BR-JA-10).
  - Group không thuộc Track đã chọn / Track không thuộc Event (BR-JA-06, 07).
  - Conflict: mentor-của-team, mentor-của-track (qua `MentorAssignment`), thành-viên-team (BR-JA-11, 12).
  - Không hard-delete được khi đã có score; deactivate yêu cầu reason (BR-JA-16, 17).
  - Replace Judge: score cũ giữ nguyên chủ, submission chưa chấm chuyển sang judge mới (BR-JA-18).
  - Chặn mọi thao tác sau khi Result Published (BR-JA-20).
  - Đổi Team.groupId → quyền judge cập nhật tự động theo query động, không cần cache invalidation thủ công (BR-JA-30).
  - `getMyScoringAssignments` chỉ trả đúng phạm vi được gán (BR-JA-14, 24).
- Test thủ công trên browser: event có 2 Track, mỗi Track 2 Group, gán judge ở cả 3 mức scope, xác nhận dashboard judge lọc đúng, banner `INCOMPLETE_ASSIGNMENT` hiện đúng khi thiếu judge.
