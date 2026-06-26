# SEAL HACKATHON PLATFORM — KẾ HOẠCH SỬA LỖI CRITICAL + HIGH

> Dự án: D:\K5-2026\SWP391\SEAL_HACKATHON_FPT
> Backend: Spring Boot (Java 17+, JPA/Hibernate, SQL Server)
> Frontend: Next.js 16 (TypeScript, Zustand, React Query, Axios)
> Tổng: 12 CRITICAL + 25 HIGH = 37 lỗi, chia thành 10 Task

---

## TASK 1: Externalize Secrets & Config (CRITICAL)

### Mục tiêu
Loại bỏ toàn bộ secrets hardcode trong source code.

### File cần sửa
- `backend/src/main/resources/application.yml`

### Hướng dẫn cụ thể

**1.1 — JWT Secret (dòng 36)**
```yaml
# TRƯỚC (BUG):
secret: ${JWT_SECRET:dGhpc2lzYXZlcnlsb25nc2VjcmV0a2V5Zm9ydGhlc2VhbGhhY2thdGhvbnByb2plY3QyMDI2c3dwMzkx}

# SAU (FIX): Bỏ default value — app PHẢI fail nếu không set JWT_SECRET
secret: ${JWT_SECRET}
```

**1.2 — Database Password (dòng 8-10)**
```yaml
# TRƯỚC (BUG):
url: jdbc:sqlserver://localhost:1433;databaseName=SEAL;encrypt=true;trustServerCertificate=true
username: sa
password: 12345

# SAU (FIX):
url: ${DB_URL:jdbc:sqlserver://localhost:1433;databaseName=SEAL;encrypt=true;trustServerCertificate=true}
username: ${DB_USERNAME:sa}
password: ${DB_PASSWORD}
```

**1.3 — CORS Origins (dòng cuối, thêm mới)**
Thêm config để CORS origins có thể cấu hình qua env var:
```yaml
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```

Sau đó cập nhật `backend/src/main/java/com/sealhackathon/common/config/CorsConfig.java` để đọc từ config thay vì hardcode `localhost:3000`.

**1.4 — Tạo file `.env.example`** tại thư mục `backend/`:
```
JWT_SECRET=<base64-encoded-random-256bit-key>
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=SEAL;encrypt=true;trustServerCertificate=true
DB_USERNAME=sa
DB_PASSWORD=<your-password>
CORS_ALLOWED_ORIGINS=http://localhost:3000
MAIL_USERNAME=
MAIL_PASSWORD=
```

---

## TASK 2: JWT Security Hardening (CRITICAL + HIGH)

### Mục tiêu
Fix JWT principal, thêm issuer claim, thêm token version để cho phép invalidation.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/auth/security/JwtProvider.java`
2. `backend/src/main/java/com/sealhackathon/auth/security/JwtAuthenticationFilter.java`
3. `backend/src/main/java/com/sealhackathon/auth/service/AuthPublicServiceImpl.java`

### Hướng dẫn cụ thể

**2.1 — JwtProvider.java: Thêm issuer claim**

Trong method `generateAccessToken()` (dòng 28-39), thêm `.issuer("seal-hackathon")`:
```java
public String generateAccessToken(UUID userId, String email, String role) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + accessTokenExpirationMs);

    return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("role", role)
            .issuer("seal-hackathon")       // <-- THÊM
            .issuedAt(now)
            .expiration(expiry)
            .signWith(signingKey)
            .compact();
}
```

Trong method `parseClaims()` (dòng 67-73), thêm `.requireIssuer()`:
```java
private Claims parseClaims(String token) {
    return Jwts.parser()
            .verifyWith(signingKey)
            .requireIssuer("seal-hackathon")  // <-- THÊM
            .build()
            .parseSignedClaims(token)
            .getPayload();
}
```

**2.2 — JwtAuthenticationFilter.java: Set userId làm principal thay vì email**

Hiện tại (dòng 34-45), `userId` bị extract nhưng bị discard, `email` được set làm principal. Mỗi request phải query DB để map email→userId.

Tạo một record/class `UserPrincipal`:
```java
// Tạo file mới: backend/src/main/java/com/sealhackathon/auth/security/UserPrincipal.java
package com.sealhackathon.auth.security;

import java.util.UUID;

