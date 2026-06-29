# SEAL Spring 2026 — Schedule & Milestones API

> Ref: `File_nghiệp_vụ_lệch.md` **§8**  
> Base URL: `/api` · Auth: Bearer JWT (authenticated endpoint)  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) · [`SEAL-Spring-2026-Submission-API.md`](./SEAL-Spring-2026-Submission-API.md)

---

## 1. Enums

### ScheduleType

| Value | Business meaning |
|---|---|
| `WORKSHOP` | Buổi workshop trước ngày thi |
| `OPENING` | Khai mạc, bốc thăm bảng, setup |
| `TRACK_DRAW` | Đội tự chọn bảng theo lượt |
| `MILESTONE` | Mốc nộp bài trong ngày thi (Milestone 1 & 2) |
| `SCORING` | Chấm vòng bảng (preliminary) |
| `FINAL` | Chung kết Top 6 |
| `CEREMONY` | Trao giải & bế mạc |

### ScheduleGate

| Value | Business meaning | Enforced by |
|---|---|---|
| `SLIDE_SUBMISSION` | Cổng nộp slide — đóng lúc 10:00 | `round.slideDeadline` |
| `DEMO_SUBMISSION` | Cổng nộp demo đầy đủ — đóng lúc 14:00 | `round.submissionDeadline` |

> `EventSchedule.gate` là **metadata hiển thị** trên timeline. Logic khóa submit thực tế dùng deadline trên `RoundResponse`, không đọc trực tiếp từ schedule.

---

## 2. Business timeline (SEAL Spring 2026)

Schedule được **seed tự động** khi tạo event `competitionFormat = SEAL_RAG_2026` qua `SealSpring2026Template.buildSchedules()`.

### Day 1 — Ngày trước competition (`startDate - 1`)

| Phase | Time | ScheduleType |
|---|---|---|
| Khai mạc & bốc thăm bảng | 14:00–17:00 | `OPENING` |
| Bốc thăm chọn bảng | 14:00–16:00 | `TRACK_DRAW` |

### Day 2 — Ngày thi (`startDate`)

| Phase | Time | Gate |
|---|---|---|
| Milestone 1: Hoàn thiện ý tưởng & kiến trúc | 07:00–10:00 | `SLIDE_SUBMISSION` |
| Milestone 2: Pitching & hoàn thiện sản phẩm | 10:00–14:00 | `DEMO_SUBMISSION` |
| Chấm vòng bảng | 14:00–15:30 | — |
| Chung kết Top 6 | 15:30–17:00 | — |
| Trao giải & bế mạc | 17:00–18:00 | — |

Workshop được đặt ~15 ngày sau `registrationDeadline` (`ScheduleType.WORKSHOP`).

---

## 3. Endpoints

> **Read-only.** Không có POST/PUT/PATCH/DELETE cho schedule. Không có request body.

### 3.1 GET `/api/events/{eventId}/schedule`

**Auth:** Authenticated (Bearer JWT)

**Path params:**

