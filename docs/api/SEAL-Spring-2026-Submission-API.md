# SEAL Spring 2026 — Submission API

> Ref: `File_nghiệp_vụ_lệch.md` **§7**  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) · [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md)

---

## 1. Enums

### SubmissionStatus

| Value | Mô tả |
|---|---|
| `SUBMITTED` | Đã nộp (version mới nhất) |
| `SCORED` | Đã được chấm |
| `NOT_SCORED` | Chưa chấm |
| `DRAFT` | Legacy — không dùng trong SEAL flow |

### Milestone gates (SEAL `PRELIMINARY`)

Gates được enforce qua **`round.slideDeadline`** và **`round.submissionDeadline`** (không qua `EventSchedule.gate`).

| Phase | Điều kiện thời gian | Payload cho phép |
|---|---|---|
| Milestone 1 | `now < slideDeadline` (10:00 Day 2) | Chỉ `slideUrl` |
| Milestone 2 | `slideDeadline ≤ now < submissionDeadline` (14:00) | `sourceCodeUrl` + `slideUrl` + `demoUrl` |
| Đóng | `now ≥ submissionDeadline` | `400` |

**PDF:** Không bắt buộc cho event `SEAL_RAG_2026` (slide thay PDF). Format khác (`GENERIC`): PDF bắt buộc lần nộp đầu.

---

## 2. Shared DTOs

### CreateSubmissionRequest (JSON part `submission`)

| Field | Type | Required | Mô tả |
|---|---|---|---|
| `sourceCodeUrl` | string | M2 / non-SEAL | **Canonical** — GitHub, Jira, Confluence, Notion |
| `slideUrl` | string | M1 / M2 (SEAL) | Google Slides, PowerPoint online, v.v. |
| `demoUrl` | string | M2 / non-SEAL | Product link hoặc video (http/https) |
| `githubUrl` | string | — | **Deprecated alias** của `sourceCodeUrl` |
| `pdfPageCount` | integer | — | Metadata khi upload PDF (non-SEAL) |

### SubmissionVersionResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | uuid | Version ID |
| `versionNumber` | integer | Số version (append-only, BR-30) |
| `sourceCodeUrl` | string \| null | Source code URL |
| `githubUrl` | string \| null | Deprecated alias (= `sourceCodeUrl`) |
| `slideUrl` | string \| null | Slide URL |
| `demoUrl` | string \| null | Demo URL |
| `submittedAt` | datetime | Thời điểm nộp (tie-breaker BR-47) |
| `attachments` | AttachmentResponse[] | PDF attachments (legacy / non-SEAL) |

### AttachmentResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | uuid | Attachment ID |
| `fileName` | string | Tên file gốc |
| `fileUrl` | string | Path download (`/api/files/submissions/...`) |
| `fileSize` | long | Bytes |
| `pageCount` | integer | Số trang PDF |

### SubmissionResponse

| Field | Type | Mô tả |
|---|---|---|
| `id` | uuid | Submission ID |
| `teamId` | uuid | Team |
| `roundId` | uuid | Round |
| `status` | SubmissionStatus | Trạng thái |
| `submittedBy` | uuid | User ID leader đã nộp |
| `currentVersion` | integer | Version hiện tại |
| `totalVersions` | integer | Tổng số version |
| `latestVersion` | SubmissionVersionResponse \| null | Version mới nhất |
| `createdAt` | datetime | Lần nộp đầu |

---

## 3. POST `/api/rounds/{roundId}/submissions`

Submit hoặc re-submit (mỗi lần tạo version mới — BR-30).

**Auth:** Team leader (BR-31)  
**Content-Type:** `multipart/form-data`

| Part | Type | Required | Mô tả |
|---|---|---|---|
| `submission` | JSON string | Yes | `CreateSubmissionRequest` |
| `pdf` | file | Conditional | Bắt buộc lần đầu cho **non-SEAL**; optional cho SEAL và re-submit |