public record UserPrincipal(UUID userId, String email) {}
```

Sửa `JwtAuthenticationFilter.doFilterInternal()`:
```java
if (token != null && jwtProvider.validateToken(token)) {
    UUID userId = jwtProvider.getUserIdFromToken(token);
    String email = jwtProvider.getEmailFromToken(token);
    String role = jwtProvider.getRoleFromToken(token);

    UserPrincipal principal = new UserPrincipal(userId, email);

    UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                    principal,      // <-- ĐỔI: UserPrincipal thay vì email
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

**2.3 — AuthPublicServiceImpl.java: Đọc userId từ principal, không query DB**

Sửa method `getCurrentUserId()`:
```java
@Override
public UUID getCurrentUserId() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
        return principal.userId();
    }
    throw new BusinessException("Not authenticated", HttpStatus.UNAUTHORIZED) {};
}
```

Tương tự thêm method `getCurrentUserEmail()` nếu cần:
```java
@Override
public String getCurrentUserEmail() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
        return principal.email();
    }
    throw new BusinessException("Not authenticated", HttpStatus.UNAUTHORIZED) {};
}
```

**LƯU Ý:** Sau thay đổi này, mọi chỗ dùng `SecurityContextHolder.getContext().getAuthentication().getName()` để lấy email sẽ TRẢ VỀ `UserPrincipal.toString()` thay vì email. Cần tìm và sửa tất cả các chỗ đó:
- `EventService.java` dòng 324, 339, 390 — đổi thành `authPublicService.getCurrentUserEmail()`
- Và bất kỳ file nào khác gọi `auth.getName()` để lấy email

---

## TASK 3: WebSocket Authentication & CORS (CRITICAL + HIGH)

### Mục tiêu
WebSocket PHẢI yêu cầu JWT authentication. Bỏ wildcard CORS.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/common/config/WebSocketConfig.java`
2. Tạo mới: `backend/src/main/java/com/sealhackathon/common/config/WebSocketAuthInterceptor.java`
3. `backend/src/main/java/com/sealhackathon/auth/security/SecurityConfig.java` (dòng 56)
4. `frontend/src/features/livescore/hooks/use-websocket.ts`
5. `frontend/src/features/teams/hooks/use-mentor-chat-websocket.ts`

### Hướng dẫn cụ thể

**3.1 — Tạo WebSocketAuthInterceptor.java (file mới)**
```java
package com.sealhackathon.common.config;

import com.sealhackathon.auth.security.JwtProvider;
import com.sealhackathon.auth.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtProvider.validateToken(token)) {
                    UUID userId = jwtProvider.getUserIdFromToken(token);
                    String email = jwtProvider.getEmailFromToken(token);
                    String role = jwtProvider.getRoleFromToken(token);

                    UserPrincipal principal = new UserPrincipal(userId, email);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                    principal, null,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    accessor.setUser(auth);
                    return message;
                }
            }
            throw new IllegalArgumentException("Missing or invalid authentication token");
        }
        return message;
    }
}
```

**3.2 — WebSocketConfig.java: Đăng ký interceptor + fix CORS**
```java
package com.sealhackathon.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .withSockJS();

        registry.addEndpoint("/ws/mentor-chat/{teamId}")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}
```

**3.3 — Frontend WebSocket hooks: Gửi JWT trong STOMP CONNECT**

Trong CẢ HAI file `use-websocket.ts` và `use-mentor-chat-websocket.ts`, tìm đoạn gửi STOMP CONNECT frame (nơi build header `accept-version` và `heart-beat`), thêm Authorization header:

```typescript
// Lấy token từ localStorage
const token = localStorage.getItem("access_token");

ws.send(buildStompFrame("CONNECT", {
  "accept-version": "1.2",
  "heart-beat": "10000,10000",
  ...(token ? { "Authorization": `Bearer ${token}` } : {}),
}));
```

**3.4 — Thêm exponential backoff cho reconnect**

Trong cả hai hook, thay đổi logic reconnect:
```typescript
// TRƯỚC (BUG): Fixed 3 second interval, infinite retries
// setTimeout(connect, 3000);

// SAU (FIX): Exponential backoff với max retries
const MAX_RETRIES = 10;
const retryCountRef = useRef(0);

// Trong onclose handler:
if (retryCountRef.current < MAX_RETRIES) {
  const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
  retryCountRef.current++;
  setTimeout(connect, delay);
}

// Reset retry count khi connect thành công (trong onopen hoặc sau CONNECTED frame):
retryCountRef.current = 0;
```

---

## TASK 4: Scoring Logic Fixes (CRITICAL)

### Mục tiêu
Fix scoring deadline hardcode, score range mismatch, criteria validation.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/event/service/EventPublicServiceImpl.java` (dòng 99-103)
2. `backend/src/main/java/com/sealhackathon/judging/service/JudgingService.java` (dòng 226, 382-389, 391-400, 138-147, 403-411)
3. `backend/src/main/java/com/sealhackathon/judging/dto/request/ScoreDetailDto.java` (dòng 22-24)
4. `backend/src/main/java/com/sealhackathon/judging/domain/JudgeScoreDetail.java` (dòng 53-58)
5. `backend/src/main/java/com/sealhackathon/judging/domain/JudgeScore.java` (thêm @Version)

### Hướng dẫn cụ thể

**4.1 — Fix scoring deadline hardcode**

File `EventPublicServiceImpl.java`, method `getScoringDeadline()` dòng 97-103:
```java
// TRƯỚC (BUG):
return round.getEndDate().plusHours(2);

// SAU (FIX):
return round.getScoringDeadline();
```

File `JudgingService.java`, method `buildScoringAssignment()` dòng 226:
```java
// TRƯỚC (BUG):
.scoringDeadline(round != null ? round.getEndDate().plusHours(2) : null)

// SAU (FIX):
.scoringDeadline(round != null ? round.getScoringDeadline() : null)
```

**4.2 — Thống nhất score range về 0-10**

