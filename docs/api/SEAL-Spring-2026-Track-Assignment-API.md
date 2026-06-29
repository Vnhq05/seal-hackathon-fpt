# SEAL Spring 2026 — Track / Group Assignment API

> Ref: `File_nghiệp_vụ_lệch.md` **§4**  
> Base URL: `/api` · Auth: Bearer JWT  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) · [`SEAL-Spring-2026-API-Reference.md`](./SEAL-Spring-2026-API-Reference.md)

---

## 1. Enums

### TrackAssignmentMethod

| Value | Mô tả | Khi nào dùng |
|---|---|---|
| `SELF_DRAW` | Đội trưởng tự chọn bảng trong phiên bốc thăm | SEAL Day 1 — `POST .../teams/{teamId}/track/draw` |
| `MANUAL` | BTC gán tay từng đội | GENERIC hoặc fallback |
| `RANDOM` | BTC random gán hàng loạt | GENERIC — `POST .../tracks/draw` |

### TrackStatus

| Value | Mô tả |
|---|---|
| `OPEN` | Bảng đang nhận đội / cho phép gán topic |
| `LOCKED` | Khóa sau Day 1 — không đổi bảng, không đổi topic |

### DrawSessionStatus

| Value | Mô tả |
|---|---|
| `OPEN` | Phiên bốc thăm đang diễn ra |
| `CLOSED` | Hết lượt hoặc BTC gọi `/tracks/lock` |

---

## 2. Business rules (SEAL_RAG_2026)

```text
1 Event → tối đa 3 Tracks (Bảng A / B / C)
1 Track = 1 group (bảng thi)
1 Track → max 8 teams
Topic = null khi tạo event → OC gán sau khi đội chọn bảng xong
```

**Day 1 flow (14:00–17:00, BTC mở phiên thủ công):**

```text
1. POST /tracks/draw-session/open          — BTC mở phiên
2. GET  /tracks/draw-session (poll)        — đội theo dõi lượt
3. POST /teams/{teamId}/track/draw           — trưởng đội chọn bảng (SELF_DRAW)
4. PUT  /tracks/{trackId}/topic (×3)       — OC bốc thăm topic từng bảng
5. POST /tracks/lock                       — khóa tất cả bảng
```

**GENERIC format:** dùng `PUT /teams/{teamId}/track` (leader tự chọn) hoặc `POST /tracks/assign` / `POST /tracks/draw`.

**SEAL format:** `PUT /teams/{teamId}/track` bị chặn (403). Phải qua draw session.

---

## 3. Modified endpoints — TrackResponse

Các endpoint sau trả về `TrackResponse` với các field **mới** so với GENERIC:

| Field | Type | Notes |
|---|---|---|
| `topic` | string \| null | `null` lúc seed; OC gán sau draw |
| `status` | `OPEN` \| `LOCKED` | Default `OPEN` |
| `assignedTeamCount` | number | Số đội hiện tại trong bảng |

### 3.1 GET `/api/events/{eventId}/tracks`

**Auth:** Authenticated  
**Request:** None

