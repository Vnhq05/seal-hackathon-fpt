# SEAL Spring 2026 — Awards & Participation Certificates API

> Ref: `File_nghiệp_vụ_lệch.md` **§16**  
> Base URL: `/api` · Auth: Bearer JWT (where noted)  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) · [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md)

---

## 1. Business rules

### 1.1 Team prizes (existing)

| Prize rank | Label (SEAL seed) | Value |
|---|---|---:|
| `FIRST` | Giải Nhất | 7,000,000 VND |
| `SECOND` | Giải Nhì | 5,000,000 VND |
| `THIRD` | Giải Ba | 3,000,000 VND |
| `CONSOLATION` | Khuyến khích | 1,500,000 VND |

Prizes are seeded automatically when creating an event with `competitionFormat = SEAL_RAG_2026`.

Team awards map **final-round ranking positions 1–4** to prize ranks `FIRST` → `CONSOLATION`.

### 1.2 Certificate of Participation (new)

| Rule | Detail |
|---|---|
| Eligibility | Members of teams with `status = CONFIRMED` at award time |
| Issue trigger | Bundled with `POST /awards/assign` (same transaction) |
| Re-assign | Deletes existing participation certificates for the event, then re-issues |
| Scope | Per **user** per event (not per team) |

> Out of scope: PDF generation, winner prize certificate metadata (`+ certificate` on cash prizes).

---

## 2. Enums

### PrizeRank

| Value | Meaning |
|---|---|
| `FIRST` | 1st place |
| `SECOND` | 2nd place |
| `THIRD` | 3rd place |
| `CONSOLATION` | Honorable mention |

No new enum values were added for participation certificates.

---

## 3. Response types

### TeamAwardResponse

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "prizeId": "uuid",
  "prizeRank": "FIRST",
  "prizeLabel": "Giải Nhất",
  "prizeValue": "7000000",
  "awardedAt": "2026-04-12T17:00:00"
}
```

### ParticipationCertificateResponse

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "teamId": "uuid",
  "userFullName": "Nguyen Van A",
  "teamName": "Team Alpha",
  "issuedAt": "2026-04-12T17:00:00"
}
```

### ParticipationCertificateSummaryResponse

```json
{
  "eventId": "uuid",
  "issuedCount": 42
}
```

### AwardAssignmentResultResponse

> **Breaking change:** `POST /awards/assign` no longer returns a bare `TeamAwardResponse[]`. It returns this wrapper.

```json
{
  "teamAwards": [ "/* TeamAwardResponse[] */" ],
  "participationCertificatesIssued": 42,
  "participationCertificates": [ "/* ParticipationCertificateResponse[] */" ]
}
```

---

## 4. Endpoints

### 4.1 POST `/api/events/{eventId}/awards/assign`

Assign team prizes from final-round ranking **and** issue participation certificates.

**Auth:** `SYSTEM_ADMIN` or `EVENT_COORDINATOR`

**Path params:**

| Param | Type | Required |
|---|---|---|
| `eventId` | UUID | Yes |

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Awards assigned",
  "data": {
    "teamAwards": [
      {
        "id": "a1111111-1111-1111-1111-111111111111",
        "eventId": "e1111111-1111-1111-1111-111111111111",
        "teamId": "t1111111-1111-1111-1111-111111111111",
        "teamName": "Team Alpha",
        "prizeId": "p1111111-1111-1111-1111-111111111111",
        "prizeRank": "FIRST",
        "prizeLabel": "Giải Nhất",
        "prizeValue": "7000000",
        "awardedAt": "2026-04-12T17:00:00"
      },
      {
        "id": "a2222222-2222-2222-2222-222222222222",
        "eventId": "e1111111-1111-1111-1111-111111111111",
        "teamId": "t2222222-2222-2222-2222-222222222222",
        "teamName": "Team Beta",
        "prizeId": "p2222222-2222-2222-2222-222222222222",
        "prizeRank": "SECOND",
        "prizeLabel": "Giải Nhì",
        "prizeValue": "5000000",
        "awardedAt": "2026-04-12T17:00:00"
      }
    ],
    "participationCertificatesIssued": 3,
    "participationCertificates": [
      {
        "id": "c1111111-1111-1111-1111-111111111111",
        "eventId": "e1111111-1111-1111-1111-111111111111",
        "userId": "u1111111-1111-1111-1111-111111111111",
        "teamId": "t1111111-1111-1111-1111-111111111111",
        "userFullName": "Nguyen Van A",
        "teamName": "Team Alpha",
        "issuedAt": "2026-04-12T17:00:00"
      }
    ]
  }
}
```

**Response 400** — final rankings not calculated:

```json
{
  "success": false,
  "message": "Final rankings not yet calculated",
  "data": null
}
```

**Response 404** — event not found:

```json
{
  "success": false,
  "message": "Event not found with id: {eventId}",
  "data": null
}
```

**Frontend:** `awardApi.assign(eventId)` → `AwardAssignmentResultResponse`

---

### 4.2 GET `/api/events/{eventId}/awards`

List team awards (unchanged).

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
      "id": "a1111111-1111-1111-1111-111111111111",
      "eventId": "e1111111-1111-1111-1111-111111111111",
      "teamId": "t1111111-1111-1111-1111-111111111111",
      "teamName": "Team Alpha",
      "prizeId": "p1111111-1111-1111-1111-111111111111",
      "prizeRank": "FIRST",
      "prizeLabel": "Giải Nhất",
      "prizeValue": "7000000",
      "awardedAt": "2026-04-12T17:00:00"
    }
  ]
}
```

