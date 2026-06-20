# API Reference

Base URL: `http://localhost:8080/api`
All responses wrapped in `{ "success": boolean, "message": string, "data": T }`

## Auth — `/api/auth` (Public)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/auth/register` | Register participant (FPT_STUDENT/EXTERNAL_STUDENT) | BR-01 |
| POST | `/auth/login` | Login → JWT + refresh token | BR-05,06 |
| POST | `/auth/refresh` | Refresh access token | BR-05 |
| POST | `/auth/logout` | Revoke refresh token | — |
| POST | `/auth/forgot-password` | Request reset link | BR-07 |
| POST | `/auth/reset-password` | Reset with one-time token | BR-07 |

## User Profile — `/api/users` (Authenticated)

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get my profile |
| PUT | `/users/me` | Update name, phone |
| PUT | `/users/me/password` | Change password |

## Admin Users — `/api/admin/users` (SYSTEM_ADMIN)

| Method | Path | Description | BR |
|---|---|---|---|
| GET | `/admin/users` | List users (filter: status, type, search) | — |
| GET | `/admin/users/pending` | List pending accounts | BR-01 |
| GET | `/admin/users/pending/count` | Count pending | BR-01 |
| GET | `/admin/users/{userId}` | Get user details | — |
| POST | `/admin/users/approve` | Approve or reject | BR-01 |
| POST | `/admin/users/internal` | Create internal account | BR-02 |

## Events — `/api/events` (ADMIN/COORDINATOR for writes)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/events` | Create event | BR-08 |
| PUT | `/events/{id}` | Update (blocked after Active) | BR-08 |
| POST | `/events/{id}/activate` | Draft → Active | BR-08 |
| POST | `/events/{id}/complete` | Active → Completed | — |
| POST | `/events/{id}/cancel` | Cancel event | — |
| GET | `/events/{id}` | Get event | — |
| GET | `/events` | List events (filter: status) | — |

## Rounds — `/api/events/{eventId}/rounds` (ADMIN/COORDINATOR for writes)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/events/{eid}/rounds` | Create round | BR-09 |
| GET | `/events/{eid}/rounds` | List rounds | — |
| GET | `/events/{eid}/rounds/{rid}` | Get round | — |
| PUT | `/events/{eid}/rounds/{rid}` | Update round | BR-09 |
| DELETE | `/events/{eid}/rounds/{rid}` | Delete round | — |
| POST | `/events/{eid}/rounds/{rid}/reopen-scoring` | Re-open scoring | BR-43 |

## Criteria — `/api/rounds/{roundId}/criteria` (ADMIN/COORDINATOR for writes)

| Method | Path | Description | BR |
|---|---|---|---|
| GET | `/rounds/{rid}/criteria` | List criteria | — |
| POST | `/rounds/{rid}/criteria` | Add one criteria | BR-11 |
| PUT | `/rounds/{rid}/criteria/{cid}` | Update criteria | BR-11 |
| PUT | `/rounds/{rid}/criteria` | Replace all (sum=100%) | BR-11 |
| DELETE | `/rounds/{rid}/criteria/{cid}` | Delete criteria | — |

## Assignments — `/api/events/{eventId}` (ADMIN/COORDINATOR)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/events/{eid}/rounds/{rid}/judges` | Assign judge | BR-13 |
| GET | `/events/{eid}/rounds/{rid}/judges` | List judges | — |
| DELETE | `/events/{eid}/rounds/{rid}/judges/{aid}` | Remove judge | — |
| POST | `/events/{eid}/mentors` | Assign mentor | BR-14 |
| GET | `/events/{eid}/mentors` | List mentors | — |
| DELETE | `/events/{eid}/mentors/{aid}` | Remove mentor | — |

## Teams — `/api/events/{eventId}/teams` (Authenticated)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/events/{eid}/teams` | Create team | BR-15,16 |
| POST | `/events/{eid}/teams/join` | Join team | BR-16 |
| GET | `/events/{eid}/teams` | List teams | — |
| GET | `/events/{eid}/teams/my-team` | Get my team | — |
| GET | `/events/{eid}/teams/{tid}` | Get team | — |
| DELETE | `/events/{eid}/teams/{tid}/members/{mid}` | Remove member | BR-20 |
| POST | `/events/{eid}/teams/{tid}/leave` | Leave team | — |
| PUT | `/events/{eid}/teams/{tid}/leader/{uid}` | Transfer leadership | BR-20 |
| POST | `/events/{eid}/teams/mentor-team` | Assign mentor to team | BR-23 |
| DELETE | `/events/{eid}/teams/mentor-team/{aid}` | Remove mentor | — |

