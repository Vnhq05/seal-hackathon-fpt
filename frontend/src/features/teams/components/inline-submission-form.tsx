"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { EventResponse, RoundResponse, SubmissionResponse } from "@/lib/api";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface InlineSubmissionFormProps {
  event: EventResponse;
  round: RoundResponse;
  teamId: string;
  existing: SubmissionResponse | null;
  onClose: () => void;
}

export function InlineSubmissionForm({ event, round, teamId, existing, onClose }: InlineSubmissionFormProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [github, setGithub] = useState(existing?.latestVersion?.githubUrl ?? "");
  const [demo, setDemo] = useState(existing?.latestVersion?.demoUrl ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: { github: string; demo: string; pdf: File }) =>
      submissionApi.submit(round.id, {
        githubUrl: data.github,
        demoUrl: data.demo,
        pdfPageCount: 0,
      }, data.pdf),
    onSuccess: () => {
      setSuccess("Submission saved!");
      qc.invalidateQueries({ queryKey: ["team-submissions", event.id, teamId] });
      setTimeout(onClose, 1500);
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = () => {
    setError(null);
    if (!github.trim()) { setError("GitHub URL is required"); return; }
    if (!pdfFile && !existing) { setError("PDF file is required"); return; }

    const pdf = pdfFile ?? new File([], "existing.pdf");
    submit({ github: github.trim(), demo: demo.trim(), pdf });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl rounded-xl border border-seal-border bg-seal-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-seal-border p-5">
          <div>
            <h2 className="text-lg font-bold text-seal-text">{existing ? "Edit Submission" : "Submit Work"}</h2>
            <p className="text-xs text-seal-text-muted">
              {event.name} — {round.name} | Due {round.submissionDeadline?.slice(0, 16).replace("T", " ")}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-seal-text-muted hover:bg-seal-surface-elevated hover:text-seal-text">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-seal-text-secondary">GitHub Repository URL *</label>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/team/project"
              className="mt-1.5 w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40 focus:ring-2 focus:ring-seal-cyan/10"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-seal-text-secondary">Demo URL</label>
            <input
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              placeholder="https://your-demo.vercel.app"
              className="mt-1.5 w-full rounded-lg border border-seal-border bg-seal-surface px-3 py-2 text-sm text-seal-text outline-none focus:border-seal-cyan/40 focus:ring-2 focus:ring-seal-cyan/10"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-seal-text-secondary">
              Project PDF {existing ? "(upload new to replace)" : "*"}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-seal-border bg-seal-surface-sunken p-6 text-sm text-seal-text-muted transition-colors hover:border-seal-cyan/30"
            >
              {pdfFile ? (
                <span className="text-seal-text">{pdfFile.name}</span>
              ) : existing ? (
                <span>Current: v{existing.currentVersion} — click to upload new</span>
              ) : (
                <span>Click to select PDF file</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
          {success && <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</div>}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-seal-border p-5">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-seal-border bg-seal-surface px-5 py-2 text-xs font-semibold text-seal-text hover:bg-seal-surface-elevated"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-lg bg-seal-cyan px-5 py-2 text-xs font-semibold text-white hover:bg-seal-cyan-dark disabled:opacity-50"
          >
            {isPending ? "Submitting..." : existing ? "Update submission" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
