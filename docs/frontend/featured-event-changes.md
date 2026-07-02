# Featured Event — Changes Report

Commit: `6543adb` — `feat(landing): show real OPEN events in Featured Event section`

## Files touched (Featured Event only)

| File | Change |
|------|--------|
| `frontend/src/features/landing/components/featured-event.tsx` | Map N OPEN event cards from API; hide section when loading/error/empty |
| `frontend/src/features/landing/hooks/use-featured-open-events.ts` | **New** — fetch `listActiveEvents`, client-side `status === "OPEN"` filter |
| `frontend/src/features/landing/utils/featured-event.utils.ts` | **New** — `displayOrUpdating`, date/location/prize formatters |
| `frontend/src/lib/landing-data.ts` | Remove `FEATURED_EVENT` / `LandingEvent` |
| `frontend/src/features/landing/hooks/use-featured-seal-event.ts` | **Deleted** |

## Read-only dependency (no diff in this commit)

`featured-event.utils.ts` imports `formatEventDate` and `formatFormatLabel` from `event-landing.utils.ts`. No changes to that utility file were required for Featured Event.

## Explicitly NOT in this task (separate commits)

| File | Commit | Reason |
|------|--------|--------|
| `frontend/src/features/events/components/event-landing-page.tsx` | `d9e5369`, `1f277bf` | Semester hero display + free-text prize rendering — unrelated to landing Featured Event section |
| `frontend/src/features/events/utils/event-landing.utils.ts` | `d9e5369` | `formatSemesterRange` signature changed to accept raw semester numbers from System Config |

## Follow-up tech debt

Backend `EventService.listPublicEvents` accepts a `status` parameter but does not filter by it. The hook documents this and filters `status === "OPEN"` client-side until server-side filtering is wired up.

## Verification

```powershell
rg "formatSemesterRange" frontend/src
# Expected: definition in event-landing.utils.ts; call in event-landing-page.tsx with systemConfig args

cd frontend
npx tsc --noEmit
npm run lint
```
