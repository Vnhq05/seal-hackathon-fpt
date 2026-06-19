"use client";

import { useState } from "react";
import { usePromotionRounds, usePromotableTeams, usePromoteTeams } from "@/features/staff/hooks/use-staff-promotions";
import type { PromotableTeam } from "@/features/staff/types/staff.types";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px",
  lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", borderRadius: 12,
  boxShadow: "0px 1px 1px rgba(0,0,0,0.05)",
};

function RowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} />
        </td>
      ))}
    </tr>
  );
}

function TeamRow({
  team, isSelected, onToggle,
}: { team: PromotableTeam; isSelected: boolean; onToggle: (teamId: string) => void }) {
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={bodyCell}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(team.teamId)}
          disabled={!team.eligible}
          style={{ width: 16, height: 16, accentColor: "#38bdf8" }}
        />
      </td>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{team.teamName}</td>
      <td style={bodyCell}>
        <span className="rounded-md px-2 py-1" style={{ fontSize: 12, fontWeight: 600, backgroundColor: "#f0fdf4", color: "#166534" }}>
          {team.score}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{team.currentRound}</td>
      <td style={bodyCell}>
        <span
          className="rounded-md px-2 py-1"
          style={{
            fontSize: 12, fontWeight: 600,
            backgroundColor: team.eligible ? "#ecfdf5" : "#dfe2ec",
            color: team.eligible ? "#047857" : "#2dd4bf",
          }}
        >
          {team.eligible ? "Eligible" : "Not Eligible"}
        </span>
      </td>
    </tr>
  );
}

export function PromotionManagementPage() {
  const { data: rounds, isLoading: roundsLoading } = usePromotionRounds();
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const { data: teams, isLoading: teamsLoading } = usePromotableTeams(selectedRound);
  const { mutate: promote, isPending } = usePromoteTeams();

  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

  const toggleTeam = (teamId: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const selectAll = () => {
    if (!teams) return;
    const eligible = teams.filter((t) => t.eligible).map((t) => t.teamId);
    setSelectedTeams((prev) => {
      if (prev.size === eligible.length) return new Set();
      return new Set(eligible);
    });
  };

  const handlePromote = () => {
    if (!selectedRound || selectedTeams.size === 0) return;
    promote(
      { roundId: selectedRound, teamIds: Array.from(selectedTeams) },
      { onSuccess: () => setSelectedTeams(new Set()) },
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Promotion Management
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Promote eligible teams to the next round.
        </p>
      </div>

      {/* Round selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.24px", marginBottom: 6, display: "block" }}>
          Select Round
        </label>
        <select
          value={selectedRound ?? ""}
          onChange={(e) => { setSelectedRound(e.target.value || null); setSelectedTeams(new Set()); }}
          className="rounded-lg"
          style={{ width: 320, padding: "8px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)", outline: "none", color: "#0e1528", backgroundColor: "#ffffff" }}
        >
          <option value="">Choose a round...</option>
          {roundsLoading ? (
            <option disabled>Loading...</option>
          ) : (
            rounds?.map((r) => (
              <option key={r.id} value={r.id}>{r.name} — {r.hackathonName}</option>
            ))
          )}
        </select>
      </div>

      {selectedRound && (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: "#8891a5" }}>
              {selectedTeams.size} team{selectedTeams.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={selectAll}
                className="rounded-md px-3 py-1"
                style={{ fontSize: 12, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", backgroundColor: "#ffffff", color: "#0e1528", cursor: "pointer" }}
              >
                {selectedTeams.size === (teams?.filter((t) => t.eligible).length ?? 0) ? "Deselect All" : "Select All Eligible"}
              </button>
              <button
                onClick={handlePromote}
                disabled={selectedTeams.size === 0 || isPending}
                className="rounded-lg"
                style={{
                  padding: "8px 20px", fontSize: 14, fontWeight: 600,
                  backgroundColor: selectedTeams.size === 0 ? "#dfe2ec" : "#38bdf8",
                  color: selectedTeams.size === 0 ? "#2dd4bf" : "#ffffff",
                  border: "none", cursor: selectedTeams.size === 0 ? "default" : "pointer",
                }}
              >
                {isPending ? "Promoting..." : `Promote ${selectedTeams.size} Team${selectedTeams.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>

          {/* Table */}
          {!teamsLoading && (!teams || teams.length === 0) ? (
            <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>No teams for this round</p>
              <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>Try selecting a different round.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg" style={{ ...cardStyle }}>
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#eef0f6" }}>
                    <th style={{ ...headerCell, width: 48 }}></th>
                    <th style={headerCell}>Team</th>
                    <th style={{ ...headerCell, width: 80 }}>Score</th>
                    <th style={headerCell}>Current Round</th>
                    <th style={{ ...headerCell, width: 120 }}>Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsLoading
                    ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                    : teams?.map((t) => (
                        <TeamRow key={t.teamId} team={t} isSelected={selectedTeams.has(t.teamId)} onToggle={toggleTeam} />
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!selectedRound && (
        <div className="flex flex-col items-center justify-center rounded-lg py-16 text-center" style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>Select a round</p>
          <p className="mt-1" style={{ fontSize: 14, color: "#8891a5" }}>Choose a round above to view eligible teams for promotion.</p>
        </div>
      )}
    </div>
  );
}
