"use client";

import { useMemo, useState } from "react";
import { useLecturerOptions } from "@/features/admin/hooks/use-lecturer-options";
import {
  useAssignEventJudge,
  useAssignEventMentor,
  useEventStaffJudges,
  useEventStaffMentors,
  useRemoveEventJudge,
  useRemoveEventMentor,
} from "@/features/admin/hooks/use-admin-assignments";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "11px 16px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0e1528",
  marginBottom: 4,
  display: "block",
};

const headerCell: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#8891a5",
  letterSpacing: "0.24px",
  padding: "12px 16px",
  textAlign: "left",
};

const bodyCell: React.CSSProperties = {
  fontSize: 14,
  color: "#0e1528",
  padding: "14px 16px",
};

function EventStaffPanel({
  eventId,
  role,
}: {
  eventId: string;
  role: "judge" | "mentor";
}) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: lecturers = [] } = useLecturerOptions();
  const judgesQuery = useEventStaffJudges(eventId);
  const mentorsQuery = useEventStaffMentors(eventId);
  const staff = role === "judge" ? (judgesQuery.data ?? []) : (mentorsQuery.data ?? []);
  const isLoading = role === "judge" ? judgesQuery.isLoading : mentorsQuery.isLoading;

  const { mutate: assignJudge, isPending: assigningJudge } = useAssignEventJudge(eventId);
  const { mutate: assignMentor, isPending: assigningMentor } = useAssignEventMentor(eventId);
  const { mutate: removeJudge } = useRemoveEventJudge(eventId);
  const { mutate: removeMentor } = useRemoveEventMentor(eventId);

  const isPending = role === "judge" ? assigningJudge : assigningMentor;
  const assignedIds = useMemo(() => new Set(staff.map((s) => s.userId)), [staff]);

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lecturers
      .filter((l) => !assignedIds.has(l.id))
      .filter((l) => {
        if (!q) return true;
        const name = (l.fullName ?? "").toLowerCase();
        const email = l.email.toLowerCase();
        return name.includes(q) || email.includes(q);
      })
      .slice(0, 8);
  }, [lecturers, assignedIds, search]);

  const handleAdd = () => {
    if (!selectedUserId) return;
    setError(null);
    const onSuccess = () => {
      setSelectedUserId("");
      setSearch("");
    };
    const onError = (err: Error) => setError(err.message);

    if (role === "judge") {
      assignJudge({ userId: selectedUserId }, { onSuccess, onError });
    } else {
      assignMentor({ userId: selectedUserId }, { onSuccess, onError });
    }
  };

  const handleRemove = (assignmentId: string) => {
    if (role === "judge") {
      removeJudge(assignmentId);
    } else {
      removeMentor(assignmentId);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-8 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
      <div className="flex flex-col gap-3">
        <label style={labelStyle}>Search lecturer</label>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedUserId("");
          }}
          style={inputStyle}
          placeholder="Search by name or email..."
        />

        {search.trim() && options.length > 0 && (
          <div
            style={{
              border: "1px solid rgba(223,226,236,0.8)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {options.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  setSelectedUserId(l.id);
                  setSearch(l.fullName ?? l.email);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  border: "none",
                  borderBottom: "1px solid rgba(223,226,236,0.4)",
                  backgroundColor: selectedUserId === l.id ? "#f0f9ff" : "#fff",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <span style={{ fontWeight: 600 }}>{l.fullName ?? "Unnamed"}</span>
                <span style={{ color: "#8891a5", marginLeft: 8 }}>{l.email}</span>
              </button>
            ))}
          </div>
        )}

        {search.trim() && options.length === 0 && (
          <p style={{ fontSize: 13, color: "#8891a5" }}>No matching lecturers found.</p>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#991b1b" }}>{error}</p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !selectedUserId}
          className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer self-start disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>

      <div className="overflow-hidden border border-navy/20">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Email</th>
              <th style={{ ...headerCell, width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={j} style={{ padding: "14px 16px" }}>
                        <div
                          className="animate-pulse rounded"
                          style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : staff.map((person) => (
                  <tr key={person.id} style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
                    <td style={{ ...bodyCell, fontWeight: 600 }}>{person.fullName ?? "Unknown"}</td>
                    <td style={{ ...bodyCell, color: "#8891a5" }}>{person.email ?? "N/A"}</td>
                    <td style={bodyCell}>
                      <button
                        type="button"
                        onClick={() => handleRemove(person.id)}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#991b1b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
            {!isLoading && staff.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "32px 16px" }}>
                  No {role === "judge" ? "judges" : "mentors"} added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EventStaffSection({ eventId }: { eventId: string }) {
  return (
    <div className="flex flex-col gap-8 max-w-[800px]">
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0e1528" }}>Judges</h2>
        <EventStaffPanel eventId={eventId} role="judge" />
      </section>
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#0e1528" }}>Mentors</h2>
        <EventStaffPanel eventId={eventId} role="mentor" />
      </section>
    </div>
  );
}