Chọn scale 0-10 (vì DTO frontend và backend DTO đều dùng 0-10).

File `JudgeScoreDetail.java` dòng 53-58:
```java
// TRƯỚC (BUG):
@Min(0)
@Max(100)
@Column(name = "score", nullable = false)
private Integer score;

// SAU (FIX):
@Min(0)
@Max(10)
@Column(name = "score", nullable = false)
private Integer score;
```

Cập nhật Javadoc dòng 26-28:
```java
// TRƯỚC: BR-35  Score range 0–100 per criteria.
//        BR-36  Comment required when score < 50 or > 90
// SAU:   BR-35  Score range 0–10 per criteria.
//        BR-36  Comment required when score < 3 or > 8
```

File `JudgingService.java`, method `validateExtremeScoreComments()` dòng 391-400:
```java
// TRƯỚC (BUG): thresholds 5 và 9 không rõ ràng
if ((dto.getScore() < 5 || dto.getScore() > 9)

// SAU (FIX): scale 0-10 → extreme khi < 3 hoặc > 8
if ((dto.getScore() < 3 || dto.getScore() > 8)
```
> LƯU Ý: Thresholds 3 và 8 là gợi ý tương đương 30% và 80%. Nếu business rule khác thì điều chỉnh, nhưng PHẢI consistent giữa tất cả các layer.

**4.3 — Fix criteria validation: check ID set thay vì count**

File `JudgingService.java`, method `validateAllCriteriaPresent()` dòng 382-389:
```java
// TRƯỚC (BUG):
private void validateAllCriteriaPresent(List<ScoreDetailDto> scores,
                                        List<CriteriaSnapshot> roundCriteria) {
    if (scores.size() != roundCriteria.size()) {
        throw new BusinessException(
                "Must provide scores for all " + roundCriteria.size() + " criteria. Got: " + scores.size(),
                HttpStatus.BAD_REQUEST) {};
    }
}

// SAU (FIX):
private void validateAllCriteriaPresent(List<ScoreDetailDto> scores,
                                        List<CriteriaSnapshot> roundCriteria) {
    Set<UUID> submittedIds = scores.stream()
            .map(ScoreDetailDto::getCriteriaId)
            .collect(Collectors.toSet());

    // Check for duplicate criteria in submission
    if (submittedIds.size() != scores.size()) {
        throw new BusinessException("Duplicate criteria IDs in score submission",
                HttpStatus.BAD_REQUEST) {};
    }

    Set<UUID> requiredIds = roundCriteria.stream()
            .map(CriteriaSnapshot::getId)
            .collect(Collectors.toSet());

    if (!submittedIds.equals(requiredIds)) {
        throw new BusinessException(
                "Must provide scores for all " + requiredIds.size() + " criteria. Got: " + submittedIds.size(),
                HttpStatus.BAD_REQUEST) {};
    }
}
```
> Thêm import `java.util.Set` nếu chưa có.

**4.4 — Fix deleteScore: thêm LOCKED check + event ownership**

File `JudgingService.java`, method `deleteScore()` dòng 138-147:
```java
// TRƯỚC (BUG):
@Transactional
public void deleteScore(UUID judgeScoreId) {
    JudgeScore score = getJudgeScore(judgeScoreId);
    UUID submissionId = score.getSubmissionId();

    judgeScoreRepository.delete(score);

    eventPublisher.publishEvent(new ScoreDeletedEvent(
            judgeScoreId, score.getJudgeUserId(), submissionId, score.getRoundId()));
}

// SAU (FIX):
@Transactional
public void deleteScore(UUID judgeScoreId, UUID roundId) {
    JudgeScore score = getJudgeScore(judgeScoreId);

    if (!score.getRoundId().equals(roundId)) {
        throw new BusinessException("Score does not belong to this round", HttpStatus.BAD_REQUEST) {};
    }

    if (score.getStatus() == ScoreStatus.LOCKED) {
        throw new BusinessException("Cannot delete a locked score", HttpStatus.BAD_REQUEST) {};
    }

    UUID submissionId = score.getSubmissionId();
    judgeScoreRepository.delete(score);

    eventPublisher.publishEvent(new ScoreDeletedEvent(
            judgeScoreId, score.getJudgeUserId(), submissionId, score.getRoundId()));
}
```
Cập nhật controller `JudgingController.java` dòng 114-121 để truyền `roundId`:
```java
public ResponseEntity<ApiResponse<Void>> deleteScore(
        @PathVariable UUID roundId, @PathVariable UUID judgeScoreId) {
    judgingService.deleteScore(judgeScoreId, roundId);  // <-- thêm roundId
    ...
}
```

**4.5 — Thêm @Version cho optimistic locking**

File `JudgeScore.java`, thêm field sau dòng 48 (sau class declaration):
```java
@Version
@Column(name = "version")
private Long version;
```
> Thêm import `jakarta.persistence.Version`.

Trong `JudgingService.java`, wrap phần save trong try-catch:
```java
// Ở method submitScore(), quanh dòng 90-100, wrap existing check + save:
try {
    // ... existing logic ...
    return createNewScore(judgeId, roundId, request, roundCriteria, completing);
} catch (org.springframework.dao.OptimisticLockingFailureException e) {
    throw new BusinessException("Concurrent score modification detected. Please retry.",
            HttpStatus.CONFLICT) {};
}
```

