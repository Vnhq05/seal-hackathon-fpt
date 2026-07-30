# Test điểm lệch + trường hợp bình thường

Seed: `seed_score_deviation_demo.sql`  
**Password tất cả:** `123456`

## Dữ liệu

| Mục | Giá trị |
|-----|---------|
| Event | **Demo Score Deviation Event** (thang **10**, `SCORING`) |
| Team lệch | **Team Deviation Alpha** — điểm **10, 9, 8, 2, 3**, deviation **80%**, review **OPEN**, rank #2 (~6.67) |
| Team bình thường | **Team Consensus Beta** — điểm **8, 8, 7, 8, 9**, deviation **20%**, không review, rank #1 (8.00) |
| Judges | Đúng **5 giảng viên**, đều `COMPLETED` trên cả hai team |
| Thông báo thí sinh | **Không** — không gửi RESULTS / điểm lệch cho leader/member khi event còn SCORING |
| Leaderboard | `leaderboard_public = 0` — thí sinh chưa xem điểm live |
| Results & Awards | Chỉ hiện khi **đồng thuận** (không còn review OPEN/APPROVED) **và** event `COMPLETED` **và** `leaderboard_public = 1` |
| Judge sau khi đóng | Vẫn xem lại bài đã chấm; **không** gửi request điểm lệch (`canRequestAdjustment = false`) |
| Thông báo staff | Deviation alert → coordinator + judges |

Seed tự tạo admin/coordinator, không phụ thuộc `unify_admin_coordinator.sql`.

## Test leader/member

1. `leader.dev@deviation.demo` / `member.dev@deviation.demo` → chuông **không** có Results Published
2. `leader.ok@deviation.demo` / `member.ok@deviation.demo` → tương tự
3. `/student/results` **không** hiện điểm khi còn SCORING / review OPEN / chưa public
4. Sau khi resolve review → admin/coord `COMPLETED` → bật public → leader/member mới thấy Results & Awards
5. Các tài khoản student gọi `/api/events/{eventId}/score-reviews/**` phải nhận **403**
6. Không payload student nào chứa `judgeScores` hoặc `judgeFullName`

## Admin/Coordinator xem điểm lệch

- `admin@seal.demo` → `/admin/analytics/variance`
- `coordinator@seal.demo` → `/coordinator/score-reviews`
- Chỉ Team Deviation Alpha xuất hiện trong Score Review

## Account

| Email | Vai trò |
|-------|---------|
| `admin@seal.demo` | System Admin |
| `coordinator@seal.demo` | Score Review |
| `leader.dev@deviation.demo` | Leader team lệch |
| `member.dev@deviation.demo` | Member team lệch |
| `leader.ok@deviation.demo` | Leader team bình thường |
| `member.ok@deviation.demo` | Member team bình thường |
| `judge10@deviation.demo` | Chấm 10 |
| `judge9@deviation.demo` | Chấm 9 |
| `judge8@deviation.demo` | Chấm 8 |
| `judge2@deviation.demo` | Chấm 2 |
| `judge3@deviation.demo` | Chấm 3 |

Các tên judge phản ánh điểm của Team Deviation Alpha; cùng 5 account chấm Team Consensus Beta theo bộ 8/8/7/8/9.

## Judge xem lại điểm

Mỗi judge vào `/lecturer/scoring`, mở từng team để xem dữ liệu `COMPLETED` đã chấm. Khi mở “View deviation”, judge được xem peer breakdown theo thiết kế hiện tại.

Sau khi event `COMPLETED`: judge **vẫn** mở lại bài đã chấm; nút/request điểm lệch bị tắt (`canRequestAdjustment = false`).

## Công thức lệch (sau fix)

- `percent = điểm / score_scale_max × 100` (thang 10 → 10 = 100%)
- `deviation = max% − min%` → demo **80%** (không còn ×20 → 160)
- Team Alpha: judge **flagged** khi gap so với max **> 25%** (3, 2); 9 và 8 không cảnh báo
- Team Beta: max 90%, min 70%, deviation 20% → không tạo review
- Cohen's d so với cụm số đông (gần max) — hiển thị trên UI / API

## Reset

```bash
sqlcmd -S localhost,1433 -U sa -P 12345 -d SEAL -I -i backend/src/main/resources/db/archive/seed_score_deviation_demo.sql
```
