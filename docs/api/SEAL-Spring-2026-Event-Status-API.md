# SEAL Spring 2026 — Event Status API

> Ref: `File_nghiệp_vụ_lệch.md` **§3**  
> Base URL: `/api` · Auth: Bearer JWT  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md)

---

## 1. EventStatus enum

| Value | Business phase | Notes |
|---|---|---|
| `UPCOMING` | Before event / pre-registration | Date-based when `registrationOpenDate` is in the future |
| `OPEN` | Registration open | Team creation, member invitations allowed |
| `CLOSED_REGISTRATION` | Registration locked | **Sticky override** — blocks member changes |
| `ACTIVE` | Competition day | Submissions allowed (when dates align) |
| `SCORING` | Judging phase | **Sticky override** — judge scoring allowed |
| `COMPLETED` | Event finished | Results published |
| `CANCELLED` | Cancelled | Terminal — use `/cancel`, not PATCH status |

---

## 2. Transition matrix

```text
UPCOMING → OPEN | CLOSED_REGISTRATION
OPEN → CLOSED_REGISTRATION | ACTIVE
CLOSED_REGISTRATION → ACTIVE
ACTIVE → SCORING | COMPLETED
SCORING → COMPLETED
```

`CANCELLED` and `COMPLETED` have no outbound transitions. Use `POST /events/{id}/cancel` for cancellation.

Validation uses **resolved (effective) status** (`resolveStatus`), not raw persisted status alone. Sticky states `CLOSED_REGISTRATION` and `SCORING` are always returned as-is.

---

## 3. Resolved vs persisted status

| Mechanism | Behavior |
|---|---|
| **Date-based resolution** | `UPCOMING` / `OPEN` / `ACTIVE` / `COMPLETED` derived from `registrationOpenDate`, `startDate`, `endDate` |
| **Sticky overrides** | Persisted `CLOSED_REGISTRATION` or `SCORING` always wins in API responses |
| **PATCH `/status`** | Writes **persisted** status; response `status` field shows **resolved** value |

Example: persisted `ACTIVE` before `startDate` → API shows `OPEN`; transition validation follows `OPEN` rules (cannot jump to `SCORING`).

---

## 4. Permission matrix

| Resolved status | Allowed actions |
|---|---|
| `UPCOMING`, `OPEN` | Create teams, invite/join members |
| `CLOSED_REGISTRATION` | No team/member changes (persisted sticky) |
| `ACTIVE` | Submit round deliverables |
| `SCORING` | Judge scoring |
| `SCORING`, `COMPLETED` | View published results (when enabled) |

Enforced via `FormatRuleEngine.assertCanCreateTeam()` and `assertCanModifyTeamMembers()` in team/invitation/join flows.

---

## 5. Endpoints

### 5.1 PATCH `/api/events/{eventId}/status`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR` (owner for coordinators)

**Purpose:** Manual phase transition for SEAL competition flow.

**Request body:**

```json
{
  "status": "CLOSED_REGISTRATION"
}
```

| Field | Type | Required | Values |
|---|---|---|---|
| `status` | string | Yes | Any `EventStatus` except `CANCELLED` |

**Response 200:**

```json
{
  "success": true,
  "message": "Event status updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "SEAL Hackathon Spring 2026",
    "season": "Spring",
    "year": 2026,
    "startDate": "2026-04-12",
    "endDate": "2026-04-12",
    "registrationDeadline": "2026-04-10",
    "registrationOpenDate": "2026-03-01",
    "status": "CLOSED_REGISTRATION",
    "description": "Annual SEAL RAG hackathon",
    "location": "FPT University",
    "format": "Hybrid",
    "competitionFormat": "SEAL_RAG_2026",
    "minTeam": 3,
    "maxTeam": 24,
    "semesterMin": 1,
    "semesterMax": 8,
    "scoringTemplateId": "660e8400-e29b-41d4-a716-446655440001",
    "tiebreakerCriteria": "HIGHEST_INDIVIDUAL_CRITERION",
    "roundCount": 2,
    "mentorCount": 6,
    "trackCount": 3,
    "tracks": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "eventId": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Bảng A",
        "description": null,
        "topic": null,
        "maxTeams": 8,
        "status": "OPEN",
        "scoringTemplateId": null,
        "assignedTeamCount": 0
      }
    ],
    "prizes": [],
    "honoredGuests": [],
    "createdAt": "2026-03-01T08:00:00"
  }
}
```