**4.6 — Fix checkScoringComplete: đếm assigned judges thay vì score rows**

File `JudgingService.java`, method `checkScoringComplete()` dòng 403-411:
```java
// TRƯỚC (BUG): đếm score rows = totalJudges → fire sớm khi mới 1 judge submit
private void checkScoringComplete(UUID submissionId) {
    int totalJudges = judgeScoreRepository.countBySubmissionId(submissionId);
    int completedJudges = judgeScoreRepository.countBySubmissionIdAndStatus(
            submissionId, ScoreStatus.COMPLETED);
    if (completedJudges > 0 && completedJudges == totalJudges) {
        eventPublisher.publishEvent(new ScoringCompletedEvent(submissionId, totalJudges));
    }
}

// SAU (FIX): lấy teamId+roundId → đếm assigned judges
private void checkScoringComplete(UUID submissionId) {
    Submission submission = submissionRepository.findById(submissionId).orElse(null);
    if (submission == null) return;

    int totalAssignedJudges = (int) teamJudgeAssignmentRepository
            .countByTeamIdAndRoundId(submission.getTeamId(), submission.getRoundId());
    int completedJudges = judgeScoreRepository.countBySubmissionIdAndStatus(
            submissionId, ScoreStatus.COMPLETED);

    if (totalAssignedJudges > 0 && completedJudges >= totalAssignedJudges) {
        eventPublisher.publishEvent(new ScoringCompletedEvent(submissionId, totalAssignedJudges));
    }
}
```
> Cần thêm method `countByTeamIdAndRoundId(UUID teamId, UUID roundId)` trong `TeamJudgeAssignmentRepository` nếu chưa có.

---

## TASK 5: Frontend Route Protection & Auth (CRITICAL + HIGH)

### Mục tiêu
Thêm middleware.ts, auth guard cho layouts, token refresh logic, fix logout.

### File cần sửa / tạo
1. Tạo mới: `frontend/src/middleware.ts`
2. Tất cả layout.tsx: `(admin)`, `(judge)`, `(staff)`, `(mentor)`, `(student)`, `(lecturer)`
3. `frontend/src/lib/axios.ts`
4. `frontend/src/features/auth/hooks/use-login.ts`
5. `frontend/src/features/auth/store/auth.store.ts`
6. Tất cả sidebar files (6 files)

### Hướng dẫn cụ thể

**5.1 — Tạo middleware.ts (file mới)**

```typescript
// frontend/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/privacy", "/terms", "/"];
const ROLE_PATH_MAP: Record<string, string[]> = {
  SYSTEM_ADMIN: ["/admin"],
  EVENT_COORDINATOR: ["/staff"],
  LECTURER: ["/lecturer", "/judge", "/mentor"],
  FPT_STUDENT: ["/student"],
  EXTERNAL_STUDENT: ["/student"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/api"))) {
    return NextResponse.next();
  }

  // Check for auth token in cookie or Authorization header
  // Since we use localStorage, middleware can only check a lightweight cookie
  // This is a first-pass guard; the real check happens client-side in layouts
  const authStorage = request.cookies.get("auth-check");
  if (!authStorage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|swagger).*)"],
};
```

> LƯU Ý: Vì JWT nằm trong localStorage (không phải cookie), middleware chỉ là lớp bảo vệ sơ bộ. Lớp chính phải nằm ở client-side layout guard.

**5.2 — Tạo shared AuthGuard component**

```typescript
// Tạo mới: frontend/src/shared/components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { UserType } from "@/lib/api/types";

interface AuthGuardProps {
  allowedRoles: UserType[];
  children: React.ReactNode;
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (!allowedRoles.includes(user.userType)) {
      // Redirect to correct portal
      const HOME: Record<string, string> = {
        SYSTEM_ADMIN: "/admin",
        EVENT_COORDINATOR: "/staff",
        LECTURER: "/lecturer",
        FPT_STUDENT: "/student",
        EXTERNAL_STUDENT: "/student",
      };
      router.replace(HOME[user.userType] ?? "/login");
    }
  }, [hydrated, isAuthenticated, user, allowedRoles, router]);

  if (!hydrated || !isAuthenticated || !user || !allowedRoles.includes(user.userType)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
```

**5.3 — Cập nhật mỗi layout.tsx để dùng AuthGuard**

Ví dụ `frontend/src/app/(admin)/layout.tsx`:
```typescript
// TRƯỚC (BUG): Không check auth
import { AdminSidebar } from "@/shared/layouts/admin-sidebar";
import { AdminTopNav } from "@/shared/layouts/admin-topnav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-seal-bg">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <AdminTopNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

// SAU (FIX):
"use client";

import { AdminSidebar } from "@/shared/layouts/admin-sidebar";
import { AdminTopNav } from "@/shared/layouts/admin-topnav";
import { AuthGuard } from "@/shared/components/auth-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["SYSTEM_ADMIN"]}>
      <div className="relative flex min-h-screen bg-seal-bg">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <AdminTopNav />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
```

