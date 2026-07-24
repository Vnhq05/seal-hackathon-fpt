"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { EventResponse, RoundResponse, SubmissionResponse } from "@/lib/api";
import { openSubmissionAttachment } from "@/lib/files";
import {
  isRoundOpen,
  roundLockMessage,
  validateAnySubmissionFile,
} from "@/features/submissions/utils/round.utils";
import { isValidHttpUrl } from "@/features/submissions/utils/seal-submission.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";
import {
  countSubmissionParts,
  percentForSubmittedParts,
  REQUIRED_SUBMISSION_PARTS,
  submissionPartsFromVersion,
  SubmissionProgressBar,
} from "@/features/progress/components/submission-progress-bar";

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type SubmitPart = "slide" | "source" | "other";

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

  const [slideUrl, setSlideUrl] = useState(existing?.latestVersion?.slideUrl ?? "");
  const [sourceCodeUrl, setSourceCodeUrl] = useState(
    existing?.latestVersion?.sourceCodeUrl ?? existing?.latestVersion?.githubUrl ?? "",
  );
  const [otherUrl, setOtherUrl] = useState(
    existing?.latestVersion?.otherUrl ?? existing?.latestVersion?.demoUrl ?? "",
  );
  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [viewingFile, setViewingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPart, setSavingPart] = useState<SubmitPart | null>(null);

  const roundOpen = isRoundOpen(round);
  const locked = !roundOpen;
  const currentFile = existing?.latestVersion?.attachments?.[0] ?? null;

  const partStatus = useMemo(
    () => submissionPartsFromVersion(existing?.latestVersion),
    [existing?.latestVersion],
  );
  const submittedParts = countSubmissionParts(partStatus);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["team-submissions", event.id, teamId] });
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: ({
      request,
      file,
    }: {
      request: { slideUrl?: string; sourceCodeUrl?: string; otherUrl?: string };
      file?: File | null;
    }) => submissionApi.submit(round.id, request, file ?? null),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleViewFile = async () => {
    if (!currentFile) return;
    setError(null);
    setViewingFile(true);
    try {
      await openSubmissionAttachment(currentFile.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open file");
    } finally {
      setViewingFile(false);
    }
  };

  const handleSavePart = (part: SubmitPart) => {
    setError(null);
    setSuccess(null);
    if (!roundOpen) {
      setError(roundLockMessage(round));
      return;
    }

    const latest = existing?.latestVersion;
    const existingSource = (latest?.sourceCodeUrl ?? latest?.githubUrl ?? "").trim();
    const existingOther = (latest?.otherUrl ?? latest?.demoUrl ?? "").trim();

    if (part === "slide") {
      if (!slideUrl.trim() || !isValidHttpUrl(slideUrl)) {
        setError("Invalid slide URL");
        return;
      }
      if (slideUrl.trim() === (latest?.slideUrl ?? "").trim()) {
        setSuccess("No changes — version unchanged");
        return;
      }
      setSavingPart("slide");
      submit(
        { request: { slideUrl: slideUrl.trim() } },
        {
          onSuccess: () => {
            setSuccess("Slide saved!");
            setSavingPart(null);
          },
          onError: () => setSavingPart(null),
        },
      );
      return;
    }

    if (part === "source") {
      const sourceError = validateSourceCodeUrl(sourceCodeUrl);
      if (sourceError) {
        setError(sourceError);
        return;
      }
      if (sourceCodeUrl.trim() === existingSource) {
        setSuccess("No changes — version unchanged");
        return;
      }
      setSavingPart("source");
      submit(
        { request: { sourceCodeUrl: sourceCodeUrl.trim() } },
        {
          onSuccess: () => {
            setSuccess("Source code saved!");
            setSavingPart(null);
          },
          onError: () => setSavingPart(null),
        },
      );
      return;
    }

    const hasUrl = Boolean(otherUrl.trim());
    const hasFile = Boolean(otherFile);
    if (!hasUrl && !hasFile) {
      setError("Provide an Other URL and/or choose any file");
      return;
    }
    if (hasUrl && !isValidHttpUrl(otherUrl)) {
      setError("Invalid Other URL");
      return;
    }
    if (otherFile) {
      const fileErr = validateAnySubmissionFile(otherFile);
      if (fileErr) {
        setError(fileErr);
        return;
      }
    }
    if (!hasFile && otherUrl.trim() === existingOther) {
      setSuccess("No changes — version unchanged");
      return;
    }

    setSavingPart("other");
    submit(
      {
        request: hasUrl ? { otherUrl: otherUrl.trim() } : {},
        file: otherFile,
      },
      {
        onSuccess: () => {
          setSuccess("Other saved!");
          setOtherFile(null);
          setSavingPart(null);
        },
        onError: () => setSavingPart(null),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-seal-border p-5">
          <div>
            <h2 className="text-lg font-bold text-seal-text">{existing ? "Update submission" : "Submit"}</h2>
            <p className="text-xs text-seal-text-muted">
              {event.name} — {round.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-seal-text-muted hover:bg-seal-surface-elevated hover:text-seal-text"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="border-b border-seal-border px-5 py-4">
          <SubmissionProgressBar
            percent={percentForSubmittedParts(submittedParts)}
            submittedParts={submittedParts}
            requiredParts={REQUIRED_SUBMISSION_PARTS}
            partStatus={partStatus}
            showPartLabels
            size="sm"
          />
        </div>

        {locked && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {roundLockMessage(round)}
          </div>
        )}

        <div className={`flex flex-col gap-4 p-5 ${locked ? "pointer-events-none opacity-60" : ""}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-seal-text-secondary">
                Slide URL {partStatus.slide ? "✓" : ""}
              </label>
              <input
                value={slideUrl}
                onChange={(e) => setSlideUrl(e.target.value)}
                placeholder="https://docs.google.com/presentation/..."
                className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSavePart("slide")}
              disabled={isPending}
              className="shrink-0 border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold"
            >
              {savingPart === "slide" ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-seal-text-secondary">
                GitHub / Source URL {partStatus.source ? "✓" : ""}
              </label>
              <input
                value={sourceCodeUrl}
                onChange={(e) => setSourceCodeUrl(e.target.value)}
                placeholder="https://github.com/org/project"
                className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSavePart("source")}
              disabled={isPending}
              className="shrink-0 border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold"
            >
              {savingPart === "source" ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="rounded-lg border border-seal-border bg-seal-surface-elevated/40 p-3">
            <p className="text-xs font-semibold text-seal-text">
              Other {partStatus.other ? "✓" : ""}
            </p>
            <p className="mt-0.5 text-[11px] text-seal-text-muted">
              Any link and/or any file (counts as one progress part). Max file size 25MB.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-seal-text-secondary">Other URL</label>
                <input
                  value={otherUrl}
                  onChange={(e) => setOtherUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
                />
              </div>
            </div>
            {currentFile && !otherFile && (
              <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-seal-border bg-white px-3 py-2">
                <div className="min-w-0 text-xs text-seal-text-secondary">
                  <span className="font-medium text-seal-text">Current file:</span>{" "}
                  <span className="truncate">{currentFile.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleViewFile()}
                  disabled={viewingFile}
                  className="shrink-0 text-xs font-semibold text-royal underline disabled:opacity-50"
                >
                  {viewingFile ? "Opening..." : "View"}
                </button>
              </div>
            )}
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-seal-border bg-white p-4 text-sm text-seal-text-muted"
            >
              {otherFile ? otherFile.name : "Click to select any file (optional)"}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) {
                  const err = validateAnySubmissionFile(f);
                  if (err) {
                    setError(err);
                    return;
                  }
                }
                setOtherFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => handleSavePart("other")}
              disabled={isPending}
              className="mt-2 border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold disabled:opacity-50"
            >
              {savingPart === "other" ? "Saving..." : "Save Other"}
            </button>
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
            className="border-2 border-navy bg-white px-5 py-2 text-xs font-semibold shadow-[4px_4px_0_0_#0c1228]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
