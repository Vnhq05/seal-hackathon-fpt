"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { eventApi, teamApi, trackApi } from "@/lib/api";
import { useTeamJudgeAssignments, useAssignJudgeToTeam, useRemoveTeamJudge } from "@/features/admin/hooks/use-team-judge-assignments";
import type { TeamResponse } from "@/lib/api";
import type { TrackResponse, EventResponse } from "@/lib/api";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", padding: "14px 16px",
};

function TeamJudgeRow({ eventId, roundId, team }: { eventId: string; roundId: string; team: TeamResponse }) {
  const { data: assignments = [] } = useTeamJudgeAssignments(eventId, roundId, team.id);
  const { mutate: assign, isPending: assigning } = useAssignJudgeToTeam(eventId, roundId, team.id);
  const { mutate: remove } = useRemoveTeamJudge(eventId, roundId, team.id);
  const [judgeId, setJudgeId] = useState("");

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{team.name}</td>
      <td style={bodyCell}>{team.memberCount} members</td>
      <td style={bodyCell}>
        <div className="flex flex-col gap-1">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <span style={{ fontSize: 13 }}>{a.judgeFullName}</span>
              <button
                onClick={() => remove(a.id)}
                style={{ fontSize: 11, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
              >
                x
              </button>
            </div>
          ))}
          {assignments.length < 3 && (
            <div className="flex gap-1" style={{ marginTop: 4 }}>
              <input
                value={judgeId}
                onChange={(e) => setJudgeId(e.target.value)}
                style={{ border: "1px solid rgba(223,226,236,0.8)", borderRadius: 4, padding: "4px 8px", fontSize: 12, width: 200 }}
                placeholder="Judge User ID"
              />
              <button
                onClick={() => { if (judgeId) { assign(judgeId); setJudgeId(""); } }}
                disabled={assigning}
                style={{ fontSize: 11, fontWeight: 600, color: "#0284c7", background: "none", border: "none", cursor: "pointer" }}
              >
                Assign
              </button>
            </div>
          )}
        </div>
      </td>
      <td style={bodyCell}>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
          backgroundColor: assignments.length >= 3 ? "#d1fae5" : "#fef3c7",
          color: assignments.length >= 3 ? "#065f46" : "#92400e",
        }}>
          {assignments.length}/3
        </span>
      </td>
    </tr>
  );
}

export function TeamJudgeAssignmentPage() {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");

  const { data: eventsPage } = useQuery({
    queryKey: ["events-for-assignment"],
    queryFn: () => eventApi.list({ status: "ACTIVE" }),
  });
  const events = eventsPage?.content ?? [];

  const selectedEvent = events.find((e: EventResponse) => e.id === selectedEventId);

  const { data: tracks = [] } = useQuery({
    queryKey: ["tracks-for-assignment", selectedEventId],
    queryFn: () => trackApi.list(selectedEventId),
    enabled: !!selectedEventId,
  });

  const { data: teamsPage } = useQuery({
    queryKey: ["teams-for-assignment", selectedEventId],
    queryFn: () => teamApi.list(selectedEventId),
    enabled: !!selectedEventId,
  });
  const allTeams: TeamResponse[] = (teamsPage as unknown as TeamResponse[]) ?? [];
  const filteredTeams = selectedTrackId
    ? allTeams.filter((t: TeamResponse) => t.trackId === selectedTrackId)
    : allTeams;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", marginBottom: 8 }}>Judge-to-Team Assignment</h1>
      <p style={{ fontSize: 14, color: "#8891a5", marginBottom: 24 }}>Assign 3 judges per team per round. Mentor conflicts are blocked by the server.</p>

      <div className="flex gap-4" style={{ marginBottom: 24 }}>
        <select
          value={selectedEventId}
          onChange={(e) => { setSelectedEventId(e.target.value); setSelectedRoundId(""); setSelectedTrackId(""); }}
          style={{ border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "10px 14px", fontSize: 14, minWidth: 240 }}
        >
          <option value="">Select event...</option>
          {events.map((e: EventResponse) => (
            <option key={e.id} value={e.id}>{e.name} ({e.season} {e.year})</option>
          ))}
        </select>

        {selectedEvent && (
          <select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            style={{ border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "10px 14px", fontSize: 14, minWidth: 200 }}
          >
            <option value="">Select round...</option>
            {/* Rounds will be fetched separately when full round API is used */}
          </select>
        )}

        {tracks.length > 0 && (
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            style={{ border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "10px 14px", fontSize: 14, minWidth: 180 }}
          >
            <option value="">All tracks</option>
            {(tracks as TrackResponse[]).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {selectedEventId && selectedRoundId && (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eef0f6" }}>
                <th style={headerCell}>Team</th>
                <th style={{ ...headerCell, width: 120 }}>Size</th>
                <th style={headerCell}>Assigned Judges</th>
                <th style={{ ...headerCell, width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team: TeamResponse) => (
                <TeamJudgeRow key={team.id} eventId={selectedEventId} roundId={selectedRoundId} team={team} />
              ))}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                    No teams found. Select an event and round first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedEventId && !selectedRoundId && (
        <div style={{ textAlign: "center", padding: 48, color: "#8891a5" }}>
          Please select a round to view teams.
        </div>
      )}
    </div>
  );
}
