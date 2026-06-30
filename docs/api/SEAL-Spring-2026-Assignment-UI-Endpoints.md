# SEAL Spring 2026 — Assignment UI API Endpoints

> **Phạm vi:** Các endpoint được **consume** bởi 3 trang phân công trên frontend.  
> **Thay đổi backend:** Không có API mới hoặc API sửa trong đợt cải thiện UI này — chỉ dùng lại contract hiện có.  
> **Chi tiết đầy đủ:** Xem [SEAL-Spring-2026-Mentor-Judge-Assignment-API.md](./SEAL-Spring-2026-Mentor-Judge-Assignment-API.md)

**Frontend components:**

| Page | Component | Routes |
|------|-----------|--------|
| Mentor pool | `mentor-assignment-page.tsx` | `/admin/...`, `/coordinator/assignments/mentors` |
| Judge pool | `judge-assignment-page.tsx` | `/admin/...`, `/coordinator/assignments/judges` |
| Team × Judge | `judge-assignments-page.tsx` | `/admin/assignments`, `/coordinator/assignments` |

**Response wrapper:** Backend trả `ApiResponse<T>` (`{ success, message, data }`). Frontend `api-client` unwrap `data` trước khi trả về hooks.

---

## 1. Mentor Assignment Page

### Supporting reads

#### `GET /api/admin/users`

Lấy danh sách lecturer làm ứng viên mentor.

**Query params:**
```json
{
  "userType": "LECTURER",
  "status": "ACTIVE",
  "size": 200
}
```

**Response `data`:** `Page<UserListItem>`
```json
{
  "content": [
    {
      "id": "uuid",
      "email": "lecturer@fpt.edu.vn",
      "fullName": "Dr. Nguyen Van A",
      "studentId": null,
      "schoolName": null,
      "userType": "LECTURER",
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 200,
  "number": 0
}
```

**Hook:** `useLecturerOptions` → `adminUserApi.listUsers`

---

#### `GET /api/events`

Danh sách event (admin/coordinator chọn event).

**Query params (optional):** `page`, `size`, `season`, `year`, `status`

**Response `data`:** `Page<EventResponse>` — mỗi item gồm `id`, `name`, `season`, `year`, `status`, ...

**Hook:** `useAdminEvents` → `eventApi.list`

---

#### `GET /api/events/{eventId}`

Chi tiết event (khi route có `defaultEventId` cố định).

**Response `data`:** `EventResponse`

**Hook:** `useAdminEvent` → `eventApi.getById`

---

#### `GET /api/events/{eventId}/tracks`

Danh sách track; field `topic` dùng hiển thị lottery topic trên dropdown.

**Response `data`:** `TrackResponse[]`
```json
[
  {
    "id": "uuid",
    "eventId": "uuid",
    "name": "Track A",
    "description": "...",
    "topic": "RAG for Healthcare" ,
    "maxTeams": 8,
    "scoringTemplateId": "uuid",
    "status": "ACTIVE",
    "assignedTeamCount": 3
  }
]
```

**Hook:** `useQuery` → `trackApi.list`

---

### Mentor pool CRUD (per track)

#### `GET /api/events/{eventId}/tracks/{trackId}/mentors`

**Response `data`:** `MentorAssignmentResponse[]`
```json
[
  {
    "id": "uuid",
    "eventId": "uuid",
    "trackId": "uuid",
    "trackName": "Track A",
    "mentorUserId": "uuid",
    "mentorFullName": "Dr. Nguyen Van A",
    "mentorEmail": "mentor@fpt.edu.vn",
    "assignedAt": "2026-06-29T10:00:00"
  }
]
```

**Hooks:** `useMentorAssignments`, `useAllTrackMentorAssignments` (gọi cho mọi track — phát hiện conflict cross-track)

---

#### `POST /api/events/{eventId}/tracks/{trackId}/mentors`

**Request body:**
```json
{
  "mentorUserId": "uuid"
}
```

**Response `201` `data`:** `MentorAssignmentResponse` (cùng shape như phần tử GET ở trên)

