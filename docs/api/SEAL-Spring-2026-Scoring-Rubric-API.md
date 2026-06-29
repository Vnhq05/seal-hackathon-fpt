# SEAL Spring 2026 — Scoring Rubric API

> Ref: `File_nghiệp_vụ_lệch.md` **§6**  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> Related: [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md) · [`SEAL-Spring-2026-API-Reference.md`](./SEAL-Spring-2026-API-Reference.md)

---

## 1. Scoring scale (SEAL Spring 2026)

| Value | Label |
|---:|---|
| 1 | Poor |
| 2 | Below expectations |
| 3 | Meets |
| 4 | Good |
| 5 | Excellent |

**Per-criterion range:** `minScore = 1`, `maxScore = 5` (seeded on event `SEAL_RAG_2026`).

**Weighted judge score:**

```text
WeightedScore = Σ (criterionScore × criterionWeight / 100)
```

Maximum possible weighted score when all criteria scored at 5: **5.0**.

**Comment rule (BR-36):** Comment **required** when score equals `minScore` or `maxScore` for that criterion.

---

## 2. SEAL rubric tables

### Preliminary (`roundType = PRELIMINARY`)

| Criterion (VI) | Weight | minScore | maxScore |
|---|---:|---:|---:|
| Tính chính xác và phù hợp với Domain | 30% | 1 | 5 |
| Kiến trúc Agentic RAG & Giải thuật | 30% | 1 | 5 |
| Ý tưởng & Thuyết trình | 15% | 1 | 5 |
| Khả năng thực thi & tính sáng tạo | 15% | 1 | 5 |
| Trải nghiệm người dùng & giao diện tương tác | 10% | 1 | 5 |

### Final (`roundType = FINAL`)

| Criterion (VI) | Weight | minScore | maxScore |
|---|---:|---:|---:|
| Chất lượng xử lý & truy xuất dữ liệu | 30% | 1 | 5 |
| Độ tin cậy & chống ảo giác | 20% | 1 | 5 |
| Tư duy Agent & xử lý đa tầng | 20% | 1 | 5 |
| Tính thực tế & tối ưu vận hành | 20% | 1 | 5 |
| Khả năng mở rộng & sáng tạo | 10% | 1 | 5 |

> Preliminary and final rounds have **distinct** criterion sets (different names/weights). Seeded automatically when creating an event with `competitionFormat: SEAL_RAG_2026`.

---

## 3. Modified schemas

### CriteriaResponse (new fields)

```json
{
  "id": "uuid",
  "name": "Tính chính xác và phù hợp với Domain",
  "description": "Accuracy and Domain Relevance",
  "weight": 30,
  "sortOrder": 0,
  "minScore": 1,
  "maxScore": 5
}
```

### CriteriaRequest (optional scale — defaults 1/5)

```json
{
  "name": "Technical",
  "description": "Code quality",
  "weight": 40,
  "sortOrder": 0,
  "minScore": 1,
  "maxScore": 5
}
```

### RoundResponse.criteria[]

Nested `criteria` on each round now includes `minScore` and `maxScore`.

### ScoringTemplateResponse.criteria[]

```json
{
  "id": "uuid",
  "name": "SEAL Spring 2026 — Vòng bảng",
  "description": "Preliminary round rubric — scale 1–5",
  "criteria": [
    {
      "id": "uuid",
      "name": "Tính chính xác và phù hợp với Domain",
      "description": "Accuracy and Domain Relevance",
      "weight": 30,
      "sortOrder": 0,
      "minScore": 1,
      "maxScore": 5
    }
  ],
  "createdAt": "2026-04-01T00:00:00"
}
```

---

## 4. Endpoints

