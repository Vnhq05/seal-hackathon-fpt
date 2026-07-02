# SEAL Spring 2026 — Audit Logs API

> **Phạm vi:** Các endpoint audit log dùng bởi trang Admin **Audit Logs** (`/admin/audit-logs`) và **Export Report** (`/admin/export`).  
> **Lưu ý:** Không có endpoint backend mới hay thay đổi schema trong phạm vi tính năng UI này — tài liệu mô tả API **đã tồn tại**.  
> Ref: BR-53 (immutable audit log), BR-54 (append-only), BR-55 (export meta-logged).

---

## Tổng quan

| Method | Path | Mô tả | UI consumer |
|--------|------|--------|-------------|
| GET | `/api/admin/audit` | Danh sách + filter actor/action/targetType | `audit-logs-page`, dashboard widget |
| GET | `/api/admin/audit/range` | Danh sách theo khoảng thời gian | `audit-logs-page` |
| GET | `/api/admin/audit/target/{targetId}` | Lịch sử theo entity | `audit.api.ts` (sẵn có, chưa dùng UI) |
| POST | `/api/admin/audit/export` | Xuất CSV/JSON | `export-report-page` |
| GET | `/api/admin/users/{userId}` | Resolve actor → tên/email | `use-audit-actor-map` |

**Auth:** Tất cả endpoint trên yêu cầu role `SYSTEM_ADMIN` (Bearer JWT).

**Base URL:** `{API_BASE}/api` (frontend gọi qua `api-client` với prefix `/admin/...`).

---

## Shared schemas

### ApiResponse&lt;T&gt;

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

### Page&lt;T&gt; (Spring Data)

```json
{
  "content": [],
  "totalElements": 237,
  "totalPages": 5,
  "size": 50,
  "number": 0,
  "first": true,
  "last": false,
  "empty": false,
  "numberOfElements": 50
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `content` | `T[]` | Trang dữ liệu hiện tại |
| `totalElements` | `number` | Tổng số bản ghi khớp filter |
| `totalPages` | `number` | Tổng số trang |
| `size` | `number` | Kích thước trang (default backend: 50) |
| `number` | `number` | Chỉ số trang (0-based) |
| `first` | `boolean` | Có phải trang đầu |
| `last` | `boolean` | Có phải trang cuối |

### AuditLogResponse

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "actorId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "action": "UPDATE_EVENT",
  "targetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "targetType": "Event",
  "oldValue": "{\"name\":\"SEAL Hackathon 2025\"}",
  "newValue": "{\"name\":\"SEAL Hackathon 2026\"}",
  "timestamp": "2026-07-02T14:30:00",
  "ipAddress": "192.168.1.100"
}
```

| Field | Type | Nullable | Mô tả |
|-------|------|----------|--------|
| `id` | `UUID` | No | ID bản ghi audit (immutable) |
| `actorId` | `UUID` | No | User thực hiện hành động |
| `action` | `string` | No | Mã hành động (vd: `CREATE_EVENT`, `UPDATE_USER`) |
| `targetId` | `UUID` | Yes | ID entity bị tác động |
| `targetType` | `string` | Yes | Loại entity (vd: `Event`, `User`, `Team`) |
| `oldValue` | `string` | Yes | Giá trị trước (thường là JSON string) |
| `newValue` | `string` | Yes | Giá trị sau (thường là JSON string) |
| `timestamp` | `LocalDateTime` | No | Thời điểm ghi log (ISO-8601) |
| `ipAddress` | `string` | Yes | IP client (hoặc `X-Forwarded-For` đầu tiên) |

---

## 1. GET `/api/admin/audit`

Liệt kê audit log với filter tùy chọn và phân trang.

### Request

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query parameters:**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `actorId` | `UUID` | No | Lọc theo người thực hiện |
| `action` | `string` | No | Lọc exact match theo action |
| `targetType` | `string` | No | Lọc exact match theo loại entity |
| `page` | `number` | No | Trang (default `0`) |
| `size` | `number` | No | Kích thước trang (default `50`) |
| `sort` | `string` | No | Sắp xếp (default `timestamp,desc`) |