Áp dụng tương tự cho:
- `(judge)/layout.tsx` → `allowedRoles={["LECTURER"]}`
- `(staff)/layout.tsx` → `allowedRoles={["EVENT_COORDINATOR"]}`
- `(mentor)/layout.tsx` → `allowedRoles={["LECTURER"]}`
- `(student)/layout.tsx` → `allowedRoles={["FPT_STUDENT", "EXTERNAL_STUDENT"]}`
- `(lecturer)/layout.tsx` → `allowedRoles={["LECTURER"]}`

**5.4 — axios.ts: Thêm 401 interceptor + token refresh**

```typescript
// frontend/src/lib/axios.ts — TOÀN BỘ FILE MỚI
import axios from "axios";
import { env } from "@/lib/env";
import { authApi } from "@/lib/api/auth.api";
import { useAuthStore } from "@/features/auth/store/auth.store";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Extract backend error message
    const backendMessage = error.response?.data?.message;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        localStorage.removeItem("access_token");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const data = await authApi.refresh({ refreshToken });
        const newToken = data.accessToken;
        localStorage.setItem("access_token", newToken);
        useAuthStore.getState().setAuth(data.user, newToken);
        // Store new refresh token if returned
        if (data.refreshToken) {
          useAuthStore.getState().setRefreshToken(data.refreshToken);
        }
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        localStorage.removeItem("access_token");
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }
    return Promise.reject(error);
  }
);
```

**5.5 — auth.store.ts: Thêm refreshToken field + setRefreshToken method**

```typescript
// Cập nhật auth.store.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,             // <-- THÊM
      isAuthenticated: false,
      setAuth: (user: UserInfo, accessToken: string) =>
        set({ user, accessToken, isAuthenticated: true }),
      setRefreshToken: (refreshToken: string) =>   // <-- THÊM
        set({ refreshToken }),
      clearAuth: () => set({
        user: null, accessToken: null, refreshToken: null, isAuthenticated: false
      }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,    // <-- THÊM
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

Cập nhật type `AuthState` tương ứng.

**5.6 — use-login.ts: Lưu refreshToken**
```typescript
onSuccess: (data) => {
  setAuth(data.user, data.accessToken);
  // Lưu refresh token
  useAuthStore.getState().setRefreshToken(data.refreshToken);
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", data.accessToken);
    // Set auth-check cookie for middleware
    document.cookie = "auth-check=1; path=/; SameSite=Lax";
  }
  router.push(USER_TYPE_HOME[data.user.userType] ?? "/student");
},
```

**5.7 — Fix logout trong TẤT CẢ sidebar files**

Tìm tất cả sidebar files (admin-sidebar.tsx, judge-sidebar.tsx, staff-sidebar.tsx, mentor-sidebar.tsx, student-sidebar.tsx, lecturer-sidebar.tsx). Trong mỗi file, sửa logout handler:
```typescript
// TRƯỚC (BUG): Không gọi backend, không clear React Query
const handleLogout = () => {
  clearAuth();
  localStorage.removeItem("access_token");
  router.push("/login");
};

// SAU (FIX):
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth.api";

const queryClient = useQueryClient();

const handleLogout = async () => {
  try {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      await authApi.logout({ refreshToken });
    }
  } catch {
    // Ignore logout API errors — clear local state regardless
  } finally {
    clearAuth();
    localStorage.removeItem("access_token");
    document.cookie = "auth-check=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    queryClient.clear();
    router.push("/login");
  }
};
```

---

## TASK 6: Event State Machine Fixes (HIGH)

### Mục tiêu
Fix event lifecycle: block CANCELLED re-activation, block COMPLETED deletion, persist status transitions.

### File cần sửa
- `backend/src/main/java/com/sealhackathon/event/service/EventService.java`

### Hướng dẫn cụ thể

**6.1 — activateEvent(): Block CANCELLED events (dòng 248-273)**
```java
// TRƯỚC (BUG) dòng 253:
if (event.getStatus() == EventStatus.COMPLETED) {
    throw new BusinessException("Cannot activate a completed event", HttpStatus.BAD_REQUEST) {};
}