**Response 200:**

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Bảng A",
      "description": null,
      "topic": null,
      "maxTeams": 8,
      "scoringTemplateId": null,
      "status": "OPEN",
      "assignedTeamCount": 2
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "eventId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Bảng B",
      "description": null,
      "topic": "Domain-Specific RAG for Healthcare",
      "maxTeams": 8,
      "scoringTemplateId": null,
      "status": "LOCKED",
      "assignedTeamCount": 5
    }
  ]
}
```

### 3.2 GET `/api/events/{eventId}/tracks/{trackId}`

**Auth:** Authenticated  
**Request:** None

**Response 200:** Một object `TrackResponse` (cùng shape như phần tử trong list ở trên).

**Errors:** `404` — Track không tồn tại hoặc không thuộc event.

---

## 4. New endpoints — SEAL draw session

### 4.1 POST `/api/events/{eventId}/tracks/draw-session/open`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
**Format:** `SEAL_RAG_2026` only

**Purpose:** BTC mở phiên bốc thăm; xếp hàng các đội chưa có bảng.

**Request body:**

```json
{
  "scheduledAt": "2026-04-11T14:00:00",
  "drawOrder": ["team-uuid-1", "team-uuid-2", "team-uuid-3"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `scheduledAt` | ISO datetime | No | Thời điểm dự kiến (lưu metadata, không enforce API) |
| `drawOrder` | UUID[] | No | Mặc định: thứ tự tạo team (`createdAt` ASC) |

**Response 200:**

```json
{
  "success": true,
  "message": "Track draw session opened",
  "data": {
    "sessionId": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "OPEN",
    "currentTeamId": "team-uuid-1",
    "currentTeamName": "Team Alpha",
    "currentIndex": 0,
    "totalTeams": 12,
    "scheduledAt": "2026-04-11T14:00:00",
    "openedAt": "2026-04-11T14:00:05",
    "availableTracks": [
      {
        "trackId": "track-uuid-a",
        "name": "Bảng A",
        "status": "OPEN",
        "remainingSlots": 8
      },
      {
        "trackId": "track-uuid-b",
        "name": "Bảng B",
        "status": "OPEN",
        "remainingSlots": 8
      },
      {
        "trackId": "track-uuid-c",
        "name": "Bảng C",
        "status": "OPEN",
        "remainingSlots": 8
      }
    ]
  }
}
```

**Errors:**

| HTTP | Message (ví dụ) |
|---|---|
| `409` | A track draw session is already open |
| `400` | All teams already have tracks assigned |
| `400` | Team {id} is not eligible for draw |
| `403` | Không phải SEAL format / không đủ quyền |

---

### 4.2 GET `/api/events/{eventId}/tracks/draw-session`

**Auth:** Authenticated  
**Request:** None

**Purpose:** Poll trạng thái phiên — coordinator và student dùng chung endpoint.

**Response 200:** Cùng shape `data` như `open` (xem §4.1).

**Errors:**

| HTTP | Message |
|---|---|
| `404` | Chưa có session nào được tạo cho event |

---

### 4.3 POST `/api/events/{eventId}/teams/{teamId}/track/draw`

**Auth:** Team leader (JWT user = leader của `teamId`)  
**Format:** `SEAL_RAG_2026` · Session phải `OPEN` · Đúng lượt trong queue

**Request body:**

```json
{
  "trackId": "track-uuid-c"
}
```

| Field | Type | Required |
|---|---|---|
| `trackId` | UUID | Yes |

**Response 200:**

```json
{
  "success": true,
  "message": "Track selected via draw",
  "data": {
    "teamId": "team-uuid-1",
    "trackId": "track-uuid-c",
    "trackName": "Bảng C",
    "method": "SELF_DRAW"
  }
}
```

**Side effects:**

- Gán `team.trackId`, `trackAssignmentMethod = SELF_DRAW`
- Tăng `currentIndex` trong session
- Khi hết queue → session `status = CLOSED` tự động

**Errors:**

| HTTP | Message (ví dụ) |
|---|---|
| `403` | Only the team leader can draw a track |
| `403` | It is not this team's turn to draw |
| `409` | Team already has a track assigned |
| `409` | Track 'Bảng A' is full (max 8 teams) |
| `409` | Track 'Bảng A' is locked |
| `400` | Track draw session is not open |
| `400` | Track draw session is complete |

---

### 4.4 PUT `/api/events/{eventId}/tracks/{trackId}/topic`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Purpose:** OC gán / bốc thăm topic cho bảng sau khi đội đã chọn bảng.

**Request body:**

```json
{
  "topic": "Domain-Specific RAG for Healthcare"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `topic` | string | Yes | Not blank, max 1000 chars |

**Response 200:**

```json
{
  "success": true,
  "message": "Track topic assigned",
  "data": {
    "id": "track-uuid-a",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bảng A",
    "description": null,
    "topic": "Domain-Specific RAG for Healthcare",
    "maxTeams": 8,
    "scoringTemplateId": null,
    "status": "OPEN",
    "assignedTeamCount": 6
  }
}
```

**Errors:**

| HTTP | Message |
|---|---|
| `409` | Track is locked |
| `400` | Validation (topic trống) |
| `404` | Track not found |

---

### 4.5 POST `/api/events/{eventId}/tracks/lock`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
**Format:** `SEAL_RAG_2026` only  
**Request:** None

**Purpose:** Khóa tất cả bảng sau Day 1 — không đổi bảng / topic nữa.

**Response 200:**

```json
{
  "success": true,
  "message": "All tracks locked",
  "data": {
    "lockedTrackCount": 3
  }
}
```

**Side effects:**

- Tất cả tracks → `status = LOCKED`
- Session đang `OPEN` → `CLOSED`

---

## 5. Blocked endpoint (SEAL)

### PUT `/api/events/{eventId}/teams/{teamId}/track`

**Auth:** Team leader  
**GENERIC:** Cho phép leader chọn bảng trực tiếp.

**Request body (GENERIC):**

```json
{
  "trackId": "track-uuid-a"
}
```

**Error 403 (SEAL_RAG_2026):**

```json
{
  "success": false,
  "message": "Track assignment for SEAL events is managed by coordinators. Contact BTC.",
  "data": null
}
```

---

## 6. Existing endpoints (GENERIC / fallback)

### 6.1 POST `/api/events/{eventId}/tracks/assign`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
**Method:** `MANUAL`

**Request body:**

```json
{
  "assignments": [
    { "teamId": "team-uuid-1", "trackId": "track-uuid-a" },
    { "teamId": "team-uuid-2", "trackId": "track-uuid-b" }
  ]
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Tracks assigned",
  "data": [
    {
      "teamId": "team-uuid-1",
      "trackId": "track-uuid-a",
      "trackName": "Bảng A",
      "method": "MANUAL"
    }
  ]
}
```

---

### 6.2 POST `/api/events/{eventId}/tracks/draw`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
**Method:** `RANDOM` (shuffle + round-robin vào bảng còn slot)

**Request body (optional, ignored):**

```json
{
  "method": "RANDOM"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Track draw completed",
  "data": {
    "assignments": [
      {
        "teamId": "team-uuid-1",
        "trackId": "track-uuid-b",
        "trackName": "Bảng B",
        "method": "RANDOM"
      }
    ],
    "unassignedCount": 0
  }
}
```

---

## 7. Frontend mapping

| Endpoint | Client method | UI |
|---|---|---|
| `GET /events/{id}/tracks` | `trackApi.list()` | Coordinator tracks, student draw page |
| `PUT /tracks/{id}/topic` | `trackApi.assignTopic()` | `/coordinator/tracks` |
| `POST /tracks/draw-session/open` | `trackAssignmentApi.openDrawSession()` | `/coordinator/tracks` |
| `GET /tracks/draw-session` | `trackAssignmentApi.getDrawSession()` | Coordinator + `/student/tracks/draw` |
| `POST /teams/{id}/track/draw` | `teamApi.selfDrawTrack()` | `/student/tracks/draw` |
| `POST /tracks/lock` | `trackAssignmentApi.lockTracks()` | `/coordinator/tracks` |
| `POST /tracks/draw` | `trackAssignmentApi.draw()` | Coordinator — GENERIC panel |
| `PUT /teams/{id}/track` | `teamApi.selectTrack()` | Team detail — **blocked SEAL** |

**TypeScript types:**

- `frontend/src/lib/api/track.api.ts` — `TrackResponse`, `AssignTrackTopicRequest`
- `frontend/src/lib/api/track-assignment.api.ts` — draw session, lock, MANUAL/RANDOM
- `frontend/src/lib/api/team.api.ts` — `selfDrawTrack()`, `selectTrack()`

---

## 8. Flow checklist

```text
□ Event tạo với competitionFormat = SEAL_RAG_2026 (3 tracks seed sẵn)
□ Đội đăng ký xong (CLOSED_REGISTRATION khuyến nghị trước Day 1)
□ BTC: POST /tracks/draw-session/open
□ Student poll GET /tracks/draw-session mỗi ~3s
□ Trưởng đội (đúng lượt): POST /teams/{teamId}/track/draw
□ Lặp đến hết queue → session CLOSED
□ BTC: PUT /tracks/{trackId}/topic cho từng bảng
□ BTC: POST /tracks/lock
□ Verify GET /tracks → status = LOCKED, topic đã gán
```

---

## 9. Database (migration)

Bảng/cột liên quan trong `backend/src/main/resources/db/seal_spring_2026_migration.sql`:

| Object | Mô tả |
|---|---|
| `tracks.status` | `OPEN` / `LOCKED` |
| `track_draw_sessions` | Một session / event |
| `track_draw_queue` | Thứ tự bốc thăm |
| `teams.track_assignment_method` | `RANDOM` / `MANUAL` / `SELF_DRAW` |

---

## 10. Tests

Integration tests: `backend/src/test/java/com/sealhackathon/event/controller/TrackDrawSessionIntegrationTest.java`

Covers: full flow open → self-draw → topic → lock, 409 duplicate session, 403 wrong turn / not leader, 403 SEAL selectTrack block.
