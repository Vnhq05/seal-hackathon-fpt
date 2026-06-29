# SEAL Spring 2026 — Preliminary & Final Rounds API

> Ref: `File_nghiệp_vụ_lệch.md` **§5**  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) · [`SEAL-Spring-2026-Event-Status-API.md`](./SEAL-Spring-2026-Event-Status-API.md)

---

## 1. Enums

### RoundType

| Value | Mô tả |
|---|---|
| `PRELIMINARY` | Vòng bảng (14:00–15:30) — judges chấm demo + sản phẩm |
| `FINAL` | Chung kết (15:30–17:00) — chỉ finalist được nộp bài |

> **SEAL:** `roundType` bắt buộc khi tạo/sửa round cho event `SEAL_RAG_2026`.

### AdvancementRule

| Value | Mô tả | SEAL usage |
|---|---|---|
| `GLOBAL_TOP_N` | Top N toàn event | Generic events |
| `PER_TRACK_TOP_N` | Top N **trong từng bảng** | Preliminary: Top 2/bảng |
| `FINALIST_POOL` | Không advance — hiển thị pool size | Final: 6 đội chung kết |
| `NONE` | Không có advancement | — |

### FinalistSelectionMethod

| Value | Mô tả |
|---|---|
| `TOP_PER_TRACK` | Chọn theo Top-N trong bảng |
| `OVERFLOW_FILL` | Bổ sung slot để đủ 6 đội |
| `PENALTY_PENDING` | Chờ OC penalty evaluation |

### ContestedSlotType

| Value | Mô tả |
|---|---|
| `PER_TRACK_CUTOFF` | Hòa điểm tại vị trí Top-N trong bảng |
| `OVERFLOW_FILL` | Hòa điểm khi bổ sung slot chung kết |

### ScheduleType (liên quan)

| Value | Thời gian SEAL | Mô tả |
|---|---|---|
| `SCORING` | 14:00–15:30 | Vòng bảng — **5 phút TT + 3 phút Q&A** |
| `FINAL` | 15:30–17:00 | Chung kết — **7 phút TT + 3 phút Q&A** |

---

## 2. RoundResponse — trường mới / cập nhật

### Semantics `advancementCutoff` (SEAL)

| Round | `roundType` | `advancementRule` | `advancementCutoff` | Ý nghĩa |
|---|---|---:|---|---|
| Vòng bảng | `PRELIMINARY` | `PER_TRACK_TOP_N` | `2` | Top **2 mỗi bảng** (không phải top 2 toàn event) |
| Chung kết | `FINAL` | `FINALIST_POOL` | `6` | **6 đội** vào chung kết (3 bảng × 2) |

### RoundResponse schema

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "roundNumber": 1,
  "name": "Vòng bảng",
  "startDate": "2026-04-12T07:00:00",
  "endDate": "2026-04-12T15:30:00",
  "submissionDeadline": "2026-04-12T14:00:00",
  "slideDeadline": "2026-04-12T10:00:00",
  "scoringDeadline": "2026-04-12T15:30:00",
  "advancementCutoff": 2,
  "roundWeight": 40,
  "roundType": "PRELIMINARY",
  "advancementRule": "PER_TRACK_TOP_N",
  "criteria": [],
  "judgeCount": 0
}
```

---

## 3. GET `/api/events/{eventId}/rounds`

**Auth:** Public via `/api/public/events/{eventId}/rounds` hoặc authenticated

**Response 200 — SEAL event (2 rounds):**

```json
{
  "success": true,
  "data": [
    {
      "roundNumber": 1,
      "name": "Vòng bảng",
      "roundType": "PRELIMINARY",
      "advancementRule": "PER_TRACK_TOP_N",
      "advancementCutoff": 2,
      "roundWeight": 40,
      "slideDeadline": "2026-04-12T10:00:00"
    },
    {
      "roundNumber": 2,
      "name": "Chung kết",
      "roundType": "FINAL",
      "advancementRule": "FINALIST_POOL",
      "advancementCutoff": 6,
      "roundWeight": 60
    }
  ]
}
```

---

## 4. GET `/api/events/{eventId}/schedule`

**Auth:** Authenticated coordinator/admin  
**Public:** `GET /api/public/events/{eventId}/schedule`

**Response 200 — SCORING + FINAL blocks:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "type": "SCORING",
      "title": "Chấm vòng bảng",
      "description": "5 phút thuyết trình + 3 phút Q&A",
      "startTime": "2026-04-12T14:00:00",
      "endTime": "2026-04-12T15:30:00",
      "gate": null,
      "sortOrder": 5
    },
    {
      "id": "uuid",
      "type": "FINAL",
      "title": "Chung kết",
      "description": "7 phút thuyết trình + 3 phút Q&A — Top 6 đội",
      "startTime": "2026-04-12T15:30:00",
      "endTime": "2026-04-12T17:00:00",
      "gate": null,
      "sortOrder": 6
    }
  ]
}
```

> Presentation times là **mô tả lịch trình**, không enforce timer runtime.

---

## 5. POST `/api/events/{eventId}/finalists/select`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request:** Không có body.