**Hook:** `useAssignMentor` → `assignmentApi.assignMentor`

**Errors:** `400`, `409` (đã assign track này)

---

#### `DELETE /api/events/{eventId}/tracks/{trackId}/mentors/{assignmentId}`

**Response `200` `data`:** `null`

**Hook:** `useRemoveMentor` → `assignmentApi.removeMentor`

---

## 2. Judge Pool Assignment Page

Dùng thêm các endpoint round + judge pool bên dưới (ngoài event/tracks/lecturers ở mục 1).

### `GET /api/events/{eventId}/rounds`

**Response `data`:** `RoundResponse[]`
```json
[
  {
    "id": "uuid",
    "eventId": "uuid",
    "roundNumber": 1,
    "name": "Preliminary Round",
    "startDate": "2026-03-01",
    "endDate": "2026-03-15",
    "submissionDeadline": "2026-03-10T23:59:59",
    "scoringDeadline": "2026-03-14T23:59:59",
    "advancementCutoff": 2,
    "roundType": "PRELIMINARY",
    "advancementRule": "PER_TRACK_TOP_N",
    "criteria": [],
    "judgeCount": 3
  }
]
```

Field `roundType` (`PRELIMINARY` | `FINAL`) và `judgeCount` dùng cho tab + readiness badge.

**Hook:** `useAdminRounds` → `roundApi.list`

---

### Judge pool CRUD (per round + optional track)

#### `GET /api/events/{eventId}/rounds/{roundId}/judges`

**Query params:**

| Round type | `trackId` |
|------------|-----------|
| `PRELIMINARY` | **Bắt buộc** |
| `FINAL` | **Không gửi** |

**Response `data`:** `JudgeAssignmentResponse[]`
```json
[
  {
    "id": "uuid",
    "roundId": "uuid",
    "trackId": "uuid",
    "trackName": "Track A",
    "judgeUserId": "uuid",
    "judgeFullName": "Dr. Tran Van B",
    "judgeEmail": "judge@fpt.edu.vn",
    "assignedAt": "2026-06-29T10:00:00"
  }
]
```

(`trackId` / `trackName` = `null` cho Grand Final)

**Hook:** `useJudgeAssignments` → `assignmentApi.listJudges`

---

#### `POST /api/events/{eventId}/rounds/{roundId}/judges`

**Request (Preliminary):**
```json
{
  "judgeUserId": "uuid",
  "trackId": "uuid"
}
```

**Request (Grand Final):**
```json
{
  "judgeUserId": "uuid"
}
```

**Response `201` `data`:** `JudgeAssignmentResponse`

**Hook:** `useAssignJudge` → `assignmentApi.assignJudge`

---

#### `DELETE /api/events/{eventId}/rounds/{roundId}/judges/{assignmentId}`

**Response `200` `data`:** `null`

**Hook:** `useRemoveJudge` → `assignmentApi.removeJudge`

---

## 3. Team × Judge Assignment Page

### Supporting reads

#### `GET /api/events?season={season}&year={year}&size=100`

Lọc event theo mùa/năm trên trang overview.

**Hook:** `useQuery` → `eventApi.list`

---

#### `GET /api/events/{eventId}/rounds`

**Hook:** `useQuery` → `roundApi.list`

---

#### `GET /api/events/{eventId}/tracks`

Filter track tùy chọn trên overview.

**Hook:** `useQuery` → `trackApi.list`

---

### Team assignment overview

#### `GET /api/events/{eventId}/assignments`

**Query params:**
```json
{
  "roundId": "uuid",
  "trackId": "uuid",
  "season": "Spring",
  "year": 2026
}
```

(`trackId`, `season`, `year` optional)

