"use client";

import { useState } from "react";
import type { MentorRoundSubmission } from "@/features/mentor/types/mentor.types";
import { useSaveMentorNotes } from "@/features/mentor/hooks/use-save-mentor-notes";
import { MentorScoreDisplay } from "@/features/mentor/components/mentor-score-display";

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  judged: { bg: "#dcfce7", border: "rgba(223,226,236,0.8)", text: "#0e1528", label: "Judged" },
  needs_judging: { bg: "rgba(224,231,255,0.5)", border: "#c7d2fe", text: "#38bdf8", label: "Needs Judging" },
  not_submitted: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: "Not Submitted" },
};

function RoundIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="16" height="18" rx="3" stroke="#0e1528" strokeWidth="1.5" />
      <path d="M5 10l3 3 5-5" stroke="#0e1528" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="13" height="8" viewBox="0 0 13 8" fill="none" aria-hidden="true">
      <path d="M1 4h3M9 4h3M4 1v6M9 1v6" stroke="#0e1528" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
      <path d="M6.5 1H2.5a1.5 1.5 0 00-1.5 1.5v7a1.5 1.5 0 001.5 1.5h5a1.5 1.5 0 001.5-1.5V4.5L6.5 1z" stroke="#0e1528" strokeWidth="1" strokeLinejoin="round" />
      <path d="M6.5 1v3.5H10" stroke="#0e1528" strokeWidth="1" />
    </svg>
  );
}

function DemoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#0e1528" strokeWidth="1.2" />
      <path d="M5 4.5l4 2-4 2z" fill="#0e1528" />
    </svg>
  );
}

const LINK_ICON_MAP: Record<string, React.ReactNode> = {
  github: <GithubIcon />,
  document: <DocIcon />,
  demo: <DemoIcon />,
};

interface Props {
  round: MentorRoundSubmission;
}

export function MentorRoundCard({ round }: Props) {
  const status = STATUS_STYLE[round.status] ?? STATUS_STYLE.not_submitted;
  const { mutate: saveNotes, isPending } = useSaveMentorNotes();
  const [notes, setNotes] = useState(round.mentorNotes ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    saveNotes({ submissionId: round.id, notes }, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <div className="overflow-hidden rounded-lg" style={{ backgroundColor: "#eef0f6", border: "1px solid rgba(223,226,236,0.8)" }}>
      <div className="flex items-center justify-between" style={{ backgroundColor: "#eef0f6", borderBottom: "1px solid rgba(223,226,236,0.8)", padding: "15px 24px 17px" }}>
        <div className="flex items-center gap-2">
          <RoundIcon />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>{round.roundName}</h3>
        </div>
        <span className="rounded-full" style={{ backgroundColor: status.bg, border: `1px solid ${status.border}`, padding: "5px 9px", fontSize: 12, fontWeight: 500, color: status.text, letterSpacing: "0.24px" }}>
          {status.label}
        </span>
      </div>

      <div style={{ padding: 24 }}>
        <div className="flex gap-6">
          <div className="flex flex-1 flex-col gap-4">
            {round.links.length > 0 && (
              <div className="flex flex-col gap-1">
                <p style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.6px", textTransform: "uppercase", lineHeight: "12px" }}>SUBMISSION LINKS</p>
                <div className="flex gap-2">
                  {round.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" style={{ backgroundColor: "rgba(223,226,236,0.8)", border: "1px solid rgba(223,226,236,0.8)", padding: "5px 9px", fontSize: 12, fontWeight: 500, color: "#0e1528", letterSpacing: "0.24px" }}>
                      {LINK_ICON_MAP[link.type] ?? <DocIcon />}
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {round.status !== "not_submitted" && (
              <div className="flex flex-col gap-1">
                <p style={{ fontSize: 12, fontWeight: 500, color: "#8891a5", letterSpacing: "0.6px", textTransform: "uppercase", lineHeight: "12px" }}>MENTOR NOTES</p>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", border: "1px solid rgba(198,198,205,0.5)", padding: 9, fontSize: 14, color: "#0e1528", lineHeight: "21px", resize: "vertical", outline: "none", backgroundColor: "#ffffff" }} />
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={isPending} style={{ backgroundColor: "#38bdf8", color: "#fff", fontSize: 12, fontWeight: 500, padding: "6px 12px", border: "none", cursor: "pointer" }}>{isPending ? "Saving..." : "Save"}</button>
                      <button onClick={() => { setIsEditing(false); setNotes(round.mentorNotes ?? ""); }} style={{ backgroundColor: "#fff", color: "#8891a5", fontSize: 12, fontWeight: 500, padding: "6px 12px", border: "1px solid rgba(223,226,236,0.8)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer" onClick={() => setIsEditing(true)} style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 9, fontSize: 14, color: notes ? "#0e1528" : "#8891a5", lineHeight: "21px", minHeight: 60 }}>
                    {notes || "Click to add mentor notes..."}
                  </div>
                )}
              </div>
            )}
          </div>
          {round.aggregateScore !== null && (
            <MentorScoreDisplay score={round.aggregateScore} maxScore={round.maxScore} />
          )}
        </div>
        {round.status === "needs_judging" && (
          <button className="flex items-center gap-1" style={{ backgroundColor: "#38bdf8", padding: "8px 24px", fontSize: 12, fontWeight: 500, color: "#ffffff", letterSpacing: "0.24px", border: "none", marginTop: 16, cursor: "pointer" }}>
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden="true"><rect x="1" y="1.5" width="12" height="12" rx="2" stroke="#fff" strokeWidth="1.2" /><path d="M5 7.5l2 2 3-3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Start Judging
          </button>
        )}
      </div>
    </div>
  );
}