| Method | Path | Auth | Status |
|---|---|---|---|
| GET | `/api/rounds/{roundId}/criteria` | Any authenticated | **Modified** response |
| POST | `/api/rounds/{roundId}/criteria` | ADMIN, COORDINATOR | **Modified** request/response |
| PUT | `/api/rounds/{roundId}/criteria/{criteriaId}` | ADMIN, COORDINATOR | **Modified** |
| PUT | `/api/rounds/{roundId}/criteria` | ADMIN, COORDINATOR | **Modified** (replace all) |
| GET | `/api/events/{eventId}/rounds` | Any authenticated | **Modified** nested `criteria[]` |
| GET | `/api/public/events/{eventId}/rounds` | Public | **Modified** nested `criteria[]` |
| POST | `/api/rounds/{roundId}/scoring` | LECTURER | **Modified** validation (1–5 for SEAL) |
| PUT | `/api/rounds/{roundId}/scoring/{judgeScoreId}` | LECTURER | **Modified** |
| GET | `/api/admin/scoring-templates` | ADMIN | **Modified** (+ min/max on criteria) |
| POST | `/api/admin/scoring-templates` | ADMIN | **Modified** |
| PUT | `/api/admin/scoring-templates/{id}` | ADMIN | **Modified** |

---

## 5. GET `/api/rounds/{roundId}/criteria`

**Auth:** Bearer JWT

