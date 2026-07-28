# Test điểm lệch + thông báo điểm

Seed: `seed_score_deviation_demo.sql`  
**Password tất cả:** `123456`

## Dữ liệu

| Mục | Giá trị |
|-----|---------|
| Event | **Demo Score Deviation Event** (thang **10**, `SCORING`) |
| Team | **Team Deviation Alpha** — 1 leader + 1 member |
| Judges LOCKED | **10, 9, 8, 2, 3** |
| Judge chưa chấm | `judge.pending@deviation.demo` (đã gán, không có `judge_scores`) |
| Ranking | Đã publish (~**6.67**, trim mean) |
| Score Review | **OPEN** (deviation **80%** — thang 10: 100%−20%) |
| Thông báo thí sinh | Results Published — **chỉ** điểm tổng / hạng (không liệt kê điểm judge) |
| Thông báo staff | Deviation alert → coordinator + judges |

## Test thông báo điểm

1. `leader.dev@deviation.demo` → chuông → **Results Published**
2. `member.dev@deviation.demo` → cùng thông báo

## Coordinator xem điểm lệch

`coordinator@seal.demo` → **Score Review**

## Account

| Email | Vai trò |
|-------|---------|
| `coordinator@seal.demo` | Score Review |
| `leader.dev@deviation.demo` | Leader — thông báo điểm |
| `member.dev@deviation.demo` | Member — thông báo điểm |
| `judge10@deviation.demo` | Chấm 10 |
| `judge9@deviation.demo` | Chấm 9 |
| `judge8@deviation.demo` | Chấm 8 |
| `judge2@deviation.demo` | Chấm 2 |
| `judge3@deviation.demo` | Chấm 3 |
| `judge.pending@deviation.demo` | Đã gán, **chưa chấm** |

## Công thức lệch (sau fix)

- `percent = điểm / score_scale_max × 100` (thang 10 → 10 = 100%)
- `deviation = max% − min%` → demo **80%** (không còn ×20 → 160)
- Judge **flagged** khi gap so với max **> 25%** (3, 2); 9 và 8 không cảnh báo
- **Cohen's d** so với cụm số đông (gần max) — hiển thị trên UI / API

## Reset

```bash
sqlcmd -S localhost,1433 -U sa -P 12345 -d SEAL -I -i backend/src/main/resources/db/archive/seed_score_deviation_demo.sql
```
