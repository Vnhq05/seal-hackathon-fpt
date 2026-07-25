"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { StaffAssignmentNav } from "@/shared/components/staff-assignment-nav";
import { useAdminEvents, useAdminEvent } from "@/features/admin/hooks/use-admin-hackathons";
import { trackApi } from "@/lib/api/track.api";
import { teamApi, type TeamResponse } from "@/lib/api/team.api";
import { trackAssignmentApi } from "@/lib/api/track-assignment.api";
import {
  assignmentApi,
  type GenerateCompetitionGroupsResponse,
} from "@/lib/api/assignment.api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none",
};

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function TeamAssignmentPage({ defaultEventId, embedded }: { defaultEventId?: string; embedded?: boolean } = {}) {
  const userEmail = useAuthStore((s) => s.user?.email);
  const qc = useQueryClient();
  const [eventId, setEventId] = useState(defaultEventId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  /** Local draft: teamId → trackId (empty string = unassigned). */
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftEventId, setDraftEventId] = useState<string>("");
  const [teamsPerGroup, setTeamsPerGroup] = useState(5);
  const [groupPlan, setGroupPlan] = useState<GenerateCompetitionGroupsResponse | null>(null);

  const { data: eventsPage } = useAdminEvents();
  const { data: defaultEvent } = useAdminEvent(defaultEventId ?? "");
  const events = eventsPage?.content ?? [];

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks", eventId, userEmail],
    queryFn: () => trackApi.list(eventId),
    enabled: !!eventId,
  });

  const { data: teamsPage, isLoading } = useQuery({
    queryKey: ["teams", eventId, "assignment", userEmail],
    queryFn: () => teamApi.list(eventId, { page: 0, size: 200 }),
    enabled: !!eventId,
  });

  const teams = useMemo(
    () => (teamsPage?.content ?? []).filter((t) => t.status === "CONFIRMED"),
    [teamsPage],
  );

  const tracksLocked = tracks.length > 0 && tracks.every((t) => t.status === "LOCKED");

  // Seed / resync drafts when event or team list loads (preserve in-progress edits for same event).
  useEffect(() => {
    if (!eventId || !teamsPage) return;
    setDrafts((prev) => {
      if (draftEventId !== eventId) {
        const next: Record<string, string> = {};
        for (const t of teams) next[t.id] = t.trackId ?? "";
        return next;
      }
      const next = { ...prev };
      for (const t of teams) {
        if (!(t.id in next)) next[t.id] = t.trackId ?? "";
      }
      return next;
    });
    if (draftEventId !== eventId) setDraftEventId(eventId);
  }, [eventId, teamsPage, teams, draftEventId]);

  const draftUnassignedCount = teams.filter((t) => !drafts[t.id]).length;
  const allDraftAssigned = teams.length > 0 && draftUnassignedCount === 0;
  const trackDraftCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const track of tracks) counts.set(track.id, 0);
    for (const t of teams) {
      const trackId = drafts[t.id];
      if (!trackId) continue;
      counts.set(trackId, (counts.get(trackId) ?? 0) + 1);
    }
    return tracks.map((track) => ({
      id: track.id,
      name: track.name,
      count: counts.get(track.id) ?? 0,
    }));
  }, [tracks, teams, drafts]);
  const dirtyAssignments = useMemo(
    () =>
      teams
        .filter((t) => {
          const draft = drafts[t.id] ?? "";
          return draft !== "" && draft !== (t.trackId ?? "");
        })
        .map((t) => ({ teamId: t.id, trackId: drafts[t.id] })),
    [teams, drafts],
  );
  const canConfirm = !!eventId && !tracksLocked && allDraftAssigned;
  const allTeamsHaveTrackOnServer = teams.length > 0 && teams.every((t) => !!t.trackId);
  const canGenerateGroups = !!eventId && allTeamsHaveTrackOnServer;

  const groupPreview = useMemo(() => {
    const k = teamsPerGroup;
    if (!canGenerateGroups || !k || k < 1) return [];
    return tracks
      .map((track) => {
        const n = teams.filter((t) => t.trackId === track.id).length;
        if (n === 0) return null;
        const g = Math.max(1, Math.ceil(n / k));
        const base = Math.floor(n / g);
        const remain = n % g;
        const sizes = Array.from({ length: g }, (_, i) => base + (i < remain ? 1 : 0));
        return { trackId: track.id, trackName: track.name, teamCount: n, groupCount: g, sizes };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
  }, [canGenerateGroups, teamsPerGroup, tracks, teams]);

  /** Roster from server team.groupName when page reloads after generate. */
  const rosterFromTeams = useMemo(() => {
    const byTrack = new Map<string, { trackName: string; groups: Map<string, { name: string; teams: string[] }> }>();
    for (const t of teams) {
      if (!t.trackId || !t.groupId || !t.groupName) continue;
      const trackName = tracks.find((tr) => tr.id === t.trackId)?.name ?? "Track";
      if (!byTrack.has(t.trackId)) {
        byTrack.set(t.trackId, { trackName, groups: new Map() });
      }
      const trackEntry = byTrack.get(t.trackId)!;
      if (!trackEntry.groups.has(t.groupId)) {
        trackEntry.groups.set(t.groupId, { name: t.groupName, teams: [] });
      }
      trackEntry.groups.get(t.groupId)!.teams.push(t.name);
    }
    return Array.from(byTrack.entries()).map(([trackId, v]) => ({
      trackId,
      trackName: v.trackName,
      groups: Array.from(v.groups.entries())
        .map(([groupId, g]) => ({
          groupId,
          name: g.name,
          teamCount: g.teams.length,
          teamNames: g.teams.sort((a, b) => a.localeCompare(b)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [teams, tracks]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const toSend = dirtyAssignments;
      if (toSend.length > 0) {
        await trackAssignmentApi.assign(eventId, { assignments: toSend });
      }
      try {
        const lock = await trackAssignmentApi.lockTracks(eventId);
        return { lockedTrackCount: lock.lockedTrackCount, assignedCount: toSend.length, lockSkipped: false as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Assignments may already be on the server; still surface lock failure clearly.
        if (toSend.length > 0) {
          return {
            lockedTrackCount: 0,
            assignedCount: toSend.length,
            lockSkipped: true as const,
            lockError: message,
          };
        }
        // Nothing was saved, so there is no partial success to report.
        throw err;
      }
    },
    onSuccess: (result) => {
      setError(null);
      if (result.lockSkipped) {
        setError(
          `Saved ${result.assignedCount} assignment(s), but tracks were not locked: ${result.lockError}`,
        );
        setSuccessMessage(null);
      } else {
        setSuccessMessage(
          `Track assignment confirmed. ${result.lockedTrackCount} track(s) locked.`,
        );
      }
      qc.invalidateQueries({ queryKey: ["teams", eventId] });
      qc.invalidateQueries({ queryKey: ["tracks", eventId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const generateGroupsMutation = useMutation({
    mutationFn: () =>
      assignmentApi.generateCompetitionGroups(eventId, { teamsPerGroup }),
    onSuccess: (result) => {
      setError(null);
      setGroupPlan(result);
      setSuccessMessage(
        `Created ${result.totalGroupsCreated} group(s) for ${result.totalTeamsAssigned} team(s). Sizes differ by at most 1.`,
      );
      qc.invalidateQueries({ queryKey: ["teams", eventId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleTrackChange = (team: TeamResponse, nextTrackId: string) => {
    if (!eventId || tracksLocked) return;
    setError(null);
    setSuccessMessage(null);
    setDrafts((prev) => ({ ...prev, [team.id]: nextTrackId }));
  };

  const handleRandomDraw = () => {
    if (!eventId || tracksLocked || tracks.length === 0 || teams.length === 0) return;

    const unassignedIds = teams.filter((t) => !drafts[t.id]).map((t) => t.id);
    const redrawAll = unassignedIds.length === 0;

    const confirmMsg = redrawAll
      ? "All teams already have a track in draft. Re-randomize ALL team tracks?"
      : `Randomly assign tracks for ${unassignedIds.length} team(s) that still have no track selected?`;
    if (!confirm(confirmMsg)) return;

    const targetIds = redrawAll ? teams.map((t) => t.id) : unassignedIds;
    const shuffled = shuffleInPlace([...targetIds]);

    // Least-loaded assignment so existing draft picks stay balanced when filling the rest.
    const load = new Map<string, number>();
    for (const track of tracks) load.set(track.id, 0);
    if (!redrawAll) {
      for (const t of teams) {
        const trackId = drafts[t.id];
        if (trackId) load.set(trackId, (load.get(trackId) ?? 0) + 1);
      }
    }

    const pickLeastLoaded = (): string => {
      let bestId = tracks[0].id;
      let bestCount = Number.POSITIVE_INFINITY;
      for (const track of tracks) {
        const count = load.get(track.id) ?? 0;
        if (count < bestCount) {
          bestCount = count;
          bestId = track.id;
        }
      }
      return bestId;
    };

    setDrafts((prev) => {
      const next = redrawAll ? {} as Record<string, string> : { ...prev };
      for (const teamId of shuffled) {
        const trackId = pickLeastLoaded();
        next[teamId] = trackId;
        load.set(trackId, (load.get(trackId) ?? 0) + 1);
      }
      // Keep any teams not in targetIds (shouldn't happen when redrawAll).
      if (!redrawAll) {
        for (const t of teams) {
          if (!(t.id in next)) next[t.id] = prev[t.id] ?? "";
        }
      }
      return next;
    });

    setError(null);
    setSuccessMessage(
      redrawAll
        ? `Re-randomized tracks for ${shuffled.length} team(s). Click Confirm to save.`
        : `Drafted random tracks for ${shuffled.length} team(s). Click Confirm to save.`,
    );
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    const msg =
      `Confirm track assignment for ${teams.length} team(s)?\n\n` +
      "This will save all selections and lock tracks — assignment will be considered complete.";
    if (!confirm(msg)) return;
    setError(null);
    confirmMutation.mutate();
  };

  return (
    <div>
      {!embedded && (
        <>
          <StaffAssignmentNav />
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
              Team Assignments
            </h1>
            <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
              Pick a track per team, then Confirm to save and finalize track assignment.
            </p>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-end gap-3 p-5 mb-4 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex flex-col">
          <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Event</label>
          {defaultEventId ? (
            <span style={{ ...inputStyle, display: "inline-block", backgroundColor: "#f6f7fb" }}>
              {defaultEvent?.name ?? defaultEventId}
            </span>
          ) : (
            <select
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setSuccessMessage(null);
                setError(null);
                setGroupPlan(null);
              }}
              style={inputStyle}
            >
              <option value="">Select event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          type="button"
          onClick={handleRandomDraw}
          disabled={!eventId || tracksLocked || teams.length === 0 || tracks.length === 0 || confirmMutation.isPending}
          className="border-2 border-navy bg-white px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50"
        >
          Random draw
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm || confirmMutation.isPending}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50"
        >
          {confirmMutation.isPending ? "Confirming..." : "Confirm"}
        </button>
      </div>

      {(error || successMessage) && (
        <p style={{ fontSize: 13, color: error ? "#991b1b" : "#166534", marginBottom: 12 }}>
          {error ?? successMessage}
        </p>
      )}

      {tracksLocked && (
        <p style={{ fontSize: 13, color: "#166534", marginBottom: 12, fontWeight: 600 }}>
          Track assignment is complete — tracks are locked.
        </p>
      )}

      <p style={{ fontSize: 13, color: "#8891a5", marginBottom: 8 }}>
        {eventId
          ? `${teams.length} confirmed teams · ${draftUnassignedCount} without track in draft`
          : "Select an event to view teams."}
      </p>

      {eventId && tracks.length > 0 && (
        <div
          className="flex flex-wrap gap-3 mb-4 p-4 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
          style={{ alignItems: "stretch" }}
        >
          <div style={{ minWidth: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#8891a5", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              By track
            </p>
            <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>Draft selection</p>
          </div>
          {trackDraftCounts.map((row) => (
            <div
              key={row.id}
              style={{
                flex: "1 1 140px",
                minWidth: 140,
                padding: "10px 14px",
                backgroundColor: "#f6f7fb",
                border: "1px solid rgba(223,226,236,0.9)",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0e1528" }}>{row.name}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#0e1528", marginTop: 4, fontFamily: "var(--font-mono), monospace" }}>
                {row.count}
                <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginLeft: 6 }}>
                  team{row.count === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          ))}
          {draftUnassignedCount > 0 && (
            <div
              style={{
                flex: "1 1 140px",
                minWidth: 140,
                padding: "10px 14px",
                backgroundColor: "#fff7ed",
                border: "1px solid rgba(180,83,9,0.25)",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 700, color: "#b45309" }}>Unassigned</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#b45309", marginTop: 4, fontFamily: "var(--font-mono), monospace" }}>
                {draftUnassignedCount}
                <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 6 }}>
                  team{draftUnassignedCount === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Team</th>
              <th style={headerCell}>Members</th>
              <th style={headerCell}>Track</th>
              <th style={headerCell}>Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : teams.map((t: TeamResponse) => {
                  const draftTrackId = drafts[t.id] ?? "";
                  return (
                    <tr key={t.id} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                      <td style={{ ...bodyCell, fontWeight: 600 }}>{t.name}</td>
                      <td style={{ ...bodyCell, color: "#8891a5" }}>{t.memberCount}</td>
                      <td style={bodyCell}>
                        <select
                          value={draftTrackId}
                          disabled={!eventId || tracksLocked || tracks.length === 0 || confirmMutation.isPending}
                          onChange={(e) => handleTrackChange(t, e.target.value)}
                          style={{
                            ...inputStyle,
                            minWidth: 220,
                            fontWeight: draftTrackId ? 600 : 400,
                            color: draftTrackId ? "#0e1528" : "#b45309",
                          }}
                        >
                          <option value="">Select track...</option>
                          {tracks.map((track) => (
                            <option key={track.id} value={track.id}>
                              {track.name}
                              {track.topic ? ` — ${track.topic}` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ ...bodyCell, color: t.groupName ? "#0e1528" : "#8891a5" }}>
                        {t.groupName ?? "—"}
                      </td>
                    </tr>
                  );
                })}
            {!isLoading && eventId && teams.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No confirmed teams in this event.
                </td>
              </tr>
            )}
            {!isLoading && !eventId && (
              <tr>
                <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  Select an event to view teams.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canGenerateGroups && (
        <div className="mt-4 p-5 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528", marginBottom: 4 }}>
            Divide into groups
          </h2>
          <p style={{ fontSize: 13, color: "#8891a5", marginBottom: 16 }}>
            Enter target teams per group. The system creates G = ceil(N / K) groups per track and
            balances sizes so they differ by at most 1 (e.g. 7 teams → 4 and 3).
          </p>
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <div className="flex flex-col">
              <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>
                Teams per group (K)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={teamsPerGroup}
                onChange={(e) => setTeamsPerGroup(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{ ...inputStyle, width: 140 }}
                disabled={generateGroupsMutation.isPending}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const lines = groupPreview
                  .map((p) => `${p.trackName}: ${p.teamCount} teams → ${p.groupCount} groups (${p.sizes.join(", ")})`)
                  .join("\n");
                if (!confirm(`Generate competition groups?\n\n${lines}\n\nExisting groups will be replaced.`)) {
                  return;
                }
                setError(null);
                generateGroupsMutation.mutate();
              }}
              disabled={generateGroupsMutation.isPending || teamsPerGroup < 1}
              className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer disabled:opacity-50"
            >
              {generateGroupsMutation.isPending ? "Generating..." : "Generate groups"}
            </button>
          </div>

          {groupPreview.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {groupPreview.map((p) => (
                <div
                  key={p.trackId}
                  style={{
                    flex: "1 1 200px",
                    minWidth: 200,
                    padding: "12px 14px",
                    backgroundColor: "#f6f7fb",
                    border: "1px solid rgba(223,226,236,0.9)",
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0e1528" }}>{p.trackName}</p>
                  <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
                    {p.teamCount} teams → {p.groupCount} groups
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", marginTop: 6, fontFamily: "var(--font-mono), monospace" }}>
                    {p.sizes.map((s, i) => `G${i + 1}: ${s}`).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {(groupPlan || rosterFromTeams.length > 0) && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", marginBottom: 12 }}>
                Group roster
              </p>
              <div className="flex flex-col gap-4">
                {(groupPlan
                  ? groupPlan.tracks.map((t) => ({
                      trackId: t.trackId,
                      trackName: t.trackName,
                      teamCount: t.teamCount,
                      groupCount: t.groupCount,
                      groups: t.groups,
                    }))
                  : rosterFromTeams.map((t) => ({
                      trackId: t.trackId,
                      trackName: t.trackName,
                      teamCount: t.groups.reduce((s, g) => s + g.teamCount, 0),
                      groupCount: t.groups.length,
                      groups: t.groups,
                    }))
                ).map((t) => (
                  <div key={t.trackId}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#0e1528", marginBottom: 8 }}>
                      {t.trackName}
                      <span style={{ fontWeight: 500, color: "#8891a5", marginLeft: 8 }}>
                        {t.teamCount} teams · {t.groupCount} groups
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {t.groups.map((g) => (
                        <div
                          key={g.groupId}
                          style={{
                            flex: "1 1 220px",
                            minWidth: 220,
                            padding: "12px 14px",
                            backgroundColor: "#f0fdf4",
                            border: "1px solid rgba(22,101,52,0.2)",
                          }}
                        >
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                            {g.name}
                            <span style={{ fontWeight: 600, color: "#8891a5", marginLeft: 6 }}>
                              ({g.teamCount})
                            </span>
                          </p>
                          <ul style={{ marginTop: 8, paddingLeft: 18, marginBottom: 0 }}>
                            {(g.teamNames ?? []).map((name) => (
                              <li key={name} style={{ fontSize: 13, color: "#0e1528", lineHeight: "22px" }}>
                                {name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