**Frontend:** `awardApi.list(eventId)` → `TeamAwardResponse[]`

---

### 4.3 GET `/api/public/events/{eventId}/awards`

Public list of team awards (unchanged). Same response shape as §4.2.

**Auth:** None

**Frontend:** `awardApi.listPublic(eventId)` → `TeamAwardResponse[]`

---

### 4.4 GET `/api/events/{eventId}/awards/participation`

List all participation certificates for an event (coordinator/admin).

**Auth:** `SYSTEM_ADMIN` or `EVENT_COORDINATOR`

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
      "id": "c1111111-1111-1111-1111-111111111111",
      "eventId": "e1111111-1111-1111-1111-111111111111",
      "userId": "u1111111-1111-1111-1111-111111111111",
      "teamId": "t1111111-1111-1111-1111-111111111111",
      "userFullName": "Nguyen Van A",
      "teamName": "Team Alpha",
      "issuedAt": "2026-04-12T17:00:00"
    },
    {
      "id": "c2222222-2222-2222-2222-222222222222",
      "eventId": "e1111111-1111-1111-1111-111111111111",
      "userId": "u2222222-2222-2222-2222-222222222222",
      "teamId": "t1111111-1111-1111-1111-111111111111",
      "userFullName": "Tran Thi B",
      "teamName": "Team Alpha",
      "issuedAt": "2026-04-12T17:00:00"
    }
  ]
}
```

**Response 404** — event not found.

**Frontend:** `awardApi.listParticipation(eventId)` → `ParticipationCertificateResponse[]`

---

### 4.5 GET `/api/events/{eventId}/awards/participation/me`

Get the current user's participation certificate for an event.

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
  "data": {
    "id": "c1111111-1111-1111-1111-111111111111",
    "eventId": "e1111111-1111-1111-1111-111111111111",
    "userId": "u1111111-1111-1111-1111-111111111111",
    "teamId": "t1111111-1111-1111-1111-111111111111",
    "userFullName": "Nguyen Van A",
    "teamName": "Team Alpha",
    "issuedAt": "2026-04-12T17:00:00"
  }
}
```

**Response 404** — certificate not issued (user not on a CONFIRMED team, or awards not yet assigned):

```json
{
  "success": false,
  "message": "Participation certificate not found with eventId/userId: {eventId}/{userId}",
  "data": null
}
```

**Frontend:** `awardApi.getMyParticipation(eventId)` → `ParticipationCertificateResponse`

---

### 4.6 GET `/api/public/events/{eventId}/awards/participation`

Public summary of participation certificates (count only — no participant names).

**Auth:** None

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
  "data": {
    "eventId": "e1111111-1111-1111-1111-111111111111",
    "issuedCount": 42
  }
}
```

**Response 404** — event not found.

**Frontend:** `awardApi.listParticipationPublic(eventId)` → `ParticipationCertificateSummaryResponse`

---

## 5. Database

Table `participation_certificates` — run [`backend/src/main/resources/db/participation_certificates.sql`](../../backend/src/main/resources/db/participation_certificates.sql) on SQL Server when `ddl-auto=validate`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `event_id` | UUID | NOT NULL |
| `user_id` | UUID | NOT NULL |
| `team_id` | UUID | NOT NULL |
| `issued_at` | DATETIME2 | NOT NULL |
| `created_at` / `updated_at` | DATETIME2 | Audit |

Unique: `(event_id, user_id)`

---

## 6. End-to-end flow

```text
POST /events (SEAL_RAG_2026)
  → Teams register and reach CONFIRMED (3–5 members)
  → Final round scoring → rankings calculated
  → POST /events/{eventId}/awards/assign          [coordinator]
      → teamAwards (top 4)
      → participationCertificates (all CONFIRMED team members)
  → GET /public/events/{eventId}/awards           [public prize board]
  → GET /public/events/{eventId}/awards/participation  [public count]
  → GET /events/{eventId}/awards/participation/me      [student own cert]
```

---

## 7. Frontend TypeScript mapping

```typescript
import {
  awardApi,
  type AwardAssignmentResultResponse,
  type TeamAwardResponse,
  type ParticipationCertificateResponse,
  type ParticipationCertificateSummaryResponse,
} from "@/lib/api";

await awardApi.assign(eventId);                    // AwardAssignmentResultResponse
await awardApi.list(eventId);                      // TeamAwardResponse[]
await awardApi.listPublic(eventId);                // TeamAwardResponse[]
await awardApi.listParticipation(eventId);         // ParticipationCertificateResponse[]
await awardApi.getMyParticipation(eventId);        // ParticipationCertificateResponse
await awardApi.listParticipationPublic(eventId);   // ParticipationCertificateSummaryResponse
```

---

## 8. Out of scope

- PDF / printable certificate template
- `includesCertificate` flag on `TeamAwardResponse` for cash prizes
- Auto-assign on results publish (still manual via coordinator)
