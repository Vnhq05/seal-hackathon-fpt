# ADR: teams.leader_id vs team_members.role=LEADER

**Status:** Proposed (not implemented in this hardening pass)

## Problem

Two sources of truth exist for "who leads a team":

1. `teams.leader_id` (denormalized UUID, used for fast lookups)
2. `team_members.role = 'LEADER'` (protected by filtered unique `uq_team_members_one_leader`)

Nothing in the database today forces them to match. A buggy service path can leave
`leader_id` pointing at a non-leader (or a non-member).

## Recommendation

- **Source of truth:** `team_members.role = 'LEADER'` (already race-safe via filtered unique).
- **Keep** `teams.leader_id` as a denormalized cache for query convenience.
- **Enforce** with a SQL Server trigger `AFTER INSERT/UPDATE/DELETE` on `team_members`:
  when the LEADER row for a `team_id` changes, `UPDATE teams SET leader_id = <leader user_id>`.
- Service layer should write LEADER membership first; optionally sync `leader_id` in the same
  transaction as defense in depth.
- Do **not** drop `leader_id` until all read paths are migrated off it.

## Rejected alternatives

- Drop `leader_id` immediately — large blast radius on Team queries / DTOs.
- CHECK constraint alone — cannot express "equals join of child row" cleanly without trigger.
