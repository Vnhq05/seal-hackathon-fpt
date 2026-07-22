"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionApi } from "@/lib/api";
import type { EventResponse, RoundResponse, SubmissionResponse } from "@/lib/api";
import { openSubmissionAttachment } from "@/lib/files";
import { isRoundOpen, roundLockMessage, validatePdfFile } from "@/features/submissions/utils/round.utils";
import { isValidHttpUrl } from "@/features/submissions/utils/seal-submission.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";
import {
  countSubmissionParts,
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

type SubmitPart = "slide" | "source" | "demo" | "pdf";

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
  const [demo, setDemo] = useState(existing?.latestVersion?.demoUrl ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPart, setSavingPart] = useState<SubmitPart | null>(null);

  const roundOpen = isRoundOpen(round);
  const locked = !roundOpen;
  const currentPdf = existing?.latestVersion?.attachments?.[0] ?? null;

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
      pdf,
    }: {
      request: { slideUrl?: string; sourceCodeUrl?: string; demoUrl?: string };
      pdf?: File | null;
    }) => submissionApi.submit(round.id, request, pdf ?? null),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleViewPdf = async () => {
    if (!currentPdf) return;
    setError(null);
    setViewingPdf(true);
    try {
      await openSubmissionAttachment(currentPdf.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open PDF");
    } finally {
      setViewingPdf(false);
    }
  };

  const handleSavePart = (part: SubmitPart) => {
    setError(null);
    setSuccess(null);
    if (!roundOpen) {
      setError(roundLockMessage(round));
      return;
    }

    if (part === "slide") {
      if (!slideUrl.trim() || !isValidHttpUrl(slideUrl)) {
        setError("Invalid slide URL");
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

    if (part === "demo") {
      if (!demo.trim() || !isValidHttpUrl(demo)) {
        setError("Invalid demo URL");
        return;
      }
      setSavingPart("demo");
      submit(
        { request: { demoUrl: demo.trim() } },
        {
          onSuccess: () => {
            setSuccess("Demo saved!");
            setSavingPart(null);
          },
          onError: () => setSavingPart(null),
        },
      );
      return;
    }

    if (!pdfFile) {
      setError("Please select a PDF file");
      return;
    }
    const pdfErr = validatePdfFile(pdfFile);
    if (pdfErr) {
      setError(pdfErr);
      return;
    }
    setSavingPart("pdf");
    submit(
      { request: {}, pdf: pdfFile },
      {
        onSuccess: () => {
          setSuccess("PDF saved!");
          setPdfFile(null);
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
            percent={submittedParts * 25}
            submittedParts={submittedParts}
            requiredParts={4}
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
                Source Code URL {partStatus.source ? "✓" : ""}
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-seal-text-secondary">
                Demo URL {partStatus.demo ? "✓" : ""}
              </label>
              <input
                value={demo}
                onChange={(e) => setDemo(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
              />
            </div>
            <button
              type="button"
              onClick={() => handleSavePart("demo")}
              disabled={isPending}
              className="shrink-0 border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold"
            >
              {savingPart === "demo" ? "Saving..." : "Save"}
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-seal-text-secondary">
              PDF {partStatus.pdf ? "✓" : ""}
            </label>
            {currentPdf && !pdfFile && (
              <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-seal-border bg-seal-surface-elevated px-3 py-2">
                <div className="min-w-0 text-xs text-seal-text-secondary">
                  <span className="font-medium text-seal-text">Current PDF:</span>{" "}
                  <span className="truncate">{currentPdf.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleViewPdf()}
                  disabled={viewingPdf}
                  className="shrink-0 text-xs font-semibold text-royal underline disabled:opacity-50"
                >
                  {viewingPdf ? "Opening..." : "View PDF"}
                </button>
              </div>
            )}
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-seal-border bg-seal-surface-sunken p-4 text-sm text-seal-text-muted"
            >
              {pdfFile ? pdfFile.name : "Click to select PDF (max 5MB)"}
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
            <button
              type="button"
              onClick={() => handleSavePart("pdf")}
              disabled={isPending || !pdfFile}
              className="mt-2 border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold disabled:opacity-50"
            >
              {savingPart === "pdf" ? "Saving..." : "Save PDF"}
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