// SAU (FIX):
if (event.getStatus() == EventStatus.COMPLETED || event.getStatus() == EventStatus.CANCELLED) {
    throw new BusinessException("Cannot activate a completed or cancelled event", HttpStatus.BAD_REQUEST) {};
}
```

**6.2 — deleteEvent(): Block COMPLETED events (dòng 225-246)**
```java
// TRƯỚC (BUG) dòng 231:
if (liveStatus == EventStatus.ACTIVE) {

// SAU (FIX):
if (liveStatus == EventStatus.ACTIVE || liveStatus == EventStatus.COMPLETED) {
    throw new BusinessException("Cannot delete an active or completed event", HttpStatus.BAD_REQUEST) {};
}
```

---

## TASK 7: Authorization Gaps Backend (HIGH)

### Mục tiêu
Thêm @PreAuthorize và ownership checks cho các endpoints thiếu authorization.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/judging/controller/JudgingController.java`
2. `backend/src/main/java/com/sealhackathon/notification/service/NotificationService.java`
3. `backend/src/main/java/com/sealhackathon/common/controller/SystemConfigController.java`
4. `backend/src/main/java/com/sealhackathon/event/controller/ScoringTemplateController.java`
5. `backend/src/main/java/com/sealhackathon/common/exception/GlobalExceptionHandler.java`

### Hướng dẫn cụ thể

**7.1 — JudgingController: Thêm @PreAuthorize cho 2 endpoints thiếu**

File `JudgingController.java`:

Dòng 61-67 (`getScoresBySubmission`):
```java
// TRƯỚC (BUG): Không có @PreAuthorize
@GetMapping("/submission/{submissionId}")
@Operation(summary = "Get all scores for a submission (BR-42 — coordinator view)")

// SAU (FIX):
@GetMapping("/submission/{submissionId}")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR', 'LECTURER')")
@Operation(summary = "Get all scores for a submission (BR-42 — coordinator view)")
```

Dòng 98-104 (`getScoreById`):
```java
// TRƯỚC (BUG): Không có @PreAuthorize
@GetMapping("/{judgeScoreId}")
@Operation(summary = "Get score by ID")

// SAU (FIX):
@GetMapping("/{judgeScoreId}")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR', 'LECTURER')")
@Operation(summary = "Get score by ID")
```

**7.2 — NotificationService.markAsRead: Thêm ownership check**

File `NotificationService.java`, method `markAsRead()` dòng 81-90:
```java
// TRƯỚC (BUG):
@Transactional
public void markAsRead(UUID recipientId) {
    NotificationRecipient recipient = recipientRepository.findById(recipientId)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "NotificationRecipient", "id", recipientId));
    if (recipient.getReadAt() == null) {
        recipient.setReadAt(LocalDateTime.now());
        recipientRepository.save(recipient);
    }
}

// SAU (FIX):
@Transactional
public void markAsRead(UUID recipientId, UUID userId) {
    NotificationRecipient recipient = recipientRepository.findById(recipientId)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "NotificationRecipient", "id", recipientId));
    if (!recipient.getUserId().equals(userId)) {
        throw new BusinessException("Cannot mark another user's notification as read",
                HttpStatus.FORBIDDEN) {};
    }
    if (recipient.getReadAt() == null) {
        recipient.setReadAt(LocalDateTime.now());
        recipientRepository.save(recipient);
    }
}
```
> Cập nhật `NotificationController` tương ứng để truyền `userId` từ `authPublicService.getCurrentUserId()`.

**7.3 — SystemConfigController: Thêm @PreAuthorize**

File `SystemConfigController.java`, thêm annotation ở class level:
```java
@RestController
@RequestMapping("/api/admin/system-config")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")    // <-- THÊM class-level guard
public class SystemConfigController {
```

**7.4 — ScoringTemplateController: Thêm @PreAuthorize**

File `ScoringTemplateController.java`, thêm annotation ở class level:
```java
@RestController
@RequestMapping("/api/admin/scoring-templates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")    // <-- THÊM class-level guard
public class ScoringTemplateController {
```

**7.5 — GlobalExceptionHandler: Ẩn internal error details**

File `GlobalExceptionHandler.java`, method `handleGenericException()` dòng 101-111:
```java
// TRƯỚC (BUG): Leak internal details
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
    log.error("Unhandled exception:", ex);
    String detail = ex.getMessage();
    if (ex.getCause() != null) {
        detail = ex.getCause().getMessage();
    }
    return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Internal server error: " + detail));
}

// SAU (FIX):
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
    log.error("Unhandled exception:", ex);
    return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("An unexpected error occurred. Please try again later."));
}
```

---

## TASK 8: Auth Flow Backend Fixes (HIGH)

### Mục tiêu
Fix forgot password flow, race condition duplicate email, password validation.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/auth/service/AuthService.java`
2. `backend/src/main/java/com/sealhackathon/auth/dto/request/RegisterRequest.java`
3. `backend/src/main/java/com/sealhackathon/auth/dto/request/ResetPasswordRequest.java`

### Hướng dẫn cụ thể

**8.1 — forgotPassword: Log thay vì return token (dòng 166-178)**

```java
// TRƯỚC (BUG): Token được return nhưng không gửi email
@Transactional
public String forgotPassword(ForgotPasswordRequest request) {
    UserSnapshot user = userPublicService.findByEmail(request.getEmail())
            .orElse(null);
    if (user == null || user.getStatus() != AccountStatus.ACTIVE) {
        return null;
    }
    return tokenService.createPasswordResetToken(user.getId());
}

// SAU (FIX): Gửi email (hoặc ít nhất log để dev test)
@Transactional
public void forgotPassword(ForgotPasswordRequest request) {
    UserSnapshot user = userPublicService.findByEmail(request.getEmail())
            .orElse(null);

    // Always return success to prevent email enumeration
    if (user == null || user.getStatus() != AccountStatus.ACTIVE) {
        return;
    }

    String token = tokenService.createPasswordResetToken(user.getId());

    // TODO: Inject EmailService và gửi email chứa reset link
    // emailService.sendPasswordResetEmail(user.getEmail(), token);
    log.info("Password reset token for {}: {}", user.getEmail(), token);
}
```
> Cập nhật `AuthController.forgotPassword()` tương ứng (method return void, response luôn success message).

**8.2 — register(): Catch DataIntegrityViolationException cho duplicate email race condition (dòng 58-106)**

Thêm try-catch quanh phần save:
```java
try {
    return userPublicService.createParticipant(
            request.getEmail().trim(),
            passwordHash,
            request.getFullName(),
            // ... other params
    );
} catch (org.springframework.dao.DataIntegrityViolationException e) {
    throw new DuplicateResourceException("Account", "email", request.getEmail());
}
```
> QUAN TRỌNG: Cần đảm bảo DB có UNIQUE constraint trên cột `email` trong bảng users.

**8.3 — Strengthen password validation**

File `RegisterRequest.java`, dòng 25:
```java
// TRƯỚC:
@Size(min = 6)
private String password;

// SAU:
@Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
@Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
         message = "Password must contain at least one uppercase letter, one lowercase letter, and one digit")
