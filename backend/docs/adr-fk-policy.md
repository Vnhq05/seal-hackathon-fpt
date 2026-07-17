# ADR: Foreign key policy for cross-module references

**Status:** Accepted — 2026-07-16. Policy only; no migration in this pass.

## Problem

V0 declares 59 tables and 26 foreign keys. **33 tables carry no foreign key at all**, including
`rankings`, `submissions`, `judge_scores`, `disputes`, `audit_logs`, `event_enrollments`,
`participation_certificates` and `team_awards`. As a bare number that reads like neglect.

It mostly is not. But the reason it is not is different from the reason usually given, and the
exceptions are the point of this ADR.

## What the schema actually says

Every one of the 26 foreign keys exists because the entity declares a JPA association
(`@ManyToOne` / `@OneToOne`) — most still carry Hibernate-generated names (`FK<hash>`). Every table
without one models its parent as a plain `UUID` field.

So the FK boundary in this schema is **not the module boundary. It is the mapping-style boundary.**
A table loses its FK the moment someone writes `UUID eventId` instead of `@ManyToOne HackathonEvent`
— whether or not the reference actually crosses a module.

That distinction splits the 33 into two populations with opposite verdicts. Treating them as one
list is what makes the number look alarming.

## Classification

### (a) Same module, no FK — accidental, and it leaks

| Table | Module | Parent | Cascaded by JPA? |
|---|---|---|---|
| `event_schedules` | `event` | `hackathon_events` | No |
| `allowed_email_domains` | `event` | `hackathon_events` | No |
| `track_draw_sessions` | `event` | `hackathon_events` | No |

These sit in the same module as their parent and carry `event_id`. Nothing about Modulith requires
them to be FK-less; they were mapped by id as a style choice.

This is not theoretical. `EventService.deleteEvent` (line 268) **hard-deletes** a `HackathonEvent`
— it is blocked only for `ACTIVE` and `COMPLETED`, so `DRAFT` / `UPCOMING` / `CANCELLED` events are
deletable. `HackathonEvent` cascades `rounds`, `tracks`, `prizes`, `mentorAssignments`,
`eventJudgeAssignments` and `honoredGuests`, all of which have real FKs and are removed with it.
The three tables above are in neither list: no association to cascade them, no FK to stop the
delete. They are silently orphaned. `db/archive/purge_demo_data.sql` exists because orphans of this
shape are already a known fact of the database.

**Verdict: these get FKs.** Same aggregate, same module, no reason not to.

### (b) Cross-module, no FK — deliberate

`event_enrollments` (team → event),
`finalist_selections` and `advancements` (ranking → team/round), `judge_scores` (judging →
user/submission/round), `submissions` (submission → team/round), `rankings` (ranking → team/round),
`team_awards`, `participation_certificates`, `participant_feedbacks`, `mentor_feedbacks`,
`mentor_chat_messages`, `disputes`, `score_review_requests`, `published_results`,
`team_progress_alerts`, and `hackathon_events.owner_user_id` (added in V7, deferred to this ADR).

An FK here would weld two Modulith modules together in the database, which is the coupling the
module boundary exists to prevent: it would make one module's delete order a hard dependency of
another's, and `@Modulithic` verification would still pass while the schema quietly said otherwise.

**Verdict: no FKs.** But see "The gap this ADR does not close" — the absence has to be paid for
somewhere, and today it is not.

### (c) No FK for a stated reason

- **`audit_logs.actor_id` → `users`** — correct as is, and must stay that way. BR-54 makes the log
  append-only. `RESTRICT` would let an unremovable audit row block user deletion; `CASCADE` would
  erase the evidence trail exactly when it matters most. Audit has to outlive its actor.
- **`refresh_tokens`, `password_reset_tokens`, `email_otp_tokens`, `event_magic_tokens` → `users`**
  — no FK, but users are retired via `AccountStatus.DELETED` rather than a row delete, so there is
  no delete for an FK to police. Reachable only if hard user deletion is ever added.
- **`users`, `hackathon_events`, `teams`, `notifications`, `system_config`, `scoring_templates`,
  `event_publication`** — aggregate roots (or global config) with no parent to reference.
  `scoring_templates` and `event_publication` carry no `event_id` at all.
- **`sysdiagrams`** — SQL Server internal. Not ours.

## Decision

1. **Within a module, a parent reference must have an FK.** If the reference deserves to be
   modelled as an association, model it as one and take the FK that comes with it.
2. **Across modules, no FK.** Reference by id. The module boundary is the reason, and it is the only
   acceptable reason — "we mapped it as a UUID" is not.
3. **Rule (2) is a debt, not a free pass.** A cross-module reference without an FK must name the
   mechanism that replaces it. Deleting the parent without one is how `purge_demo_data.sql` came to
   exist.

## The gap this ADR does not close

The backlog's real complaint — "deleting a team orphans `submissions` / `rankings`" — is *not* fixed
by adding FKs, because rule (2) just forbade them there. It needs a deletion protocol: the owning
module publishes a deletion event and each dependent module removes or tombstones its own rows.
That is real work and it is not decided here.

What is decided: **`deleteEvent` hard-deleting an aggregate root that three same-module tables and
an unknown number of cross-module tables point at, with nothing cleaning up after it, is a bug** —
independent of FK policy. Fixing category (a) narrows it; it does not close it.

Follow-up, in order:
1. Migration adding FKs for category (a) — three tables. Small, mechanical.
2. Orphan-detection query as a scheduled check, so the debt in rule (2) is at least visible.
3. Decide the deletion protocol for cross-module dependents, or forbid hard-deleting aggregate
   roots outright and soft-delete them the way users already are.

## Rejected alternatives

1. **Add FKs everywhere.** Rejected: it would couple the modules in the database while the code
   pretends they are independent, and it inverts the audit requirement in (c).
2. **Leave category (a) alone for consistency with (b).** Rejected: it is consistency with an
   accident. These three are same-module references that lose data on a delete that already ships.
3. **Drop the module boundary and treat the schema as one graph.** Rejected: that is a different
   architecture, not an FK policy.
