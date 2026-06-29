# SEAL Spring 2026 — Mentor / Judge Assignment API (§9)

> Ref: `File_nghiệp_vụ_lệch.md` **§9**  
> Scope: Mentor per track, judge per round+track (preliminary) hoặc round-only (final), conflict rules

---

## Breaking changes

| Removed | Replacement |
|---------|-------------|
| `POST /api/events/{eventId}/mentors` | `POST /api/events/{eventId}/tracks/{trackId}/mentors` |
| `GET /api/events/{eventId}/mentors` | `GET /api/events/{eventId}/tracks/{trackId}/mentors` |
| `DELETE /api/events/{eventId}/mentors/{assignmentId}` | `DELETE /api/events/{eventId}/tracks/{trackId}/mentors/{assignmentId}` |

**Behavior changes:**
- `MentorAssignment.trackId` is **required** (NOT NULL).
- `JudgeAssignment` has optional `trackId` — required for `PRELIMINARY`, must be absent for `FINAL`.
- `GET /api/events/{eventId}/assignments` — `eligibleJudges` now comes from round+track judge pool, not event-wide pool.
- `GET .../mentor-invitations/available-mentors` requires `?trackId=`.
- Event create no longer auto-seeds mentors; assign per track via admin after tracks exist.
- Publish flow auto-assigns judges to **FINAL** rounds only; preliminary judges assign manually per track.

---

## 1. Mentor assignment (per track)

### POST `/api/events/{eventId}/tracks/{trackId}/mentors`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request:**
```json
{
  "mentorUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Mentor assigned to track",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trackId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trackName": "Software Engineering",
    "mentorUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "mentorFullName": "Dr. Nguyen Van A",
    "mentorEmail": "mentor@fpt.edu.vn",
    "assignedAt": "2026-06-29T10:00:00"
  }
}
```

**Errors:**
- `400` — user is not `LECTURER`, or track does not belong to event
- `409` — mentor already assigned to this track

---

### GET `/api/events/{eventId}/tracks/{trackId}/mentors`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "trackId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "trackName": "Software Engineering",
      "mentorUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "mentorFullName": "Dr. Nguyen Van A",
      "mentorEmail": "mentor@fpt.edu.vn",
      "assignedAt": "2026-06-29T10:00:00"
    }
  ]
}
```

---

### DELETE `/api/events/{eventId}/tracks/{trackId}/mentors/{assignmentId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response `200`:**
```json
{
  "success": true,
  "message": "Mentor assignment removed",
  "data": null
}
```

**Errors:**
- `404` — assignment not found or does not belong to the given track

---

## 2. Judge assignment (per round + track)

### POST `/api/events/{eventId}/rounds/{roundId}/judges`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Rules by `RoundType`:**
| Round type | `trackId` in body |
|------------|-------------------|
| `PRELIMINARY` | **Required** — judge scoped to one track |
| `FINAL` | **Must be omitted/null** — judge covers all finalists |

**Request (preliminary):**
```json
{
  "judgeUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "trackId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Request (final):**
```json
{
  "judgeUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Judge assigned to round",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trackId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trackName": "Software Engineering",
    "judgeUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "judgeFullName": "Dr. Tran Van B",
    "judgeEmail": "judge@fpt.edu.vn",
    "assignedAt": "2026-06-29T10:00:00"
  }
}
```

**Response `201` (final — `trackId` null):**
```json
{
  "success": true,
  "message": "Judge assigned to round",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "trackId": null,
    "trackName": null,
    "judgeUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "judgeFullName": "Dr. Tran Van B",
    "judgeEmail": "judge@fpt.edu.vn",
    "assignedAt": "2026-06-29T10:00:00"
  }
}
```

**Errors:**
- `400` — judge not in event pool, wrong `trackId` for round type, track not in event
- `409` — duplicate assignment for same (round, judge, track)

**Prerequisite:** Judge must exist in event pool (`EventJudgeAssignment`) via event create/wizard with role `JUDGE` or `BOTH`.

---

### GET `/api/events/{eventId}/rounds/{roundId}/judges`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Query params:**
| Param | Required when |
|-------|---------------|
| `trackId` | `RoundType = PRELIMINARY` |
| _(omit)_ | `RoundType = FINAL` |

**Example:** `GET /api/events/{eventId}/rounds/{roundId}/judges?trackId={trackId}`

**Response `200`:** array of `JudgeAssignmentResponse` (same shape as POST response `data`).

**Errors:**
- `400` — `trackId` missing for preliminary, or `trackId` provided for final

---

### DELETE `/api/events/{eventId}/rounds/{roundId}/judges/{assignmentId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response `200`:**
```json
{
  "success": true,
  "message": "Judge assignment removed",
  "data": null
}
```

**Errors:**
- `400` — judge has already submitted scores for this round

---

## 3. Modified: Available mentors for invitation

### GET `/api/events/{eventId}/mentor-invitations/available-mentors?trackId={trackId}`

**Auth:** Authenticated (team leader flow)

**Query:** `trackId` **required** — team's track.

**Response `200`:** array of `MentorAssignmentResponse` (mentors in that track's pool).

**Related validation on invite (`POST .../mentor-invitations`):**
- Team must have `trackId` assigned
- Mentor must be in the same track pool
- Mentor cannot be judge of the same team (conflict)

---

## 4. Modified: Team assignment overview

### GET `/api/events/{eventId}/assignments?roundId={roundId}&trackId={trackId?}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**`eligibleJudges` behavior (changed):**
- When `trackId` filter set → judges from `JudgeAssignment` for `(roundId, trackId)`
- When `trackId` omitted on preliminary → union of judges across tracks of visible teams
- When final round → judges with `trackId = null` for that round

**Team judge assign (`POST /api/assignments`) — added validation:**
- Each judge must be in round+track pool (`JudgeAssignment`)
- Judge must not mentor the team (BR-34, unchanged)

**Request (unchanged):**
```json
{
  "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "teamId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "judgeUserIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
```

**New error:**
- `400` — `"Judge is not assigned to this round and track"`

---

## 5. Conflict rules (unchanged, BR-34)

| Action | Rule |
|--------|------|
| Assign judge to team | Reject if judge mentors that team |
| Assign mentor to team | Reject if user is judge of that team |
| Submit score | Reject if judge mentors that team |
| Mentor assigned after judge | Auto-remove team-judge link if no scores yet |

Conflict is enforced at **team** level via `MentorTeam` + `TeamJudgeAssignment`, in addition to track-scoped pools above.

---

## 6. Unchanged endpoints (reference)

These endpoints are not modified but remain part of the assignment flow:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/assignments` | Bulk assign 3 judges to a team |
| DELETE | `/api/assignments/{assignmentId}` | Remove one team-judge link |
| POST | `/api/events/{eventId}/rounds/{roundId}/teams/{teamId}/judges` | Add one judge to team |
| POST | `/api/events/{eventId}/teams/mentor-team` | Admin assign mentor to team |
| POST | `/api/events/{eventId}/mentor-invitations` | Team leader invites mentor |

---

## Migration notes

SQL migration (`seal_spring_2026_migration.sql`):
- Deletes legacy `mentor_assignments` rows with `track_id IS NULL`
- Enforces `mentor_assignments.track_id NOT NULL`
- Adds `judge_assignments.track_id` (nullable)
- Unique: `(event_id, track_id, mentor_user_id)` and `(round_id, judge_user_id, track_id)`
- Filtered unique index for final judges: one row per `(round_id, judge_user_id)` where `track_id IS NULL`
