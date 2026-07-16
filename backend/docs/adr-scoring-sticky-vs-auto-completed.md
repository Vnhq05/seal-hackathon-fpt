# ADR: SCORING sticky vs auto-COMPLETED

**Status:** Proposed (not implemented in this IT-fixture pass)

## Problem

`EventStatusResolver` treats persisted `SCORING` as a **hard sticky override**: once an event is in
`SCORING`, the resolver returns `SCORING` even when `today` is after `endDate`. Date-based
auto-`COMPLETED` never runs while sticky `SCORING` remains.

That interacts with phase rules:

- `FormatRuleEngine.canScore` allows scoring only in `SCORING` (product decision: keep code, not
  `ACTIVE || SCORING`).
- Coordinators must manually transition to `COMPLETED` (or another status) after judging; otherwise
  the event stays in scoring forever from the API’s point of view.

This may be intentional (manual lifecycle control) or an oversight relative to date-driven status.

## Recommendation

After product confirms the desired lifecycle:

- **Option A — Manual sticky (document as intentional):** require explicit
  `PATCH .../status → COMPLETED` after scoring; keep resolver sticky; document in Event Status API.
- **Option B — Conditional sticky:** keep `SCORING` sticky only while `today <= endDate` (or while
  any round `scoringDeadline` is in the future); otherwise resolve to `COMPLETED`.
- **Option C — Separate flags:** e.g. `judgingOpen` boolean independent of calendar status, so
  `COMPLETED` can coexist with late score review.

Do not silently change sticky behaviour without FE/BTC workflow review.

## Rejected alternatives

- Auto-complete on `endDate` while also allowing `ACTIVE` scoring — conflicts with current
  `canScore == SCORING` rule.
- Remove sticky entirely and derive scoring only from round deadlines — larger blast radius on
  status transitions and FE phase gates.