**Errors:**

| Code | Condition |
|---|---|
| `400` | Invalid transition (e.g. `UPCOMING → SCORING`) |
| `400` | Target is `CANCELLED` — use `/cancel` |
| `400` | Event already `CANCELLED` |
| `403` | Coordinator does not own the event |
| `404` | Event not found |

---

### 5.2 POST `/api/events/{eventId}/cancel`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request body:** none

**Response 200:**

```json
{
  "success": true,
  "message": "Event cancelled",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "SEAL Hackathon Spring 2026",
    "status": "CANCELLED",
    "season": "Spring",
    "year": 2026,
    "startDate": "2026-04-12",
    "endDate": "2026-04-12",
    "registrationDeadline": "2026-04-10",
    "registrationOpenDate": "2026-03-01",
    "competitionFormat": "SEAL_RAG_2026",
    "roundCount": 2,
    "mentorCount": 6,
    "trackCount": 3,
    "tracks": [],
    "prizes": [],
    "honoredGuests": [],
    "createdAt": "2026-03-01T08:00:00"
  }
}
```

**Errors:**

| Code | Condition |
|---|---|
| `400` | Event already `COMPLETED` |
| `403` | Not event owner |
| `404` | Event not found |

---

### 5.3 POST `/api/events/{eventId}/activate`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Purpose:** Validate publish readiness and audit; does **not** force a persisted status change. Response `status` reflects date-based resolution.

**Request body:** none

**Response 200:**

```json
{
  "success": true,
  "message": "Event activated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "SEAL Hackathon Spring 2026",
    "status": "OPEN",
    "season": "Spring",
    "year": 2026,
    "startDate": "2026-04-12",
    "endDate": "2026-04-12",
    "registrationDeadline": "2026-04-10",
    "registrationOpenDate": "2026-03-01",
    "competitionFormat": "SEAL_RAG_2026",
    "roundCount": 2,
    "mentorCount": 6,
    "trackCount": 3,
    "tracks": [],
    "prizes": [],
    "honoredGuests": [],
    "createdAt": "2026-03-01T08:00:00"
  }
}
```

**Errors:**

| Code | Condition |
|---|---|
| `400` | Event is `CANCELLED` or fails publish validation (missing tracks/rounds) |
| `403` | Not event owner |
| `404` | Event not found |

---

### 5.4 GET `/api/events/{eventId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`, and other roles per existing security config

**Purpose:** Read event details. Field `status` is the **resolved** effective phase.

**Request body:** none

**Response 200:** Same `EventResponse` shape as PATCH status (see §5.1).

---

## 6. SEAL end-to-end touchpoints

```text
POST /events (SEAL_RAG_2026)
  → Teams register (status OPEN)
  → PATCH /events/{id}/status → CLOSED_REGISTRATION
  → POST /tracks/draw-session/open
  → … track draw flow …
  → PATCH /events/{id}/status → ACTIVE
  → POST /rounds/{id}/submissions
  → PATCH /events/{id}/status → SCORING
  → Judges score
  → PATCH /events/{id}/status → COMPLETED
```

---

## 7. Frontend integration

| Artifact | Location |
|---|---|
| Type | `EventStatus` in `frontend/src/lib/api/types.ts` |
| Request type | `UpdateEventStatusRequest` in `frontend/src/lib/api/event.api.ts` |
| API client | `eventApi.updateStatus(eventId, { status })` |
| React hook | `useUpdateEventStatus()` in `use-admin-hackathons.ts` |
| Transition helper | `allowedNextStatuses()` in `event-status.utils.ts` |
| UI | `EventPhasePanel` on `/coordinator/tracks` and `/admin/hackathons/[id]` |

**Example:**

```typescript
import { eventApi } from "@/lib/api";
import { allowedNextStatuses } from "@/features/events/utils/event-status.utils";

const event = await eventApi.getById(eventId);
const next = allowedNextStatuses(event.status);
await eventApi.updateStatus(eventId, { status: "CLOSED_REGISTRATION" });
```

---

## 8. Backend implementation reference

| Component | File |
|---|---|
| Enum | `EventStatus.java` |
| Transition + resolve | `EventService.java` |
| Permission gates | `FormatRuleEngine.java` |
| Controller | `EventController.java` — `PATCH /{eventId}/status` |
| DTO | `UpdateEventStatusRequest.java` |
