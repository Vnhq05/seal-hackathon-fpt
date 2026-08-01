# Final round / auto-advance — changed files

Feature: Final uses previous-round submission; Final = latest `endDate`; auto advance N from config (per group when groups exist); hide Top N on round form; judge Final only sees selected finalists.

## Backend (new)

| File | Role |
|------|------|
| `backend/src/main/java/com/sealhackathon/ranking/service/AdvancementCutoffCalculator.java` | `N = clamp(ceil(T * ratio), min, max)` |
| `backend/src/main/java/com/sealhackathon/submission/service/FinalSubmissionCarryOverService.java` | Copy prelim submission → Final |
| `backend/src/test/java/com/sealhackathon/ranking/service/AdvancementCutoffCalculatorTest.java` | Unit tests |

## Backend (modified)

| File | Role |
|------|------|
| `.../event/domain/enums/AdvancementRule.java` | + `PER_GROUP_TOP_N` |
| `.../event/dto/request/CreateRoundRequest.java` | `advancementCutoff` optional |
| `.../event/service/RoundService.java` | Reconcile Final by latest `endDate` |
| `.../event/service/EventService.java` | Reconcile after SEAL create |
| `.../ranking/domain/enums/ContestedSlotType.java` | + `PER_GROUP_CUTOFF` |
| `.../ranking/domain/enums/FinalistSelectionMethod.java` | + `TOP_PER_GROUP` |
| `.../ranking/service/AdvancementService.java` | Auto N + per-group advance |
| `.../ranking/service/FinalistSelectionService.java` | Per-group finalists + carry-over |
| `.../submission/service/SubmissionService.java` | Block new submit on Final |
| `.../judging/service/JudgingService.java` | Final: only finalists; lazy carry-over for finalists only; round shell when Final empty; block score for eliminated |
| `backend/src/main/resources/application.yml` | Advancement config |
| `backend/src/main/resources/application.properties` | Same keys |
| `.../judging/service/JudgingServiceTest.java` | Finalist filter + empty Final shell tests |
| `.../ranking/service/AdvancementServiceTest.java` | Mock calculator |

## Frontend (modified)

| File | Role |
|------|------|
| `frontend/src/features/admin/components/event-edit/tabs/add-rounds-tab.tsx` | Hide Top N; note auto Final |
| `frontend/src/lib/api/round.api.ts` | + `PER_GROUP_TOP_N` |
| `frontend/src/lib/api/round.utils.ts` | Labels for auto / Final |
| `frontend/src/features/livescore/components/livescore-list-page.tsx` | List Active + Scoring + Registration Closed (QA event visible) |
| `frontend/src/features/judging/hooks/use-assigned-rounds.ts` | Count only rows with `teamId` (ignore Final shell) |
| `frontend/src/features/judging/hooks/use-judge-dashboard.ts` | Same `teamId` filter for round cards |

## QA seed / docs

| File | Role |
|------|------|
| `backend/src/main/resources/db/archive/seed_final_advancement_qa.sql` | Event ready: prelim scored + rankings → Select Finalists → score Final |
| `backend/src/main/resources/db/archive/FINAL_ADVANCEMENT_CHANGES.md` | This checklist |
| `backend/src/main/resources/db/archive/README.md` | Points to seed + this doc |

### Hidden config (`application.yml`)

```yaml
app.hackathon.advancement.auto: true
app.hackathon.advancement.ratio: 0.25
app.hackathon.advancement.min-per-bucket: 1
app.hackathon.advancement.max-per-bucket: 10
```

## Follow-up fixes (ops / QA)

| Issue | Fix |
|-------|-----|
| Event Management trống | Restart BE after adding `PER_GROUP_TOP_N` (old process missing enum) |
| LiveScore không thấy demo (`SCORING`) | List statuses: `CLOSED_REGISTRATION`, `ACTIVE`, `SCORING` |
| Judge Final thấy 4 team (kể cả bị loại) | `JudgingService.filterTeamsForRound` → chỉ `finalist_selections` |
| Assigned Rounds mất card Final | Round shell khi Final chưa có / 0 finalist; FE không đếm shell vào total |
| LiveScore tab Finals = 0 team | Bình thường trước khi chấm Final: rankings Final chưa có. Chọn finalist ở tab Preliminary → judge chấm Final → rồi mới có ranking Final |

## QA flow (event `SEAL Final Advancement QA`)

1. Admin → LiveScore → chọn event (status Scoring) → tab **Preliminary** → **Auto-Select Finalists** (thường Team 01 + 03).
2. Judge `score.judge1@fpt.edu.vn` / `Demo@123456` → Assigned Rounds → **Finals** → chỉ finalist.
3. Chấm xong → LiveScore tab Finals mới có rankings.
