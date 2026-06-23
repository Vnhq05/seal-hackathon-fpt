"use client";

import { useState } from "react";
import { useEventWizardStore, type WizardTrack } from "@/features/admin/store/event-wizard.store";
import { useLecturerOptions } from "@/features/admin/hooks/use-lecturer-options";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };

function PersonListSelect({
  label,
  description,
  selectedIds,
  onAdd,
  onRemove,
  options,
  isLoading,
}: {
  label: string;
  description: string;
  selectedIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  options: { id: string; fullName: string; email: string }[];
  isLoading: boolean;
}) {
  const [filter, setFilter] = useState("");

  const available = options.filter(
    (o) =>
      !selectedIds.includes(o.id) &&
      (filter === "" ||
        o.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        o.email.toLowerCase().includes(filter.toLowerCase()))
  );

  const selected = options.filter((o) => selectedIds.includes(o.id));

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <p style={{ fontSize: 12, color: "#8891a5", marginBottom: 8 }}>{description}</p>

      {selected.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#065f46", marginBottom: 4 }}>
            Selected ({selected.length})
          </p>
          <div style={{ border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, overflow: "hidden" }}>
            {selected.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between"
                style={{
                  padding: "8px 12px", fontSize: 13,
                  borderBottom: "1px solid rgba(16,185,129,0.15)",
                  backgroundColor: "#f0fdf4",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#0e1528" }}>{person.fullName}</span>
                  <span style={{ color: "#8891a5", marginLeft: 8 }}>{person.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(person.id)}
                  style={{
                    fontSize: 12, fontWeight: 600, color: "#991b1b", padding: "4px 10px",
                    backgroundColor: "#fee2e2", border: "none", borderRadius: 4, cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse rounded" style={{ height: 44, backgroundColor: "rgba(223,226,236,0.8)" }} />
      ) : (
        <>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ ...inputStyle, marginBottom: 6 }}
            placeholder="Filter by name or email..."
          />
          <div style={{
            border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, overflow: "hidden",
            maxHeight: 200, overflowY: "auto",
          }}>
            {available.length === 0 && (
              <p style={{ fontSize: 13, color: "#8891a5", textAlign: "center", padding: 16 }}>
                {options.length === 0 ? "No lecturers in the system" : "No matching lecturers"}
              </p>
            )}
            {available.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between"
                style={{
                  padding: "8px 12px", fontSize: 13,
                  borderBottom: "1px solid rgba(223,226,236,0.3)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#0e1528" }}>{person.fullName}</span>
                  <span style={{ color: "#8891a5", marginLeft: 8 }}>{person.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(person.id)}
                  style={{
                    fontSize: 12, fontWeight: 600, color: "#0284c7", padding: "4px 10px",
                    backgroundColor: "#e0f2fe", border: "none", borderRadius: 4, cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function Step2Info({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const { data: lecturers = [], isLoading: loadingLecturers } = useLecturerOptions();
  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackMaxTeams, setTrackMaxTeams] = useState(20);

  const addTrack = () => {
    if (!trackName.trim()) return;
    const newTrack: WizardTrack = { name: trackName.trim(), description: trackDescription.trim(), maxTeams: trackMaxTeams, scoringTemplateId: null };
    updateData({ tracks: [...data.tracks, newTrack] });
    setTrackName("");
    setTrackDescription("");
    setTrackMaxTeams(20);
  };

  const removeTrack = (idx: number) => {
    updateData({ tracks: data.tracks.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    if (data.tracks.length < 1) {
      alert("At least 1 track is required");
      return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>Step 2: Basic Information</h2>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={data.description}
          onChange={(e) => updateData({ description: e.target.value })}
          style={{ ...inputStyle, resize: "vertical" }}
          rows={3}
          placeholder="Event description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Location</label>
          <input value={data.location} onChange={(e) => updateData({ location: e.target.value })} style={inputStyle} placeholder="Event location" />
        </div>
        <div>
          <label style={labelStyle}>Format</label>
          <input value="Offline" disabled style={{ ...inputStyle, backgroundColor: "#f6f7fb", color: "#8891a5" }} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Tracks</label>
        <div className="flex gap-2" style={{ marginBottom: 4 }}>
          <input value={trackName} onChange={(e) => setTrackName(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Track name" />
          <input type="number" value={trackMaxTeams} onChange={(e) => setTrackMaxTeams(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 120 }} min={1} placeholder="Max teams" />
          <button onClick={addTrack} style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            Add
          </button>
        </div>
        <textarea value={trackDescription} onChange={(e) => setTrackDescription(e.target.value)} style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} rows={2} placeholder="Track description (optional)" />
        {data.tracks.map((t, idx) => (
          <div key={idx} className="flex items-center justify-between" style={{ padding: "8px 12px", backgroundColor: "#f8f9fc", borderRadius: 6, marginBottom: 4 }}>
            <div>
              <span style={{ fontSize: 14 }}>{t.name} (max {t.maxTeams} teams)</span>
              {t.description && <p style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>{t.description}</p>}
            </div>
            <button onClick={() => removeTrack(idx)} style={{ color: "#991b1b", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      <PersonListSelect
        label="Mentors"
        description="Select from Lecturer accounts. A person can be both mentor and judge in the same event."
        selectedIds={data.mentorUserIds}
        onAdd={(id) => updateData({ mentorUserIds: [...data.mentorUserIds, id] })}
        onRemove={(id) => updateData({ mentorUserIds: data.mentorUserIds.filter((x) => x !== id) })}
        options={lecturers}
        isLoading={loadingLecturers}
      />

      <PersonListSelect
        label="Judges"
        description="Select from Lecturer accounts. A person can be both mentor and judge in the same event."
        selectedIds={data.judgeUserIds}
        onAdd={(id) => updateData({ judgeUserIds: [...data.judgeUserIds, id] })}
        onRemove={(id) => updateData({ judgeUserIds: data.judgeUserIds.filter((x) => x !== id) })}
        options={lecturers}
        isLoading={loadingLecturers}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Semester Min (optional)</label>
          <input type="number" value={data.semesterMin ?? ""} onChange={(e) => updateData({ semesterMin: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} min={1} placeholder="e.g. 5" />
        </div>
        <div>
          <label style={labelStyle}>Semester Max (optional)</label>
          <input type="number" value={data.semesterMax ?? ""} onChange={(e) => updateData({ semesterMax: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} min={1} placeholder="e.g. 6" />
        </div>
      </div>

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="rounded-lg" style={{ backgroundColor: "#ffffff", padding: "10px 24px", color: "#0e1528", fontSize: 14, fontWeight: 600, border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>
          Back
        </button>
        <button onClick={() => { if (validate()) onNext(); }} className="rounded-lg" style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
          Next
        </button>
      </div>
    </div>
  );
}