### Scenario A — SEAL Milestone 1 (slide only, trước 10:00)

**Request parts:**

```
submission: {"slideUrl":"https://docs.google.com/presentation/d/abc123"}
pdf: (không gửi)
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Submission successful",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "teamId": "team-uuid",
    "roundId": "round-uuid",
    "status": "SUBMITTED",
    "submittedBy": "leader-uuid",
    "currentVersion": 1,
    "totalVersions": 1,
    "latestVersion": {
      "id": "version-uuid",
      "versionNumber": 1,
      "sourceCodeUrl": null,
      "githubUrl": null,
      "slideUrl": "https://docs.google.com/presentation/d/abc123",
      "demoUrl": null,
      "submittedAt": "2026-04-12T09:45:00",
      "attachments": []
    },
    "createdAt": "2026-04-12T09:45:00"
  }
}
```

### Scenario B — SEAL Milestone 2 (full, trước 14:00)

**Request parts:**

```
submission: {
  "sourceCodeUrl": "https://github.com/org/repo",
  "slideUrl": "https://docs.google.com/presentation/d/abc123",
  "demoUrl": "https://youtube.com/watch?v=xxx"
}
pdf: (optional)
```

**Response `201`:** Cùng structure; `latestVersion` có đủ 3 URL.

### Scenario C — Non-SEAL (GENERIC format)

**Request parts:**

```
submission: {
  "sourceCodeUrl": "https://github.com/org/repo",
  "demoUrl": "https://youtube.com/watch?v=xxx",
  "pdfPageCount": 2
}
pdf: report.pdf (required on first submit)
```

**Response `201`:** `latestVersion.attachments[]` chứa PDF metadata.

### Errors

| HTTP | Message (ví dụ) | Nguyên nhân |
|---|---|---|
| `400` | Slide submission gate closed at … | Nộp chỉ slide sau `slideDeadline` |
| `400` | Demo submission deadline passed at … | Sau `submissionDeadline` |
| `400` | Demo URL is required for Milestone 2 | Thiếu demo trong M2 |
| `400` | Source code URL is required | Thiếu source |
| `400` | Google Drive cannot be used as source code repository | `drive.google.com` / `docs.google.com` |
| `400` | Source URL must be GitHub, Jira, Confluence, or Notion | Host không hợp lệ |
| `400` | PDF file is required | Non-SEAL, lần nộp đầu không có PDF |
| `403` | Only the team leader can submit | Không phải leader (BR-31) |
| `403` | Only finalists can submit for the final round | FINAL round, không phải finalist |
| `403` | You are not a member of any team in this event | User không thuộc team |
| `403` | Round has ended | Ngoài `startDate`–`endDate` |

---

## 4. GET `/api/rounds/{roundId}/submissions`

Danh sách submissions theo round (lọc theo role).

**Auth:** Bearer JWT