| Param | Type | Required |
|---|---|---|
| `eventId` | UUID | Yes |

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "WORKSHOP",
      "title": "Workshop",
      "description": null,
      "startTime": "2026-04-09T09:00:00",
      "endTime": "2026-04-09T12:00:00",
      "gate": null,
      "sortOrder": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "OPENING",
      "title": "Khai mạc & bốc thăm bảng",
      "description": "Đội tự chọn bảng theo lượt; BTC bốc thăm topic cho từng bảng",
      "startTime": "2026-04-11T14:00:00",
      "endTime": "2026-04-11T17:00:00",
      "gate": null,
      "sortOrder": 1
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "TRACK_DRAW",
      "title": "Bốc thăm chọn bảng",
      "description": null,
      "startTime": "2026-04-11T14:00:00",
      "endTime": "2026-04-11T16:00:00",
      "gate": null,
      "sortOrder": 2
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "MILESTONE",
      "title": "Milestone 1 — Hoàn thiện ý tưởng & kiến trúc",
      "description": "Thiết kế Agentic RAG architecture",
      "startTime": "2026-04-12T07:00:00",
      "endTime": "2026-04-12T10:00:00",
      "gate": "SLIDE_SUBMISSION",
      "sortOrder": 3
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "MILESTONE",
      "title": "Milestone 2 — Pitching & hoàn thiện sản phẩm",
      "description": "Pitching song song với coding",
      "startTime": "2026-04-12T10:00:00",
      "endTime": "2026-04-12T14:00:00",
      "gate": "DEMO_SUBMISSION",
      "sortOrder": 4
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "SCORING",
      "title": "Chấm vòng bảng",
      "description": "5 phút thuyết trình + 3 phút Q&A",
      "startTime": "2026-04-12T14:00:00",
      "endTime": "2026-04-12T15:30:00",
      "gate": null,
      "sortOrder": 5
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "FINAL",
      "title": "Chung kết",
      "description": "7 phút thuyết trình + 3 phút Q&A — Top 6 đội",
      "startTime": "2026-04-12T15:30:00",
      "endTime": "2026-04-12T17:00:00",
      "gate": null,
      "sortOrder": 6
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "CEREMONY",
      "title": "Trao giải & bế mạc",
      "description": null,
      "startTime": "2026-04-12T17:00:00",
      "endTime": "2026-04-12T18:00:00",
      "gate": null,
      "sortOrder": 7
    }
  ]
}
```

**Response fields (`EventScheduleResponse`):**

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | UUID | No | Schedule item ID |
| `eventId` | UUID | No | Parent event |
| `type` | `ScheduleType` | No | Phase category |
| `title` | string | No | Display title |
| `description` | string | Yes | Optional detail |
| `startTime` | datetime | No | ISO local datetime (`LocalDateTime`) |
| `endTime` | datetime | No | ISO local datetime |
| `gate` | `ScheduleGate` | Yes | Submission gate metadata (milestones only) |
| `sortOrder` | integer | No | Display order (asc) |

**Errors:**

| Status | Condition |
|---|---|
| `404` | Event not found |

---

### 3.2 GET `/api/public/events/{eventId}/schedule`

**Auth:** None (public)

**Path params:** Same as §3.1

**Request body:** None

**Response 200:** Same shape as §3.1

**Business rules:**

- Event phải **publicly visible** (`assertPubliclyVisible`)
- Trả về cùng dữ liệu schedule như endpoint authenticated

**Errors:**

| Status | Condition |
|---|---|
| `404` | Event not found or not publicly visible |

---

## 4. Quan hệ với Round deadlines

Milestone gates trên UI được **cross-reference** với round preliminary:

| ScheduleGate | Round field | SEAL default |
|---|---|---|
| `SLIDE_SUBMISSION` | `slideDeadline` | `2026-04-12T10:00:00` |
| `DEMO_SUBMISSION` | `submissionDeadline` | `2026-04-12T14:00:00` |

Submission enforcement (backend):

```text
07:00–10:00  → chỉ nộp slideUrl        (slideDeadline)
10:00–14:00  → nộp đầy đủ source/slide/demo (submissionDeadline)
sau 14:00    → khóa submit preliminary
```

Chi tiết: [`SEAL-Spring-2026-Submission-API.md`](./SEAL-Spring-2026-Submission-API.md)

---

## 5. Frontend mapping

| Backend | Frontend API | UI consumers |
|---|---|---|
| `GET /events/{id}/schedule` | `scheduleApi.list(eventId)` | Dashboard, Submissions, Event detail dialog |
| `GET /public/events/{id}/schedule` | `publicApi.getSchedule(eventId)` | Public landing page |
| — (client-side) | `scheduleApi.getById(eventId, scheduleId)` | Filter từ `list()` — không có REST endpoint riêng |
| — (deprecated) | `eventApi.getSchedule()` | Alias → `scheduleApi.list()` |

**Types** (`frontend/src/lib/api/schedule.api.ts`):

```typescript
export type ScheduleType =
  | "WORKSHOP" | "OPENING" | "TRACK_DRAW" | "MILESTONE"
  | "SCORING" | "FINAL" | "CEREMONY";

export type ScheduleGate = "SLIDE_SUBMISSION" | "DEMO_SUBMISSION";

export interface EventScheduleResponse {
  id: string;
  eventId: string;
  type: ScheduleType;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  gate: ScheduleGate | null;
  sortOrder: number;
}
```

**Hook:** `useEventSchedule(eventId)` — React Query key `["event-schedule", eventId]`

**Components:**

| Component | Location | Purpose |
|---|---|---|
| `EventScheduleTimeline` | `features/events/components/` | Shared timeline (compact / full) |
| Dashboard card | `/student` | Milestone status + countdown |
| Submission page | `/student/submissions` | Full Milestone 1 & 2 timeline |

---

## 6. Endpoint summary

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/api/events/{eventId}/schedule` | Bearer | — | `ApiResponse<EventScheduleResponse[]>` |
| GET | `/api/public/events/{eventId}/schedule` | Public | — | `ApiResponse<EventScheduleResponse[]>` |

No write endpoints. Schedule data is seeded at event creation for `SEAL_RAG_2026` format only.