private String password;
```

File `ResetPasswordRequest.java`, áp dụng tương tự cho `newPassword` field.

---

## TASK 9: Scoring Window & Lock Logic (HIGH)

### Mục tiêu
Fix lockScoresForRound skip IN_PROGRESS, reopen scoring revert đúng status, remove assignment checks.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/judging/service/JudgingService.java`
2. `backend/src/main/java/com/sealhackathon/judging/listener/JudgingEventListener.java`
3. `backend/src/main/java/com/sealhackathon/event/service/JudgeAssignmentService.java`
4. `backend/src/main/java/com/sealhackathon/judging/service/TeamJudgeAssignmentService.java`

### Hướng dẫn cụ thể

**9.1 — lockScoresForRound: Lock cả IN_PROGRESS scores**

File `JudgingService.java`, method `lockScoresForRound()` dòng 132-136:
```java
// TRƯỚC (BUG): Chỉ lock COMPLETED → IN_PROGRESS vẫn sửa được
@Transactional
public int lockScoresForRound(UUID roundId) {
    return judgeScoreRepository.updateStatusByRoundId(
            roundId, ScoreStatus.COMPLETED, ScoreStatus.LOCKED);
}

// SAU (FIX): Lock cả COMPLETED và IN_PROGRESS
@Transactional
public int lockScoresForRound(UUID roundId) {
    int lockedCompleted = judgeScoreRepository.updateStatusByRoundId(
            roundId, ScoreStatus.COMPLETED, ScoreStatus.LOCKED);
    int lockedInProgress = judgeScoreRepository.updateStatusByRoundId(
            roundId, ScoreStatus.IN_PROGRESS, ScoreStatus.LOCKED);
    return lockedCompleted + lockedInProgress;
}
```

**9.2 — ScoringWindowReopened: Revert về COMPLETED thay vì IN_PROGRESS**

File `JudgingEventListener.java` dòng 17-20:
```java
// TRƯỚC (BUG):
// LOCKED scores revert to IN_PROGRESS → sai, judge đã completed
judgeScoreRepository.updateStatusByRoundId(
    event.roundId(), ScoreStatus.LOCKED, ScoreStatus.IN_PROGRESS);

// SAU (FIX):
judgeScoreRepository.updateStatusByRoundId(
    event.roundId(), ScoreStatus.LOCKED, ScoreStatus.COMPLETED);
```

**9.3 — removeJudgeAssignment: Check existing scores**

File `JudgeAssignmentService.java`, method `removeJudgeAssignment()`:
```java
// Thêm check trước khi xóa:
long scoreCount = judgeScoreRepository.countByRoundIdAndJudgeUserId(roundId, judgeUserId);
if (scoreCount > 0) {
    throw new BusinessException(
            "Cannot remove judge assignment: judge has already submitted scores for this round",
            HttpStatus.BAD_REQUEST) {};
}
```
> Cần inject `JudgeScoreRepository` vào `JudgeAssignmentService`.

**9.4 — removeAssignment (TeamJudgeAssignment): Check existing scores**

File `TeamJudgeAssignmentService.java`, method `removeAssignment()`:
```java
// Thêm check tương tự:
// Trước khi delete assignment, check xem judge đã submit score cho team's submission chưa
boolean hasScores = judgeScoreRepository.existsByJudgeUserIdAndRoundIdAndTeamId(
        assignment.getJudgeUserId(), assignment.getRoundId(), assignment.getTeamId());
if (hasScores) {
    throw new BusinessException(
            "Cannot remove assignment: judge has already submitted scores",
            HttpStatus.BAD_REQUEST) {};
}
```

---

## TASK 10: Miscellaneous HIGH Fixes

### Mục tiêu
Fix các lỗi HIGH còn lại: event judge validation, enrollment, scoring schema FE, CSRF note.

### File cần sửa
1. `backend/src/main/java/com/sealhackathon/event/service/EventJudgeService.java`
2. `backend/src/main/java/com/sealhackathon/team/service/EventEnrollmentService.java`
3. `backend/src/main/java/com/sealhackathon/team/service/AutoMatchService.java`
4. `frontend/src/features/judging/schemas/scoring.schema.ts`

