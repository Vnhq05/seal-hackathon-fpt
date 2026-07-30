# Prompt: Seed DB + test chức năng điểm lệch (Score Deviation)

> Copy toàn bộ phần **PROMPT** bên dưới sang chat AI khác. Prompt đã tự chứa đủ ngữ cảnh; AI không cần đọc repo cũ trừ khi bạn đính kèm thêm schema.

---

## PROMPT

```text
Bạn là kỹ sư full-stack / DBA cho hệ thống SEAL Hackathon (Spring Boot + SQL Server + React).

Mục tiêu:
1) Tạo / seed dữ liệu demo cho chức năng ĐIỂM LỆCH (Score Deviation / Score Review).
2) Viết hướng dẫn test thủ công từng role.
3) KHÔNG đổi công thức / threshold hiện có của hệ thống.

═══════════════════════════════════════
A. RÀNG BUỘC BẮT BUỘC (không được lệch)
═══════════════════════════════════════

- Thang điểm event: score_scale_max = 10
- Đúng 5 giám khảo (LECTURER), cùng chấm cả 2 team
- Đúng 2 team:
  • Team Deviation Alpha — điểm lệch
  • Team Consensus Beta — điểm bình thường
- Event status ban đầu: SCORING
- leaderboard_public = 0 (chưa public)
- KHÔNG insert published_results (để judge vẫn mở form Open scores)
- Judge scores status = COMPLETED (không LOCKED)
- Không gửi notification RESULTS_PUBLISHED / điểm lệch cho leader/member khi còn SCORING
- Có thể gửi notification staff (coordinator + 5 judges) kiểu Score Deviation Alert
- Password mọi account demo: 123456
  BCrypt hash (bcrypt cost 10):
  $2a$10$lF4mcUasaF9.x37HX.qwJeimAn2qUSZuTp47QbRL1ba9cRqaPMvgS

═══════════════════════════════════════
B. CÔNG THỨC ĐIỂM LỆCH (phải khớp BE)
═══════════════════════════════════════

- Với mỗi judge: tính weighted score trên các criteria (weight %), trong khoảng 0..score_scale_max
- percent = weighted / score_scale_max × 100
  (thang 10: điểm 10 → 100%, điểm 2 → 20%)
- deviation = max(percent) − min(percent)
- Threshold mặc định: 25 (%)
  • deviation ≥ 25 → tạo / giữ Score Review status OPEN (AUTO_DEVIATION)
  • deviation < 25 → KHÔNG tạo review
- Judge bị flagged khi gap so với max percent > 25
- Active review statuses chặn đóng event / publish results / hiện Results cho student:
  OPEN, APPROVED
- Closed: ADJUSTED, REJECTED, RESOLVED, IGNORED

Bộ điểm demo (weighted tổng / thang 10 — mỗi criterion cùng điểm, 4 criteria weight 25% mỗi cái):

Team Deviation Alpha (lệch):
  judge10 → 10, judge9 → 9, judge8 → 8, judge2 → 2, judge3 → 3
  → percent: 100, 90, 80, 20, 30
  → deviation = 80 (≥ 25) → score_review_requests.status = OPEN
  → ranking ~ 6.67, rank #2

Team Consensus Beta (bình thường):
  cùng 5 judge → 8, 8, 7, 8, 9
  → percent: 80, 80, 70, 80, 90
  → deviation = 20 (< 25) → KHÔNG có review
  → ranking = 8.00, rank #1

Với mỗi judge_score: insert judge_score_details cho đủ 4 criteria, mỗi ô = cùng giá trị điểm của judge đó (để weighted = điểm đó).

═══════════════════════════════════════
C. BẢNG / ĐỐI TƯỢNG CẦN CÓ (SQL Server)
═══════════════════════════════════════

Nếu DB đã migrate từ app SEAL thì dùng schema sẵn. Nếu bạn được yêu cầu TỰ TẠO bảng tối thiểu cho demo điểm lệch, tạo các bảng sau (UUID uniqueidentifier, audit created_at/created_by/updated_at/updated_by tùy schema app):

Bắt buộc cho flow điểm lệch:
1. users
   - id, email, password_hash, full_name, user_type, status
   - user_type: SYSTEM_ADMIN | EVENT_COORDINATOR | LECTURER | FPT_STUDENT | …
   - status: ACTIVE
2. hackathon_events
   - id, name, season, year, start_date, end_date, registration_deadline, status
   - leaderboard_public (bit, default 0)
   - score_scale_max (int = 10)
   - scoring_template_id (nullable FK), owner_user_id (coordinator)
   - competition_format, min_team, max_team
3. rounds
   - id, event_id, name, round_number, round_type (PRELIMINARY/FINAL)
   - round_weight, start_date, end_date, submission_deadline, scoring_deadline
   - min_judges_per_round (= 5), advancement_cutoff, advancement_rule
4. criteria (theo round)
   - id, round_id, name, weight, sort_order, min_score, max_score
   - Demo: 4 criteria Idea/Technical/UX/Pitch, weight 25 mỗi cái, min 0 max 10
5. event_enrollments (user tham gia event)
6. teams + team_members (LEADER / MEMBER)
7. event_judge_assignments (judge gắn event) + judge_assignments (judge gắn round, scope ROUND, active=1)
8. submissions + submission_versions
9. judge_scores
   - judge_user_id, submission_id, round_id, status (IN_PROGRESS|COMPLETED|LOCKED), started_at, completed_at, version
   - UNIQUE(judge_user_id, submission_id)
10. judge_score_details
   - judge_score_id, criteria_id, score (0..100), UNIQUE(judge_score_id, criteria_id)
11. score_review_requests  ★ trung tâm điểm lệch
   - id, event_id, round_id, team_id, submission_id
   - deviation_value, max_judge_score, min_judge_score
   - status: OPEN|APPROVED|ADJUSTED|REJECTED|RESOLVED|IGNORED
   - adjustment_type: AUTO_DEVIATION | JUDGE_REQUESTED
   - requested_by, request_note, approved_at, approved_by, resolved_at, resolved_by, resolution_note
   - UNIQUE(submission_id)
   - (nên có cột version BIGINT default 0 nếu app dùng optimistic lock)
12. rankings (optional cho demo thứ hạng)
   - round_id, team_id, final_score, rank, version, calculated_at
13. notifications + notification_recipients (optional; chỉ staff deviation alert)
14. published_results — TẠO BẢNG nếu schema cần, nhưng KHÔNG seed hàng cho round demo

Thứ tự insert gợi ý:
users → (scoring_templates nếu bắt buộc) → hackathon_events → rounds → criteria
→ enrollments → teams → team_members → judge assignments
→ submissions → submission_versions → judge_scores → judge_score_details
→ score_review_requests (chỉ Alpha) → rankings → notifications staff

Seed phải idempotent: DELETE theo event_id / fixed UUID trước khi INSERT lại.
Nhớ xóa judge_comments trước judge_scores nếu có FK.

═══════════════════════════════════════
D. ACCOUNT DEMO CẦN TẠO
═══════════════════════════════════════

| Email | Role | Ghi chú |
|-------|------|---------|
| admin@seal.demo | SYSTEM_ADMIN | |
| coordinator@seal.demo | EVENT_COORDINATOR | owner event |
| judge10@deviation.demo | LECTURER | Alpha=10, Beta=8 |
| judge9@deviation.demo | LECTURER | Alpha=9, Beta=8 |
| judge8@deviation.demo | LECTURER | Alpha=8, Beta=7 |
| judge2@deviation.demo | LECTURER | Alpha=2, Beta=8 |
| judge3@deviation.demo | LECTURER | Alpha=3, Beta=9 |
| leader.dev@deviation.demo | FPT_STUDENT | Leader Alpha |
| member.dev@deviation.demo | FPT_STUDENT | Member Alpha |
| leader.ok@deviation.demo | FPT_STUDENT | Leader Beta |
| member.ok@deviation.demo | FPT_STUDENT | Member Beta |

Event name gợi ý: "Demo Score Deviation Event"
Team names: "Team Deviation Alpha", "Team Consensus Beta"

score_review_requests cho Alpha:
- status = OPEN
- adjustment_type = AUTO_DEVIATION
- deviation_value = 80.00
- max_judge_score / min_judge_score = giá trị weighted max/min trên thang 10 (10 và 2)

═══════════════════════════════════════
E. RULE SẢN PHẨM LIÊN QUAN (để viết test đúng)
═══════════════════════════════════════

Results & Awards (leader/member) chỉ hiện khi ĐỦ 3 điều kiện:
1) Không còn score review OPEN/APPROVED (hội đồng đồng thuận)
2) Event sticky COMPLETED (admin hoặc coordinator đóng)
3) leaderboard_public = 1

Khi event COMPLETED:
- Judge vẫn xem lại bài đã chấm
- Judge KHÔNG được request điểm lệch (canRequestAdjustment = false)

Publish results / chuyển COMPLETED bị chặn nếu còn review OPEN/APPROVED.

Student KHÔNG được gọi API score-reviews (403) và không thấy judgeScores / judgeFullName trong payload.

═══════════════════════════════════════
F. VIỆC BẠN PHẢI GIAO
═══════════════════════════════════════

1) File SQL seed (SQL Server) idempotent, tự bootstrap admin/coordinator + toàn bộ graph trên.
2) Checklist test thủ công (tiếng Việt), theo từng role:

### 1. Coordinator / Admin — phát hiện lệch
- Login coordinator@seal.demo / 123456
- Vào Score Review / Variance
- Expect: chỉ Team Deviation Alpha (OPEN, deviation ~80%)
- Team Consensus Beta không xuất hiện trong review

### 2. Judge — xem điểm + deviation
- Login lần lượt judge10…judge3@deviation.demo / 123456
- Open scores: thấy cả 2 team đã COMPLETED
- View deviation trên Alpha: thấy peer breakdown; judge 2 và 3 flagged
- Beta: không có review / không cần request

### 3. Student — không lộ điểm sớm
- Login leader.dev / member.dev / leader.ok / member.ok
- Chuông: không có Results Published
- /student/results: thông báo chưa sẵn sàng (SCORING + review OPEN + chưa public)
- Không thấy breakdown giám khảo

### 4. Flow đóng cuộc + public (sau khi resolve review)
- Coord resolve/reject/ignore review Alpha → không còn OPEN/APPROVED
- Admin/Coord đặt event COMPLETED
- Bật leaderboard public
- Leader/member mới thấy Results & Awards
- Judge vẫn mở lại bài; không gửi được request lệch

### 5. Kiểm tra số học nhanh (SQL hoặc API)
- Alpha deviation = 80
- Beta deviation = 20
- Rankings: Beta #1 (8.00), Alpha #2 (~6.67)

3) Lệnh chạy seed gợi ý:
   sqlcmd -S localhost,1433 -U sa -P <password> -d SEAL -I -i <seed_file>.sql

4) Nếu schema app đã có sẵn: chỉ viết seed, không drop/create lại toàn DB.
   Nếu bạn được phép tạo schema tối thiểu từ zero: tạo bảng mục C rồi seed.

═══════════════════════════════════════
G. KHÔNG LÀM
═══════════════════════════════════════

- Không đổi threshold 25% hoặc công thức percent
- Không dùng thang 100 cho event demo này
- Không giảm còn <5 judges hoặc thêm team thứ 3 trong bộ demo chuẩn
- Không publish results / LOCKED scores trong seed ban đầu
- Không gửi RESULTS notification cho student trong seed SCORING
- Không hardcode secret production; chỉ dùng hash password demo ở trên

Bắt đầu bằng: (1) xác nhận schema hiện có hay cần CREATE TABLE, (2) xuất file SQL seed, (3) xuất checklist test.
```

---

## Gợi ý dùng prompt

| Tình huống | Cách dùng |
|------------|-----------|
| DB đã Flyway migrate SEAL | Paste PROMPT + nói “chỉ viết seed, schema đã có” |
| DB trống / AI tự tạo bảng | Paste PROMPT nguyên văn |
| Có sẵn seed trong repo | Đính kèm thêm `seed_score_deviation_demo.sql` làm reference |

Reference trong repo chính thức:

- Seed: `backend/src/main/resources/db/archive/seed_score_deviation_demo.sql`
- Checklist ngắn: `backend/src/main/resources/db/archive/SCORE_DEVIATION_TEST.md`