**Ví dụ:**
```
GET /api/admin/audit?action=CREATE_EVENT&page=0&size=50&sort=timestamp,desc
```

### Response `200`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "actorId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "action": "CREATE_EVENT",
        "targetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "targetType": "Event",
        "oldValue": null,
        "newValue": "{\"name\":\"SEAL Spring 2026\"}",
        "timestamp": "2026-07-02T10:15:30",
        "ipAddress": "10.0.0.5"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 50,
    "number": 0,
    "first": true,
    "last": true
  }
}
```

### Errors

| Status | Mô tả |
|--------|--------|
| `401` | Chưa đăng nhập |
| `403` | Không phải `SYSTEM_ADMIN` |

---

## 2. GET `/api/admin/audit/range`

Liệt kê audit log trong khoảng thời gian. **Không** hỗ trợ thêm filter `actorId` / `action` / `targetType` trên server — UI kết hợp date range + filter phụ bằng client-side trên trang hiện tại.

### Request

**Query parameters:**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `from` | `LocalDateTime` | Yes | Thời điểm bắt đầu (ISO-8601, vd `2026-07-01T00:00:00`) |
| `to` | `LocalDateTime` | Yes | Thời điểm kết thúc (ISO-8601, vd `2026-07-02T23:59:59`) |
| `page` | `number` | No | Trang (default `0`) |
| `size` | `number` | No | Kích thước trang (default `50`) |
| `sort` | `string` | No | Sắp xếp (default `timestamp,desc`) |

**Ví dụ:**
```
GET /api/admin/audit/range?from=2026-07-01T00:00:00&to=2026-07-31T23:59:59&page=0&size=50
```

### Response `200`

Cùng format `ApiResponse<Page<AuditLogResponse>>` như endpoint list.

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [],
    "totalElements": 0,
    "totalPages": 0,
    "size": 50,
    "number": 0,
    "first": true,
    "last": true
  }
}
```

---

## 3. GET `/api/admin/audit/target/{targetId}`

Lịch sử audit của một entity cụ thể.

### Request

**Path parameters:**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `targetId` | `UUID` | Yes | ID entity |

**Query parameters:**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `targetType` | `string` | Yes | Loại entity (vd `Event`) |
| `page` | `number` | No | Trang (default `0`) |
| `size` | `number` | No | Kích thước trang (default `50`) |
| `sort` | `string` | No | Sắp xếp (default `timestamp,desc`) |

**Ví dụ:**
```
GET /api/admin/audit/target/a1b2c3d4-e5f6-7890-abcd-ef1234567890?targetType=Event&page=0&size=20
```

### Response `200`

Cùng format `ApiResponse<Page<AuditLogResponse>>`.

---

## 4. POST `/api/admin/audit/export`

Xuất toàn bộ audit log trong khoảng ngày dưới dạng CSV hoặc JSON. Hành động export **được ghi vào audit log** (BR-55).

### Request

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body (`AuditExportRequest`):**

```json
{
  "startDate": "2026-07-01T00:00:00",
  "endDate": "2026-07-31T23:59:59",
  "format": "CSV"
}
```

| Field | Type | Required | Mô tả |
|-------|------|----------|--------|
| `startDate` | `LocalDateTime` | Yes | Ngày bắt đầu (inclusive) |
| `endDate` | `LocalDateTime` | Yes | Ngày kết thúc (phải sau `startDate`) |
| `format` | `"CSV"` \| `"JSON"` | Yes | Định dạng file xuất |

### Response `200`

**Không** bọc `ApiResponse` — trả về binary trực tiếp.

**Headers:**
```
Content-Type: text/csv          (khi format = CSV)
Content-Type: application/json  (khi format = JSON)
Content-Disposition: attachment; filename="audit_export_20260702_143000.csv"
```

**Body:** Raw bytes (CSV hoặc JSON array of audit records).

**CSV columns (tham khảo):** `id`, `actorId`, `action`, `targetId`, `targetType`, `oldValue`, `newValue`, `timestamp`, `ipAddress`

### Errors

| Status | Mô tả |
|--------|--------|
| `400` | `endDate` không sau `startDate`, hoặc validation fail |
| `401` | Chưa đăng nhập |
| `403` | Không phải `SYSTEM_ADMIN` |

