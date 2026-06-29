"use client";

import { useState } from "react";
import {
  useEventWizardStore,
  type WizardTrack,
} from "@/features/admin/store/event-wizard.store";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4, display: "block" };
const errorStyle: React.CSSProperties = { fontSize: 12, color: "#ef4444", marginTop: 4 };

const TRACK_MIN = 16;
const TRACK_MAX = 40;

export function Step2Info({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data, updateData } = useEventWizardStore();
  const [trackName, setTrackName] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackMaxTeams, setTrackMaxTeams] = useState(20);
  const [trackError, setTrackError] = useState<string | null>(null);
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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (data.tracks.length < 1) errs.tracks = "At least 1 track is required";
    if (data.semesterMin != null && data.semesterMax != null && data.semesterMin > data.semesterMax) {
      errs.semester = "Semester min must be less than or equal to max";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