| Role | Quyền xem |
|---|---|
| `SYSTEM_ADMIN`, `EVENT_COORDINATOR` | Tất cả submissions trong round |
| `FPT_STUDENT`, `EXTERNAL_STUDENT` | Chỉ team của mình |
| `LECTURER` | Teams được assign judge + teams mentor |

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "submission-uuid",
      "teamId": "team-uuid",
      "roundId": "round-uuid",
      "status": "SUBMITTED",
      "submittedBy": "leader-uuid",
      "currentVersion": 2,
      "totalVersions": 2,
      "latestVersion": {
        "id": "version-uuid",
        "versionNumber": 2,
        "sourceCodeUrl": "https://github.com/org/repo",
        "githubUrl": "https://github.com/org/repo",
        "slideUrl": "https://docs.google.com/presentation/d/abc",
        "demoUrl": "https://youtube.com/watch?v=xxx",
        "submittedAt": "2026-04-12T13:30:00",
        "attachments": []
      },
      "createdAt": "2026-04-12T09:45:00"
    }
  ]
}
```

---

## 5. GET `/api/rounds/{roundId}/submissions/{submissionId}`

Chi tiết một submission.

**Auth:** Bearer JWT (cùng rule truy cập như list)

**Response `200`:** `data` là một `SubmissionResponse` (cùng shape như phần tử trong list).

**Response `404`:** Submission không tồn tại hoặc không thuộc round.

---

## 6. GET `/api/rounds/{roundId}/submissions/team/{teamId}`

Lấy submission của team trong round.

**Auth:** Bearer JWT

**Response `200`:** `data` là `SubmissionResponse`.

**Response `404`:** Team chưa nộp bài cho round này.

---

## 7. GET `/api/rounds/{roundId}/submissions/{submissionId}/versions`

Lịch sử version (BR-30 — append-only).

**Auth:** Bearer JWT

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "version-2-uuid",
      "versionNumber": 2,
      "sourceCodeUrl": "https://github.com/org/repo",
      "githubUrl": "https://github.com/org/repo",
      "slideUrl": "https://docs.google.com/presentation/d/abc",
      "demoUrl": "https://youtube.com/watch?v=xxx",
      "submittedAt": "2026-04-12T13:30:00",
      "attachments": []
    },
    {
      "id": "version-1-uuid",
      "versionNumber": 1,
      "sourceCodeUrl": null,
      "githubUrl": null,
      "slideUrl": "https://docs.google.com/presentation/d/abc",
      "demoUrl": null,
      "submittedAt": "2026-04-12T09:45:00",
      "attachments": []
    }
  ]
}
```

---

## 8. GET `/api/rounds/{roundId}/submissions/mentor`

Mentor xem submissions của teams được assign (BR-33).

**Auth:** `LECTURER` (mentor)

**Query:** `eventId` (required, uuid)

**Response `200`:** `data` là `SubmissionResponse[]` của teams mentor trong round.

---

## 9. GET `/api/files/submissions/**`

Download PDF attachment (inline).

**Auth:** Bearer JWT (theo security config hiện tại)

**Example:** `GET /api/files/submissions/{submissionId}/v{versionNumber}/report.pdf`

**Response `200`:** `Content-Type: application/pdf`

---

## 10. Validation rules

### Source code URL (`sourceCodeUrl` / `githubUrl`)

| Allowed | Blocked |
|---|---|
| `github.com/*` | `drive.google.com` |
| `*.atlassian.net` (Jira) | `docs.google.com` |
| URLs chứa `confluence` | |
| `notion.so`, `notion.site` | |

### Demo URL

Mọi URL `http://` hoặc `https://` hợp lệ (Google Drive **được phép** cho demo).

### PDF (non-SEAL)

- Max 5 MB
- Content-Type: `application/pdf`
- Bắt buộc lần submit đầu; optional khi re-submit (copy attachment từ version trước nếu không upload mới)

---

## 11. Frontend mapping

| UI route | API |
|---|---|
| `/student/submissions` | `POST /rounds/{roundId}/submissions` |
| `/student/submissions/submit` | Redirect → `/student/submissions` |
| Team inline modal (non-SEAL) | Cùng POST endpoint |

Client types: `frontend/src/lib/api/submission.api.ts`  
Validation: `frontend/src/features/submissions/utils/source-code-url.utils.ts`

---

## 12. Changelog (§7 alignment)

| Thay đổi | Mô tả |
|---|---|
| `sourceCodeUrl` canonical | Thay `githubUrl` / `repositoryUrl` làm field chính |
| `githubUrl` deprecated | Vẫn accept request & trả response alias |
| SEAL slide-only | `github_url` / `demo_url` nullable; không yêu cầu PDF |
| Milestone gates | Backend `validateSealSubmission()` + frontend `resolveSealPhase()` |
| Google Drive block | Chỉ áp dụng source code URL |
