"use client";

import { useState } from "react";
import { useAdminHackathons } from "@/features/admin/hooks/use-admin-hackathons";
import { useDownloadResearchExport } from "@/features/admin/hooks/use-admin-system";
import type { ResearchField } from "@/features/admin/types/admin-analytics.types";

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "11px 16px", fontSize: 14, width: "100%", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#0e1528", marginBottom: 4 };

const DEFAULT_FIELDS: ResearchField[] = [
  { key: "team_id", label: "Team ID", selected: true },
  { key: "team_name", label: "Team Name", selected: true },
  { key: "track_name", label: "Track Name", selected: true },
  { key: "submission_score", label: "Submission Score", selected: true },
  { key: "member_count", label: "Member Count", selected: true },
  { key: "submission_date", label: "Submission Date", selected: true },
  { key: "judge_scores", label: "Individual Judge Scores", selected: false },
  { key: "feedback_text", label: "Feedback Text", selected: false },
  { key: "member_emails", label: "Member Emails", selected: false },
  { key: "member_names", label: "Member Names", selected: false },
];

export function ResearchExportPage() {
  const [hackathonId, setHackathonId] = useState("");
  const [fields, setFields] = useState<ResearchField[]>(DEFAULT_FIELDS);
  const [anonymize, setAnonymize] = useState(true);
  const [removeEmails, setRemoveEmails] = useState(true);
  const [hashNames, setHashNames] = useState(true);

  const { data: hackathonsData } = useAdminHackathons();
  const { mutate: download, isPending } = useDownloadResearchExport();

  const toggleField = (key: string) => {
    setFields(fields.map((f) => (f.key === key ? { ...f, selected: !f.selected } : f)));
  };

  const handleDownload = () => {
    if (!hackathonId) return;
    download(
      {
        hackathonId,
        fields: fields.filter((f) => f.selected).map((f) => f.key),
        anonymize,
        removeEmails,
        hashNames,
      },
      {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "research-dataset.json";
          a.click();
          URL.revokeObjectURL(url);
        },
      },
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Research Dataset Export
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Export anonymized datasets for research purposes.
        </p>
      </div>

      <div className="flex flex-col gap-6 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 32, maxWidth: 720 }}>
        <div className="flex flex-col">
          <label style={labelStyle}>Hackathon</label>
          <select value={hackathonId} onChange={(e) => setHackathonId(e.target.value)} style={inputStyle}>
            <option value="">Select hackathon</option>
            {hackathonsData?.data.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>

        <div>
          <p style={{ ...labelStyle, marginBottom: 12 }}>Select Fields</p>
          <div className="grid grid-cols-2 gap-2">
            {fields.map((f) => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "#0e1528" }}>
                <input type="checkbox" checked={f.selected} onChange={() => toggleField(f.key)} />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p style={{ ...labelStyle, marginBottom: 12 }}>Anonymization Rules</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "#0e1528" }}>
              <input type="checkbox" checked={anonymize} onChange={(e) => setAnonymize(e.target.checked)} />
              Enable anonymization
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "#0e1528" }}>
              <input type="checkbox" checked={removeEmails} onChange={(e) => setRemoveEmails(e.target.checked)} />
              Remove email addresses
            </label>
            <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: "#0e1528" }}>
              <input type="checkbox" checked={hashNames} onChange={(e) => setHashNames(e.target.checked)} />
              Hash participant names
            </label>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isPending || !hackathonId}
          className="rounded-lg"
          style={{ backgroundColor: "#38bdf8", padding: "10px 24px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", width: "fit-content", opacity: isPending || !hackathonId ? 0.5 : 1 }}
        >
          {isPending ? "Exporting..." : "Export Dataset"}
        </button>
      </div>
    </div>
  );
}