---

## 5. GET `/api/admin/users/{userId}` (Supporting — Actor resolution)

Endpoint phụ trợ: trang Audit Logs gọi để hiển thị tên/email thay vì raw UUID.

### Request

**Path parameters:**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `userId` | `UUID` | Yes | ID user (actor) |

**Ví dụ:**
```
GET /api/admin/users/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

### Response `200`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "email": "admin@fpt.edu.vn",
    "fullName": "Nguyen Van Admin",
    "phone": "0901234567",
    "studentId": null,
    "universityName": null,
    "userType": "SYSTEM_ADMIN",
    "status": "ACTIVE",
    "studentStanding": null,
    "semester": null,
    "temporaryAccount": false,
    "createdAt": "2025-01-15T08:00:00"
  }
}
```

| Field | Type | Nullable | Mô tả |
|-------|------|----------|--------|
| `id` | `UUID` | No | User ID |
| `email` | `string` | No | Email |
| `fullName` | `string` | No | Họ tên |
| `phone` | `string` | Yes | Số điện thoại |
| `studentId` | `string` | Yes | Mã SV |
| `universityName` | `string` | Yes | Tên trường |
| `userType` | `UserType` | No | `FPT_STUDENT`, `EXTERNAL_STUDENT`, `LECTURER`, `EVENT_COORDINATOR`, `SYSTEM_ADMIN` |
| `status` | `AccountStatus` | No | `PENDING`, `ACTIVE`, `REJECTED`, `LOCKED` |
| `studentStanding` | `StudentStanding` | Yes | `ENROLLED`, `GRADUATED` |
| `semester` | `number` | Yes | Học kỳ |
| `temporaryAccount` | `boolean` | No | Tài khoản tạm |
| `createdAt` | `LocalDateTime` | No | Ngày tạo |

### Errors

| Status | Mô tả |
|--------|--------|
| `404` | User không tồn tại |
| `401` / `403` | Auth / role |

---

## Frontend mapping

| Backend path | TypeScript | File |
|--------------|------------|------|
| `GET /admin/audit` | `auditApi.list()` | `frontend/src/lib/api/audit.api.ts` |
| `GET /admin/audit/range` | `auditApi.listByRange()` | `frontend/src/lib/api/audit.api.ts` |
| `GET /admin/audit/target/{id}` | `auditApi.listByTarget()` | `frontend/src/lib/api/audit.api.ts` |
| `POST /admin/audit/export` | `auditApi.export()` | `frontend/src/lib/api/audit.api.ts` |
| `GET /admin/users/{id}` | `adminUserApi.getUserById()` | `frontend/src/lib/api/admin-user.api.ts` |

**React hooks / pages:**

| Component / Hook | Mô tả |
|------------------|--------|
| `useAuditLogs` | `frontend/src/features/admin/hooks/use-audit-logs.ts` — chọn `list` hoặc `listByRange` |
| `useAuditActorMap` | `frontend/src/features/admin/hooks/use-audit-actor-map.ts` — resolve actor labels |
| `AuditLogsPage` | `frontend/src/features/admin/components/audit-logs-page.tsx` |
| `AdminActivityFeed` | `frontend/src/features/admin/components/admin-activity-feed.tsx` — preview 20 rows |
| `ExportReportPage` | `frontend/src/features/admin/components/export-report-page.tsx` |

**TypeScript types (frontend):**

```typescript
// audit.api.ts
interface AuditLogResponse {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  ipAddress: string | null;
}

interface AuditExportRequest {
  startDate: string;
  endDate: string;
  format: "CSV" | "JSON";
}
```

---

## Ghi chú triển khai UI

1. **Dashboard widget** gọi `auditApi.list({ size: 20, sort: "timestamp,desc" })` — chỉ preview, link sang `/admin/audit-logs`.
2. **Trang Audit Logs** dùng `size: 50`, phân trang server-side.
3. Khi có **cả date range lẫn actor/action/targetType**, UI gọi `listByRange` rồi lọc client-side trên trang hiện tại (giới hạn backend).
4. **Export** tách biệt tại `/admin/export` — không gộp vào trang audit logs.