### Response 200 — Preliminary round example

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Tính chính xác và phù hợp với Domain",
      "description": "Accuracy and Domain Relevance",
      "weight": 30,
      "sortOrder": 0,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Kiến trúc Agentic RAG & Giải thuật",
      "description": "Agentic RAG Architecture & Algorithm",
      "weight": 30,
      "sortOrder": 1,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "name": "Ý tưởng & Thuyết trình",
      "description": "Ideas & Presentation",
      "weight": 15,
      "sortOrder": 2,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "d4e5f6a7-b8c9-0123-def0-234567890123",
      "name": "Khả năng thực thi & tính sáng tạo",
      "description": "Feasibility & Creativity",
      "weight": 15,
      "sortOrder": 3,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "name": "Trải nghiệm người dùng & giao diện tương tác",
      "description": "User Experience & Interactive Interface",
      "weight": 10,
      "sortOrder": 4,
      "minScore": 1,
      "maxScore": 5
    }
  ]
}
```

### Response 200 — Final round example (different rubric)

```json
{
  "success": true,
  "message": null,
  "data": [
    {
      "id": "f6a7b8c9-d0e1-2345-f012-456789012345",
      "name": "Chất lượng xử lý & truy xuất dữ liệu",
      "description": "Data Processing & Retrieval Quality",
      "weight": 30,
      "sortOrder": 0,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "a7b8c9d0-e1f2-3456-0123-567890123456",
      "name": "Độ tin cậy & chống ảo giác",
      "description": "Reliability & Hallucination Resistance",
      "weight": 20,
      "sortOrder": 1,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "b8c9d0e1-f2a3-4567-1234-678901234567",
      "name": "Tư duy Agent & xử lý đa tầng",
      "description": "Agent Reasoning & Multi-hop Processing",
      "weight": 20,
      "sortOrder": 2,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "c9d0e1f2-a3b4-5678-2345-789012345678",
      "name": "Tính thực tế & tối ưu vận hành",
      "description": "Practicality & Operational Optimization",
      "weight": 20,
      "sortOrder": 3,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "id": "d0e1f2a3-b4c5-6789-3456-890123456789",
      "name": "Khả năng mở rộng & sáng tạo",
      "description": "Scalability & Innovation",
      "weight": 10,
      "sortOrder": 4,
      "minScore": 1,
      "maxScore": 5
    }
  ]
}
```

---

## 6. PUT `/api/rounds/{roundId}/criteria` — Replace all criteria

**Auth:** `SYSTEM_ADMIN` | `EVENT_COORDINATOR`

**Request body:**

```json
[
  {
    "name": "Tính chính xác và phù hợp với Domain",
    "description": "Accuracy and Domain Relevance",
    "weight": 30,
    "sortOrder": 0,
    "minScore": 1,
    "maxScore": 5
  },
  {
    "name": "Kiến trúc Agentic RAG & Giải thuật",
    "description": "Agentic RAG Architecture & Algorithm",
    "weight": 30,
    "sortOrder": 1,
    "minScore": 1,
    "maxScore": 5
  },
  {
    "name": "Ý tưởng & Thuyết trình",
    "weight": 15,
    "sortOrder": 2,
    "minScore": 1,
    "maxScore": 5
  },
  {
    "name": "Khả năng thực thi & tính sáng tạo",
    "weight": 15,
    "sortOrder": 3,
    "minScore": 1,
    "maxScore": 5
  },
  {
    "name": "Trải nghiệm người dùng & giao diện tương tác",
    "weight": 10,
    "sortOrder": 4,
    "minScore": 1,
    "maxScore": 5
  }
]
```

**Response 200:**

```json
{
  "success": true,
  "message": "Criteria replaced",
  "data": [ "...CriteriaResponse[] with minScore/maxScore..." ]
}
```

**Errors:**

| Status | Condition |
|---|---|
| 400 | Weights do not sum to 100% |
| 400 | `minScore >= maxScore` |
| 400 | Scoring already started for this round |

---

## 7. POST `/api/rounds/{roundId}/scoring` — Submit judge scores

**Auth:** `LECTURER` (assigned to team)

**Request body:**

```json
{
  "submissionId": "uuid",
  "complete": true,
  "scores": [
    {
      "criteriaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "score": 4,
      "comment": null
    },
    {
      "criteriaId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "score": 5,
      "comment": "Excellent Agentic RAG design with clear retrieval pipeline"
    },
    {
      "criteriaId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "score": 3
    },
    {
      "criteriaId": "d4e5f6a7-b8c9-0123-def0-234567890123",
      "score": 4
    },
    {
      "criteriaId": "e5f6a7b8-c9d0-1234-ef01-345678901234",
      "score": 1,
      "comment": "UI needs significant improvement before demo"
    }
  ]
}
```

**Validation (SEAL, scale 1–5):**

- Each `score` must satisfy `minScore ≤ score ≤ maxScore` from the round's criteria.
- When `complete: true`, all criteria must be present exactly once.
- Comment required when `score == 1` or `score == 5` (min/max of scale).

**Response 201:**

```json
{
  "success": true,
  "message": "Score submitted",
  "data": {
    "id": "uuid",
    "judgeUserId": "uuid",
    "judgeFullName": "Nguyen Van A",
    "submissionId": "uuid",
    "roundId": "uuid",
    "status": "COMPLETED",
    "startedAt": "2026-04-12T14:30:00",
    "completedAt": "2026-04-12T14:35:00",
    "details": [
      {
        "id": "uuid",
        "criteriaId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "criteriaName": "Tính chính xác và phù hợp với Domain",
        "score": 4
      }
    ],
    "comments": [
      {
        "id": "uuid",
        "criteriaId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "criteriaName": "Kiến trúc Agentic RAG & Giải thuật",
        "comment": "Excellent Agentic RAG design with clear retrieval pipeline"
      }
    ]
  }
}
```

### Error examples

**400 — Score out of range:**

```json
{
  "success": false,
  "message": "Score 6 for criteria a1b2c3d4-e5f6-7890-abcd-ef1234567890 must be between 1 and 5",
  "data": null
}
```

**400 — Missing comment at extreme score:**

```json
{
  "success": false,
  "message": "Comment is required for criteria e5f6a7b8-c9d0-1234-ef01-345678901234 because score 5 is at the minimum or maximum of the scale",
  "data": null
}
```

---

## 8. PUT `/api/rounds/{roundId}/scoring/{judgeScoreId}`

Same request/response shape as POST. Used to update an existing in-progress or completed score before the scoring deadline.

**Request body:** identical to §7.

**Response 200:** `ApiResponse<JudgeScoreResponse>`

---

## 9. GET `/api/events/{eventId}/rounds` — Criteria in round list

**Response excerpt:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "roundNumber": 1,
      "name": "Vòng bảng",
      "roundType": "PRELIMINARY",
      "advancementRule": "PER_TRACK_TOP_N",
      "advancementCutoff": 2,
      "roundWeight": 40,
      "criteria": [
        {
          "id": "uuid",
          "name": "Tính chính xác và phù hợp với Domain",
          "description": "Accuracy and Domain Relevance",
          "weight": 30,
          "sortOrder": 0,
          "minScore": 1,
          "maxScore": 5
        }
      ],
      "judgeCount": 3
    },
    {
      "id": "uuid",
      "roundNumber": 2,
      "name": "Chung kết",
      "roundType": "FINAL",
      "criteria": [ "..." ]
    }
  ]
}
```