**Response `data`:** `EventAssignmentsOverviewResponse`
```json
{
  "eventId": "uuid",
  "roundId": "uuid",
  "eligibleJudges": [
    {
      "id": "uuid",
      "judgeUserId": "uuid",
      "judgeFullName": "Dr. Tran Van B",
      "judgeEmail": "judge@fpt.edu.vn"
    }
  ],
  "teams": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "trackId": "uuid",
      "trackName": "Track A",
      "memberCount": 4,
      "mentorUserId": "uuid",
      "mentorFullName": "Dr. Nguyen Van A",
      "submissionStatus": "SUBMITTED",
      "judges": [
        {
          "id": "uuid",
          "teamId": "uuid",
          "roundId": "uuid",
          "judgeUserId": "uuid",
          "judgeFullName": "Dr. Tran Van B",
          "assignedAt": "2026-06-29T10:00:00"
        }
      ],
      "judgeCount": 1
    }
  ]
}
```

Cột **COI** trên UI derive từ `teams[].mentorUserId` và `teams[].judges[].judgeUserId` — không cần API riêng.

**Hook:** `useTeamAssignmentsOverview` → `assignmentApi.getTeamAssignments`

---

### AssignJudgesModal (preliminary)

#### `GET /api/events/{eventId}/rounds/{roundId}/judges?trackId={trackId}`

Lấy judge pool eligible cho team trong vòng preliminary.

**Hook:** `useQuery` trong modal → `assignmentApi.listJudges`

---

### Assign team judges

#### `POST /api/assignments`

**Request body:**
```json
{
  "eventId": "uuid",
  "roundId": "uuid",
  "teamId": "uuid",
  "judgeUserIds": ["uuid", "uuid", "uuid"]
}
```

(`judgeUserIds` — đúng 3 phần tử, unique)

**Response `201` `data`:** `TeamJudgeAssignmentResponse[]`
```json
[
  {
    "id": "uuid",
    "teamId": "uuid",
    "roundId": "uuid",
    "judgeUserId": "uuid",
    "judgeFullName": "Dr. Tran Van B",
    "assignedAt": "2026-06-29T10:00:00"
  }
]
```

**Hook:** `assignmentApi.assignTeamJudges` (mutation trong modal)

**Errors:**
- `400` — thiếu judge, judge không trong pool, judge là mentor của team
- `409` — conflict mentor/judge (COI)

---

### Optional (hook có sẵn, chưa dùng trên overview table)

#### `DELETE /api/assignments/{assignmentId}`

Gỡ một liên kết team–judge.

**Hook:** `useRemoveTeamJudgeAssignment` → `assignmentApi.removeTeamJudgeAssignment`

---

## Tóm tắt theo HTTP method

| Method | Path | Page(s) |
|--------|------|---------|
| GET | `/api/admin/users` | Mentor, Judge pool |
| GET | `/api/events` | Mentor, Judge pool, Team × Judge |
| GET | `/api/events/{eventId}` | Mentor, Judge pool |
| GET | `/api/events/{eventId}/tracks` | Mentor, Judge pool, Team × Judge |
| GET | `/api/events/{eventId}/tracks/{trackId}/mentors` | Mentor |
| POST | `/api/events/{eventId}/tracks/{trackId}/mentors` | Mentor |
| DELETE | `/api/events/{eventId}/tracks/{trackId}/mentors/{assignmentId}` | Mentor |
| GET | `/api/events/{eventId}/rounds` | Judge pool, Team × Judge |
| GET | `/api/events/{eventId}/rounds/{roundId}/judges` | Judge pool, Team × Judge (modal) |
| POST | `/api/events/{eventId}/rounds/{roundId}/judges` | Judge pool |
| DELETE | `/api/events/{eventId}/rounds/{roundId}/judges/{assignmentId}` | Judge pool |
| GET | `/api/events/{eventId}/assignments` | Team × Judge |
| POST | `/api/assignments` | Team × Judge |
| DELETE | `/api/assignments/{assignmentId}` | *(hook only)* |

---

## API đã thêm / sửa?

| Loại | Kết quả |
|------|---------|
| **API mới** | Không |
| **API sửa** | Không |
| **Frontend** | Chỉ cải thiện UI + `useAllTrackMentorAssignments` (gọi lại GET mentors đa track) |