### Hướng dẫn cụ thể

**10.1 — EventJudgeService.seedFromEvent(): Validate judge users**

```java
// TRƯỚC (BUG): Blindly tạo assignment không check user exists/role
public void seedFromEvent(HackathonEvent event, List<UUID> judgeUserIds) {
    if (judgeUserIds == null || judgeUserIds.isEmpty()) return;
    judgeUserIds.forEach(judgeId -> {
        EventJudgeAssignment assignment = EventJudgeAssignment.builder()
                .hackathonEvent(event)
                .judgeUserId(judgeId)
                .assignedAt(LocalDateTime.now())
                .build();
        event.getEventJudgeAssignments().add(assignment);
    });
}

// SAU (FIX):
public void seedFromEvent(HackathonEvent event, List<UUID> judgeUserIds) {
    if (judgeUserIds == null || judgeUserIds.isEmpty()) return;

    // Deduplicate
    Set<UUID> uniqueJudgeIds = new LinkedHashSet<>(judgeUserIds);

    for (UUID judgeId : uniqueJudgeIds) {
        UserSnapshot user = userPublicService.findById(judgeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", judgeId));

        if (user.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "User " + judgeId + " is not a LECTURER and cannot be assigned as judge",
                    HttpStatus.BAD_REQUEST) {};
        }

        EventJudgeAssignment assignment = EventJudgeAssignment.builder()
                .hackathonEvent(event)
                .judgeUserId(judgeId)
                .assignedAt(LocalDateTime.now())
                .build();
        event.getEventJudgeAssignments().add(assignment);
    }
}
```
> Inject `UserPublicService` vào `EventJudgeService`.

**10.2 — EventEnrollmentService: Fix enrollment withdrawal cascade**

Trong method `withdrawEnrollment()`, thêm check:
```java
// Trước khi set status WITHDRAWN:
// Check if user is on a team for this event
Optional<TeamMember> teamMember = teamMemberRepository.findByUserIdAndEventId(userId, eventId);
if (teamMember.isPresent()) {
    throw new BusinessException(
            "Cannot withdraw enrollment while on a team. Leave the team first.",
            HttpStatus.BAD_REQUEST) {};
}
```

**10.3 — AutoMatchService: Đọc team size từ SystemConfig**

```java
// TRƯỚC (BUG) dòng 33-34:
private static final int TARGET_TEAM_SIZE = 4;
private static final int MIN_TEAM_SIZE = 3;

// SAU (FIX): Inject SystemConfigService
private final SystemConfigService systemConfigService;

// Trong method autoMatch():
int targetSize = systemConfigService.getMaxTeamMembers();
int minSize = systemConfigService.getMinTeamMembers();
```

**10.4 — Frontend scoring schema: Remove -1 allowance**

File `frontend/src/features/judging/schemas/scoring.schema.ts` dòng 6:
```typescript
// TRƯỚC (BUG):
score: z.number().min(-1).max(10)

// SAU (FIX):
score: z.number().min(0).max(10)
```

Cập nhật scoring page để dùng `null` hoặc `undefined` thay vì `-1` cho "not scored yet".

---

## THỨ TỰ THỰC HIỆN

```
TASK 1 (Secrets)      → Không phụ thuộc gì, làm đầu tiên
TASK 2 (JWT)          → Sau Task 1 (cần JWT_SECRET externalized)
TASK 3 (WebSocket)    → Sau Task 2 (cần UserPrincipal từ Task 2)
TASK 4 (Scoring)      → Độc lập, có thể song song với Task 2-3
TASK 5 (Frontend)     → Sau Task 2 (cần refresh token API)
TASK 6 (Event SM)     → Độc lập
TASK 7 (Auth Gaps)    → Sau Task 2 (cần UserPrincipal)
TASK 8 (Auth Flow)    → Độc lập
TASK 9 (Lock Logic)   → Sau Task 4
TASK 10 (Misc)        → Độc lập
```

**Song song hóa tốt nhất:**
- Batch 1: Task 1 + Task 6 + Task 8 + Task 10 (hoàn toàn độc lập)
- Batch 2: Task 2 + Task 4 (sau Batch 1)
- Batch 3: Task 3 + Task 5 + Task 7 + Task 9 (sau Batch 2)

---

## KIỂM TRA SAU KHI SỬA

Sau khi sửa xong, cần verify:

1. **Build thành công**: `mvn clean compile` không lỗi
2. **App start**: App phải fail nếu thiếu JWT_SECRET env var
3. **Login flow**: Login → nhận token → gọi API → logout → token bị revoke
4. **Route protection**: Truy cập /admin khi chưa login → redirect /login
5. **WebSocket**: Connect WS không có JWT → bị reject
6. **Scoring**: Submit score với duplicate criteria → bị reject
7. **Event**: Activate CANCELLED event → bị reject
8. **Score delete**: Delete LOCKED score → bị reject
9. **Scoring deadline**: Dùng round.scoringDeadline thay vì hardcode +2h
