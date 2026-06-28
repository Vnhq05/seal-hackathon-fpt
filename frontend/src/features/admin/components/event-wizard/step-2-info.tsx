"use client";

import { useState } from "react";
import {
  useEventWizardStore,
  type WizardTrack,
  type LecturerRole,
  type WizardLecturerAssignment,
} from "@/features/admin/store/event-wizard.store";
import { useLecturerOptions } from "@/features/admin/hooks/use-lecturer-options";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };

const TRACK_MIN = 16;
const TRACK_MAX = 40;

function syncRoleIds(assignments: WizardLecturerAssignment[]) {
  const mentorUserIds = assignments
    .filter((a) => a.role === "MENTOR" || a.role === "BOTH")
    .map((a) => a.userId);
  const judgeUserIds = assignments
    .filter((a) => a.role === "JUDGE" || a.role === "BOTH")
    .map((a) => a.userId);
  return { mentorUserIds, judgeUserIds };
}

export function Step2Info({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const { data: lecturers = [], isLoading: loadingLecturers } = useLecturerOptions();
  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackMaxTeams, setTrackMaxTeams] = useState(20);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [lecturerFilter, setLecturerFilter] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addTrack = () => {
    if (!trackName.trim()) return;
    if (trackMaxTeams < TRACK_MIN || trackMaxTeams > TRACK_MAX) {
      setTrackError(`Max teams must be between ${TRACK_MIN} and ${TRACK_MAX}`);
      return;
    }
    setTrackError(null);
    const newTrack: WizardTrack = {
      name: trackName.trim(),
      description: trackDescription.trim(),
      maxTeams: trackMaxTeams,
      scoringTemplateId: null,
    };
    updateData({ tracks: [...data.tracks, newTrack] });
    setTrackName("");
    setTrackDescription("");
    setTrackMaxTeams(20);
  };

  const removeTrack = (idx: number) => {
    updateData({ tracks: data.tracks.filter((_, i) => i !== idx) });
  };

  const addLecturer = (userId: string, role: LecturerRole) => {
    const person = lecturers.find((l) => l.id === userId);
    if (!person) return;
    const existing = data.lecturerAssignments.find((a) => a.userId === userId);
    let next: WizardLecturerAssignment[];
    if (existing) {
      next = data.lecturerAssignments.map((a) =>
        a.userId === userId ? { ...a, role } : a
      );
    } else {
      next = [
        ...data.lecturerAssignments,
        { userId, fullName: person.fullName, email: person.email, role },
      ];
    }
    updateData({ lecturerAssignments: next, ...syncRoleIds(next) });
  };

  const removeLecturer = (userId: string) => {
    const next = data.lecturerAssignments.filter((a) => a.userId !== userId);
    updateData({ lecturerAssignments: next, ...syncRoleIds(next) });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (data.tracks.length < 1) errs.tracks = "At least 1 track is required";
    if (data.semesterMin != null && data.semesterMax != null && data.semesterMin > data.semesterMax) {
      errs.semester = "Semester min must be less than or equal to max";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const availableLecturers = lecturers.filter(
    (l) =>
      !data.lecturerAssignments.some((a) => a.userId === l.id) &&
      (lecturerFilter === "" ||
        l.fullName.toLowerCase().includes(lecturerFilter.toLowerCase()) ||
        l.email.toLowerCase().includes(lecturerFilter.toLowerCase()))
  );

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
        {errors.tracks && <p style={errorStyle}>{errors.tracks}</p>}
        <div className="flex gap-2" style={{ marginBottom: 4 }}>
          <input value={trackName} onChange={(e) => setTrackName(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="Track name" />
          <input
            type="number"
            value={trackMaxTeams}
            onChange={(e) => setTrackMaxTeams(parseInt(e.target.value) || TRACK_MIN)}
            style={{ ...inputStyle, width: 120 }}
            min={TRACK_MIN}
            max={TRACK_MAX}
            placeholder="Max teams"
          />
          <button onClick={addTrack} style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
            Add
          </button>
        </div>
        {trackError && <p style={errorStyle}>{trackError}</p>}
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

      <div>
        <label style={labelStyle}>Lecturer Assignment</label>
        <p style={{ fontSize: 12, color: "#8891a5", marginBottom: 8 }}>Assign role: Mentor, Judge, or Both</p>

        {data.lecturerAssignments.length > 0 && (
          <div style={{ marginBottom: 10, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, overflow: "hidden" }}>
            {data.lecturerAssignments.map((a) => (
              <div key={a.userId} className="flex items-center justify-between" style={{ padding: "8px 12px", backgroundColor: "#f0fdf4", borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{a.fullName}</span>
                  <span style={{ color: "#8891a5", marginLeft: 8, fontSize: 12 }}>{a.role}</span>
                </div>
                <button type="button" onClick={() => removeLecturer(a.userId)} style={{ fontSize: 12, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {loadingLecturers ? (
          <div className="animate-pulse rounded" style={{ height: 44, backgroundColor: "rgba(223,226,236,0.8)" }} />
        ) : (
          <>
            <input value={lecturerFilter} onChange={(e) => setLecturerFilter(e.target.value)} style={{ ...inputStyle, marginBottom: 6 }} placeholder="Filter lecturers..." />
            <div style={{ border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, maxHeight: 200, overflowY: "auto" }}>
              {availableLecturers.map((person) => (
                <div key={person.id} className="flex items-center justify-between" style={{ padding: "8px 12px", borderBottom: "1px solid rgba(223,226,236,0.3)" }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{person.fullName}</span>
                    <span style={{ color: "#8891a5", marginLeft: 8, fontSize: 12 }}>{person.email}</span>
                  </div>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const role = e.target.value as LecturerRole;
                      if (role) addLecturer(person.id, role);
                      e.target.value = "";
                    }}
                    style={{ ...inputStyle, width: 120, padding: "6px 8px" }}
                  >
                    <option value="">Add as...</option>
                    <option value="MENTOR">Mentor</option>
                    <option value="JUDGE">Judge</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Semester Min (optional)</label>
          <input type="number" value={data.semesterMin ?? ""} onChange={(e) => updateData({ semesterMin: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} min={1} max={10} placeholder="e.g. 5" />
        </div>
        <div>
          <label style={labelStyle}>Semester Max (optional)</label>
          <input type="number" value={data.semesterMax ?? ""} onChange={(e) => updateData({ semesterMax: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} min={1} max={10} placeholder="e.g. 6" />
        </div>
      </div>
      {errors.semester && <p style={errorStyle}>{errors.semester}</p>}

      <div className="flex justify-between" style={{ marginTop: 8 }}>
        <button onClick={onBack} className="border-2 border-navy bg-white px-6 py-2.5 text-sm font-medium text-navy cursor-pointer">Back</button>
        <button onClick={() => { if (validate()) onNext(); }} className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer">Next</button>
      </div>
    </div>
  );
}
