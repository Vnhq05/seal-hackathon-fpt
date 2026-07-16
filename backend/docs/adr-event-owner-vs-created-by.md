# ADR: Event business owner vs audit created_by

**Status:** Proposed (not implemented in this IT-fixture pass)

## Problem

`hackathon_events.created_by` (inherited from `BaseEntity`) is used for **two roles**:

1. **JPA audit** — `@CreatedBy` + `AuditorAware` (writes `"system"` when no SecurityContext, or the
   authenticated principal email on insert). Column is `updatable = false`.
2. **Business ownership** — `EventOwnershipGuard` authorizes coordinators with
   `currentEmail.equals(event.getCreatedBy())`. `EventService.applyCoordinatorOwner` also writes this
   field before save.

Those owners fight over one column:

- Fixtures that `setCreatedBy(coord)` after `save` cannot persist (immutable column).
- Fixtures that `setCreatedBy` before `save` are overwritten by AuditorAware (`"system"`).
- Admin create with `coordinatorEmail` may be overwritten by the admin auditor on insert.
- Access control then fails with 403 even when the test (or product) intended a coordinator owner.

IT failures on progress/feedback ownership were the first symptom; the dual-use design is a latent
production bug.

## Recommendation

- Introduce an explicit business owner field (e.g. `owner_email` / `owner_user_id`) used only by
  `EventOwnershipGuard` and list-by-owner queries.
- Keep `created_by` as immutable audit only; stop calling `setCreatedBy` for ownership.
- Migrate existing rows: copy current `created_by` into the owner column where it holds a real user
  email (not `"system"`).
- Until then, production assign-owner paths that must fix ownership after insert should use an
  explicit JPQL/`UPDATE` (as `reassignOwnership` does for tests) — not entity `setCreatedBy`.

## Rejected alternatives

- Drop ownership checks — insecure.
- Make `created_by` updatable and disable `@CreatedBy` on events only — still conflates audit with ACL.
- Rely on AuditorAware alone for ownership — breaks admin-assign-to-coordinator and unauthenticated seeds.