## Invitations — `/api/invitations` (Authenticated)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/invitations/teams/{tid}` | Send invitation | BR-21 |
| POST | `/invitations/{iid}/accept` | Accept | BR-21 |
| POST | `/invitations/{iid}/reject` | Reject | BR-21 |
| GET | `/invitations/my` | My pending invitations | — |
| GET | `/invitations/teams/{tid}` | Team's invitations | — |

## Submissions — `/api/rounds/{roundId}/submissions` (Authenticated)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/rounds/{rid}/submissions` | Submit (multipart) | BR-25,30,31,32 |
| GET | `/rounds/{rid}/submissions` | List all | — |
| GET | `/rounds/{rid}/submissions/{sid}` | Get by ID | — |
| GET | `/rounds/{rid}/submissions/team/{tid}` | Get by team | — |
| GET | `/rounds/{rid}/submissions/{sid}/versions` | Version history | BR-30 |
| GET | `/rounds/{rid}/submissions/mentor` | Mentor view | BR-33 |

## Scoring — `/api/rounds/{roundId}/scoring` (JUDGE for writes)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/rounds/{rid}/scoring` | Submit scores | BR-34,35,36 |
| PUT | `/rounds/{rid}/scoring/{jid}` | Update scores | BR-39 |
| GET | `/rounds/{rid}/scoring/submission/{sid}` | Scores by submission | BR-42 |
| GET | `/rounds/{rid}/scoring` | All scores (ADMIN/COORD) | BR-42 |
| GET | `/rounds/{rid}/scoring/my` | My scores | — |
| GET | `/rounds/{rid}/scoring/my/submission/{sid}` | My score for submission | — |
| GET | `/rounds/{rid}/scoring/{jid}` | Score by ID | — |
| POST | `/rounds/{rid}/scoring/lock` | Lock all (ADMIN/COORD) | BR-40 |
| DELETE | `/rounds/{rid}/scoring/{jid}` | Delete score (ADMIN) | BR-41 |

## Rankings — `/api/rounds/{roundId}/rankings` (Authenticated)

| Method | Path | Description | BR |
|---|---|---|---|
| GET | `/rounds/{rid}/rankings` | Get rankings | BR-44 |
| GET | `/rounds/{rid}/rankings/team/{tid}` | Team ranking | — |
| POST | `/rounds/{rid}/rankings/recalculate` | Manual recalc (ADMIN/COORD) | BR-48 |
| GET | `/rounds/{rid}/rankings/advancements` | Advancement status | BR-49 |

## Results — `/api/rounds/{roundId}/results` (ADMIN/COORDINATOR for publish)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/rounds/{rid}/results/publish` | Publish results | BR-51 |
| GET | `/rounds/{rid}/results` | Get published results | — |

## Disputes — `/api/rounds/{roundId}/disputes` (Team leader files)

| Method | Path | Description | BR |
|---|---|---|---|
| POST | `/rounds/{rid}/disputes` | File dispute (24h window) | BR-56 |
| GET | `/rounds/{rid}/disputes` | List (ADMIN/COORD) | — |
| GET | `/rounds/{rid}/disputes/{did}` | Get dispute | — |
| POST | `/rounds/{rid}/disputes/{did}/resolve` | Resolve (ADMIN/COORD) | — |

## Notifications — `/api/notifications` (Authenticated)

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | All notifications |
| GET | `/notifications/unread` | Unread only |
| GET | `/notifications/unread/count` | Unread count |
| PUT | `/notifications/{rid}/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |

## Audit — `/api/admin/audit` (SYSTEM_ADMIN)

| Method | Path | Description | BR |
|---|---|---|---|
| GET | `/admin/audit` | List (filter: actorId, action, targetType) | BR-53 |
| GET | `/admin/audit/range` | List by time range | BR-53 |
| GET | `/admin/audit/target/{tid}` | Entity history | BR-53 |
| POST | `/admin/audit/export` | Export CSV/JSON (meta-logged) | BR-55 |
