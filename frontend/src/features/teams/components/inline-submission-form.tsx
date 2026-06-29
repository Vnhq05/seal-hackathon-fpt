"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { EventResponse, RoundResponse, SubmissionResponse } from "@/lib/api";
import { isRoundOpen, roundLockMessage, validatePdfFile } from "@/features/submissions/utils/round.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";
import {
  canSubmitInSealPhase,
  isSealPreliminaryRound,
  resolveSealPhase,
  sealPhaseDescription,
  type SealSubmissionPhase,
} from "@/features/submissions/utils/seal-submission.utils";

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

function SealSubmissionRedirect({
  sealPhase,
  sealGateOpen,
  onClose,
}: {
  sealPhase: SealSubmissionPhase | null;
  sealGateOpen: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-seal-text">Nộp bài SEAL</h2>
        <p className="mt-2 text-sm text-seal-text-secondary">
          Vui lòng dùng trang Nộp bài chính để tuân thủ milestone gates (slide 10:00, demo 14:00).
        </p>
        {sealPhase && !sealGateOpen && (
          <p className="mt-2 text-xs text-amber-700">{sealPhaseDescription(sealPhase)}</p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="border-2 border-navy px-4 py-2 text-xs">
            Đóng
          </button>
          <Link
            href="/student/submissions"
            className="border-2 border-navy bg-seal-yellow px-4 py-2 font-mono text-xs font-bold text-navy"
            onClick={onClose}
          >
            Đến trang Nộp bài
          </Link>
        </div>
      </div>
    </div>
  );
}

export function InlineSubmissionForm({ event, round, teamId, existing, onClose }: InlineSubmissionFormProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const isSealPrelim = isSealPreliminaryRound(event.competitionFormat, round);
  const sealPhase = isSealPrelim ? resolveSealPhase(round) : null;
  const sealGateOpen = sealPhase ? canSubmitInSealPhase(sealPhase) : true;

  const [sourceCodeUrl, setSourceCodeUrl] = useState(
    existing?.latestVersion?.sourceCodeUrl ?? existing?.latestVersion?.githubUrl ?? "",
  );
  const [demo, setDemo] = useState(existing?.latestVersion?.demoUrl ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const roundOpen = isRoundOpen(round);
  const locked = !roundOpen || (isSealPrelim && !sealGateOpen);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (data: { sourceCodeUrl: string; demo: string; pdf: File | null }) =>
      submissionApi.submit(
        round.id,
        {
          sourceCodeUrl: data.sourceCodeUrl,
          demoUrl: data.demo,
        },
        data.pdf,
      ),
    onSuccess: () => {
      setSuccess("Submission saved!");
      qc.invalidateQueries({ queryKey: ["team-submissions", event.id, teamId] });
      setTimeout(onClose, 1500);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isSealPrelim) {
    return <SealSubmissionRedirect sealPhase={sealPhase} sealGateOpen={sealGateOpen} onClose={onClose} />;
  }

  const handleSubmit = () => {
    setError(null);
    if (!roundOpen) {
      setError(roundLockMessage(round));
      return;
    }
    const sourceError = validateSourceCodeUrl(sourceCodeUrl);
    if (sourceError) {
      setError(sourceError);
      return;
    }
    if (!demo.trim()) {
      setError("Demo URL is required");
      return;
    }
    try {
      new URL(demo.trim());
    } catch {
      setError("Invalid Demo URL");
      return;
    }
    if (!pdfFile && !existing) {
      setError("PDF file is required");
      return;
    }
    if (pdfFile) {
      const pdfErr = validatePdfFile(pdfFile);
      if (pdfErr) {
        setError(pdfErr);
        return;
      }
    }
    submit({ sourceCodeUrl: sourceCodeUrl.trim(), demo: demo.trim(), pdf: pdfFile });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-seal-border p-5">
          <div>
            <h2 className="text-lg font-bold text-seal-text">{existing ? "Cập nhật bài nộp" : "Nộp bài"}</h2>
            <p className="text-xs text-seal-text-muted">
              {event.name} — {round.name} | {round.startDate.slice(0, 16).replace("T", " ")} —{" "}
              {round.endDate.slice(0, 16).replace("T", " ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-seal-text-muted hover:bg-seal-surface-elevated hover:text-seal-text"
          >
            <CloseIcon />
          </button>
        </div>

        {locked && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {roundLockMessage(round)}
          </div>
        )}

        <div className={`flex flex-col gap-4 p-5 ${locked ? "pointer-events-none opacity-60" : ""}`}>
          <div>
            <label className="text-xs font-medium text-seal-text-secondary">Source Code URL *</label>
            <input
              value={sourceCodeUrl}
              onChange={(e) => setSourceCodeUrl(e.target.value)}
              placeholder="https://github.com/org/project"
              className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-seal-text-secondary">Demo Video URL *</label>
            <input
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-seal-text-secondary">
              PDF {existing ? "(optional on update)" : "*"}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-seal-border bg-seal-surface-sunken p-6 text-sm text-seal-text-muted transition-colors hover:border-seal-cyan/30"
            >
              {pdfFile ? (
                <span className="text-seal-text">{pdfFile.name}</span>
              ) : existing ? (
                <span>Current: v{existing.currentVersion} — click to upload new PDF</span>
              ) : (
                <span>Click to select PDF (max 5MB)</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) {
                  const err = validatePdfFile(f);
                  if (err) {
                    setError(err);
                    return;
                  }
                }
                setPdfFile(f);
              }}
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
          {success && (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-seal-border p-5">
          <button
            onClick={onClose}
            disabled={isPending}
            className="border-2 border-navy bg-white px-5 py-2 text-xs font-semibold text-seal-text shadow-[4px_4px_0_0_#0c1228] hover:bg-seal-surface-elevated"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || locked}
            className="border-2 border-navy bg-seal-yellow px-5 py-2 font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
          >
            {isPending ? "Submitting..." : existing ? "Cập nhật bài nộp" : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