---

## 10. Scoring templates (admin)

### GET `/api/admin/scoring-templates`

Returns templates including **SEAL Spring 2026 — Vòng bảng** and **SEAL Spring 2026 — Chung kết** (seeded on first startup).

### POST `/api/admin/scoring-templates`

**Request:**

```json
{
  "name": "Custom Rubric",
  "description": "Optional",
  "criteria": [
    {
      "name": "Technical",
      "description": "Code quality",
      "weight": 50,
      "sortOrder": 0,
      "minScore": 1,
      "maxScore": 5
    },
    {
      "name": "Presentation",
      "weight": 50,
      "sortOrder": 1,
      "minScore": 1,
      "maxScore": 5
    }
  ]
}
```

**Response 201:** `ApiResponse<ScoringTemplateResponse>`

---

## 11. Frontend mapping

| Backend | Frontend |
|---|---|
| `CriteriaResponse.minScore` / `maxScore` | `criteria.api.ts` → `CriteriaResponse` |
| `GET /rounds/{id}/criteria` | `criteriaApi.list()` |
| `RoundResponse.criteria[]` | `round.api.ts` → nested criteria |
| `POST /rounds/{id}/scoring` | `judgingApi.submitScore()` |
| Weighted display | `computeWeightedScore()` in `scoring.schema.ts` |
| Judge scoring UI | `use-submission-scoring.ts` → maps API `maxScore` |
| Round submissions list | `use-round-submissions.ts` → weighted max 5.0 for SEAL |
| Score history | `use-score-history.ts` → per-criterion `maxScore` from criteria |

---

## 12. Database migration

Applied via [`seal_spring_2026_migration.sql`](../../backend/src/main/resources/db/seal_spring_2026_migration.sql):

```sql
ALTER TABLE criteria ADD min_score INT NOT NULL DEFAULT 1;
ALTER TABLE criteria ADD max_score INT NOT NULL DEFAULT 5;
ALTER TABLE scoring_template_criteria ADD min_score INT NOT NULL DEFAULT 1;
ALTER TABLE scoring_template_criteria ADD max_score INT NOT NULL DEFAULT 5;
```

SEAL events created with `competitionFormat: SEAL_RAG_2026` receive distinct preliminary/final rubrics via `SealSpring2026Template`.

### Orphan judging data cleanup

Removes `team_judge_assignments` / `judge_scores` whose `round_id` or `team_id` no longer exists (e.g. placeholder `aaaaaaaa-…` UUIDs from manual dev SQL). Deletes child `judge_comments` and `judge_score_details` first.

### Legacy score rescale (0–10 / 0–100 → 1–5)

For existing `judge_score_details` where `score > criteria.max_score`:

| Stored value | Rescale |
|---|---|
| `score ≤ 10` | `ROUND(1 + score × 4 / 10)` |
| `score > 10` | `ROUND(1 + score × 4 / 100)` |

Result is clamped to `[criteria.min_score, criteria.max_score]`. Fixes score history display (e.g. `78/5` → weighted total ≈ `3.9/5.0`).

### Dev demo judging (Fall 2026)

On backend startup, [`JudgingDemoSeeder`](../../backend/src/main/java/com/sealhackathon/infrastructure/config/JudgingDemoSeeder.java) idempotently seeds for **SEAL Fall Hackathon Demo** (Team Alpha, Round One):

- Round criteria from scoring template (`minScore=1`, `maxScore=5`)
- Submission + team-judge assignments (`lecturer1`, `lecturer2`)
- Completed sample score for `lecturer1` on 1–5 scale

**Smoke test:** login `lecturer1@fpt.edu.vn` / `12345678` → `/lecturer/scoring` → open Team Alpha → criteria load; `/lecturer/history` shows plausible weighted total (not `78/5`).