**Business rules:**
1. Event phải ở trạng thái `ACTIVE`, `SCORING`, hoặc `COMPLETED`
2. Phải có round `PRELIMINARY` và rankings đã tính
3. **SEAL:** Top 2/bảng → 6 đội; nếu thiếu slot → overflow fill theo điểm + submit sớm hơn
4. **Tie-break:** `finalScore` DESC → `submittedAt` ASC
5. Vẫn hòa sau submit time → `contestedSlots` + `penaltyEvaluationRequired: true` (OC xử lý offline)

**Response 200:**

```json
{
  "success": true,
  "message": "Finalists selected",
  "data": {
    "finalists": [
      {
        "id": "uuid",
        "eventId": "uuid",
        "teamId": "uuid",
        "teamName": "Team Alpha",
        "trackId": "uuid",
        "trackName": "Bảng A",
        "preliminaryRank": 1,
        "selectedReason": "Top 2 in track",
        "selectedAt": "2026-04-12T15:30:00",
        "selectionMethod": "TOP_PER_TRACK",
        "needsPenaltyEvaluation": false
      }
    ],
    "contestedSlots": [
      {
        "id": "uuid",
        "trackId": "uuid",
        "trackName": "Bảng B",
        "slotType": "PER_TRACK_CUTOFF",
        "slotIndex": 2,
        "needsPenaltyEvaluation": true,
        "teams": [
          {
            "teamId": "uuid",
            "teamName": "Team Beta",
            "finalScore": 85.5,
            "submittedAt": "2026-04-12T13:45:00"
          },
          {
            "teamId": "uuid",
            "teamName": "Team Gamma",
            "finalScore": 85.5,
            "submittedAt": "2026-04-12T13:45:00"
          }
        ]
      }
    ],
    "summary": {
      "selectedCount": 5,
      "targetCount": 6,
      "penaltyEvaluationRequired": true
    }
  }
}
```

**Errors:**

| Code | Message |
|---|---|
| `400` | No preliminary round found |
| `400` | Preliminary rankings not yet calculated |
| `400` | Finalist selection is only allowed when event is ACTIVE, SCORING, or COMPLETED |

---

## 6. GET `/api/events/{eventId}/finalists`

**Auth:** Authenticated (public read nếu policy cho phép)

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "trackId": "uuid",
      "trackName": "Bảng A",
      "preliminaryRank": 1,
      "selectedReason": "Top 2 in track",
      "selectedAt": "2026-04-12T15:30:00",
      "selectionMethod": "TOP_PER_TRACK",
      "needsPenaltyEvaluation": false
    }
  ]
}
```

---

## 7. GET `/api/events/{eventId}/finalists/contested` *(mới)*

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response 200:** Cùng schema `contestedSlots[]` như trong POST `/select`.

---

## 8. GET `/api/rounds/{roundId}/rankings/advancements`

**Behavior SEAL preliminary (`advancementRule = PER_TRACK_TOP_N`):**

- Nhóm rankings theo `trackId` của team
- Top `advancementCutoff` (2) **trong mỗi bảng** → `ADVANCED`
- Còn lại → `ELIMINATED`

**Behavior generic (`GLOBAL_TOP_N`):**

- Top N toàn event theo `rank`

**Response 200 (mẫu):**

```json
{
  "success": true,
  "data": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "roundId": "uuid",
      "status": "ADVANCED",
      "rank": 1,
      "finalScore": 92.5
    },
    {
      "teamId": "uuid",
      "teamName": "Team Beta",
      "status": "ELIMINATED",
      "rank": 3,
      "finalScore": 78.0
    }
  ]
}
```

---

## 9. Tie-break flow

```text
Preliminary rankings calculated
  → Group by track
  → Sort: finalScore DESC → submittedAt ASC
  → Top 2 per track (boundary-aware cut)
      → Tied after submit time? → contested slot + penalty flag
  → Count < 6? → overflow fill from remaining pool (same tie logic)
  → Persist finalists + contested slots
```

---

## 10. Frontend mapping

| Backend | Frontend |
|---|---|
| `RoundResponse.advancementRule` | `round.api.ts` → `AdvancementRule` |
| `formatAdvancementLabel()` | SEAL copy: "Top 2 mỗi bảng → 6 đội chung kết" |
| `POST /finalists/select` | `finalistApi.select()` → `FinalistSelectResultResponse` |
| `GET /finalists` | `finalistApi.list()` |
| `GET /finalists/contested` | `finalistApi.listContested()` |
| `GET /public/events/{id}/schedule` | `publicApi.getSchedule()` |

---

## 11. Modified vs new endpoints

| Method | Path | Status |
|---|---|---|
| GET | `/api/events/{eventId}/rounds` | **Modified** response (+ `advancementRule`) |
| GET | `/api/public/events/{eventId}/rounds` | **Modified** response |
| GET | `/api/public/events/{eventId}/schedule` | **New** public schedule |
| POST | `/api/events/{eventId}/finalists/select` | **Modified** wrapped response |
| GET | `/api/events/{eventId}/finalists` | **Modified** (+ `selectionMethod`, `needsPenaltyEvaluation`) |
| GET | `/api/events/{eventId}/finalists/contested` | **New** |
| GET | `/api/rounds/{roundId}/rankings/advancements` | **Modified** SEAL per-track logic |
