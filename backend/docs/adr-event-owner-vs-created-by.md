# ADR: Event business owner vs audit created_by

**Status:** Accepted — 2026-07-16. Supersedes the earlier Proposed draft.

## Problem

`hackathon_events.created_by` (inherited from `BaseEntity`) carries **two unrelated roles**:

1. **JPA audit** — `@CreatedBy` + `AuditorAware`, written on insert, column is `updatable = false`.
2. **Business ownership** — the input to every coordinator authorization decision on events.

`HackathonEvent` declares no owner column of its own. All ownership rides the audit column.

The two roles cannot both win. `AuditorAware` writes the *authenticated* principal on insert, so when
an admin creates an event on a coordinator's behalf, `applyCoordinatorOwner`'s value is overwritten by
the admin's email; and because the column is `updatable = false`, nothing can correct it afterwards
through the entity. The result is an access-control decision derived from a field the ownership code
cannot actually write.

This is not only a test artifact. It is a live defect on the admin-creates-for-coordinator path:
the coordinator is locked out of the event they were assigned (403 from the guard, and the event is
missing from their list), and no error is raised at creation time.

## Call sites (verified 2026-07-16)

**Writes**

| Site | Behaviour |
|---|---|
| `JpaAuditingConfig:18` (`AuditorAware`) | Sets `created_by` on INSERT — `"system"` when unauthenticated, else principal email. Always wins. |
| `EventService.applyCoordinatorOwner:606` | `setCreatedBy(owner.getEmail())` before save. **Never survives** — overwritten by the auditor. Effectively dead code. |
| `HackathonEventRepository.reassignOwnership:61` | JPQL bulk `UPDATE`; the only write that lands, because it bypasses `updatable = false`. **Has no production caller** — it exists solely so `BaseIntegrationTest.assignEventOwner` can work around this bug. |

**Reads**

| Site | Role |
|---|---|
| `EventOwnershipGuard:26` | `currentEmail.equals(event.getCreatedBy())` — the authorization gate. Security-critical. |
| `HackathonEventRepository:44-48`, called from `EventService:542,557` | Coordinator's "my events" list. Also an ACL boundary, not a convenience filter. |
| `NotificationEventListener:298` (`resolveCoordinatorId`) | Routes coordinator notifications via `findByEmail(created_by)`. |
| `EventService:185` | `EventCreatedEvent(..., coordinatorId)` — the record field is named `coordinatorId` but carries an email string. |

Ownership can only ever be set at creation, via `CreateEventRequest.coordinatorEmail`. There is **no
reassign-owner path in production** at all.

## Decision

Add `hackathon_events.owner_user_id UNIQUEIDENTIFIER NULL`. `EventOwnershipGuard` and the
"my events" query read it. `created_by` reverts to audit-only, matching every other `BaseEntity`
subclass.

Three reasons beyond making the failing test pass:

1. **Audit and ACL cannot share an immutable column.** Any fix that keeps both roles on `created_by`
   is a truce, not a resolution — the next `AuditorAware` change silently re-breaks authorization.
2. **`created_by` is an email — a mutable natural key.** A user changing their email today silently
   orphans or transfers event ownership, with no FK and no audit of the transfer. `owner_user_id` is
   stable and joinable.
3. **`resolveCoordinatorId` is already dead for `"system"`-owned rows**: `findByEmail("system")`
   returns empty, `notify()` sees an empty recipient list and logs at debug. This was invisible while
   AFTER_COMMIT listeners persisted nothing; since `7afc1c8` those notifications are actually written,
   so the gap is now reachable. `owner_user_id` removes the email round-trip entirely.

`NULL` owner fails closed: the guard already 403s a non-admin whose identity does not match, and
admins bypass the guard, so unowned events remain admin-manageable. That is the correct default for
rows we cannot confidently attribute.

## Migration and backfill

Next free version is **V7** (V0–V6 are taken).

```sql
ALTER TABLE hackathon_events ADD owner_user_id UNIQUEIDENTIFIER NULL;
GO

UPDATE e
SET e.owner_user_id = u.id
FROM hackathon_events e
JOIN users u ON u.email = e.created_by
WHERE e.created_by IS NOT NULL
  AND e.created_by <> 'system';
```

- **Not `NOT NULL`.** Rows created unauthenticated (`"system"`), or by a user whose email has since
  changed or been removed, genuinely have no attributable owner. Forcing a value there would mean
  inventing one.
- **No FK in this migration.** Whether `owner_user_id` references `users` is an FK-policy question
  (backlog E4) that must classify cross-module references first. Deferred deliberately, not forgotten.
- **Idempotent** — safe to re-run; the `UPDATE` is a no-op once applied.
- **Non-destructive.** `created_by` is not read, rewritten, or dropped, so the existing audit history
  survives the cutover intact. This migration only adds.
- Run V7 **before** the SEAL cutover so the backfill sees the current `users` table.

## Consequences

- `EventOwnershipGuard` compares UUIDs instead of emails.
- `findByCreatedByAndFilters` → `findByOwnerUserIdAndFilters`.
- `applyCoordinatorOwner` writes a plain mutable field before save; no auditor conflict, no bulk
  `UPDATE`, no stale entity.
- `reassignOwnership` retargets `owner_user_id` and takes a user id. `BaseIntegrationTest.assignEventOwner`
  keeps working, but stops being a workaround for a production bug and becomes an ordinary fixture.
- `EventCreatedEvent.coordinatorId` can finally hold an id rather than an email in a field named `...Id`.
- Events with a `NULL` owner are admin-only until reassigned — and **there is no reassign endpoint**.
  That gap predates this ADR; it becomes visible once ownership is a real field. Adding an admin
  "assign owner" path is follow-up work, not part of this decision.

## Rejected alternatives

1. **Fix `applyCoordinatorOwner` to call `reassignOwnership` after insert.** Cheapest option: one file,
   no migration, and the failing test goes green. Rejected because it makes the symptom disappear while
   deepening the flaw — `created_by` would then durably mean "owner", destroying the record of who
   actually created the event, and ownership would stay keyed on a mutable email. It also reads badly:
   a bulk `UPDATE` leaves the in-memory entity stale, so `toResponse(saved)` would return the
   pre-update value in the same request.
2. **Drop `@CreatedBy` / remove `created_by` from `AuditorAware`.** Rejected: `BaseEntity` is a shared
   `@MappedSuperclass`, so this strips `created_by` from *every* entity, not just events — and it leaves
   coordinator-created events with no owner at all, since nothing else sets the field.
3. **Make `created_by` updatable and keep both roles on it.** Rejected: one column, two meanings. The
   conflict is the design, not the `updatable` flag.
4. **Drop ownership checks.** Rejected: insecure.
