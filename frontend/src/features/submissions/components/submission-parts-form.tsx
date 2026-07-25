"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundResponse, SubmissionResponse } from "@/lib/api";
import { openSubmissionAttachment } from "@/lib/files";
import { useSubmitSubmission } from "@/features/submissions/hooks/use-submit-submission";
import { isRoundOpen, roundLockMessage, validatePdfFile } from "@/features/submissions/utils/round.utils";
import { isValidHttpUrl } from "@/features/submissions/utils/seal-submission.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";
import {
  countSubmissionParts,
  submissionPartsFromVersion,
  SubmissionProgressBar,
} from "@/features/progress/components/submission-progress-bar";

type SubmitPart = "slide" | "source" | "demo" | "pdf";

const inputClassName =
  "mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40";
const saveBtnClassName =
  "shrink-0 border-2 border-navy bg-seal-yellow px-3 py-2 font-mono text-xs font-bold disabled:opacity-50";

export interface SubmissionPartsFormProps {
  round: RoundResponse;
  teamId: string;
  existing: SubmissionResponse | null;
  locked?: boolean;
  lockMessage?: string;
  className?: string;
}

export function SubmissionPartsForm({
  round,
  teamId,
  existing,
  locked = false,
  lockMessage,
  className = "",
}: SubmissionPartsFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate: submit, isPending } = useSubmitSubmission();

  const [slideUrl, setSlideUrl] = useState("");
  const [sourceCodeUrl, setSourceCodeUrl] = useState("");
  const [demo, setDemo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPart, setSavingPart] = useState<SubmitPart | null>(null);

  useEffect(() => {
    const version = existing?.latestVersion;
    const timer = window.setTimeout(() => {
      setSlideUrl(version?.slideUrl ?? "");
      setSourceCodeUrl(version?.sourceCodeUrl ?? version?.githubUrl ?? "");
      setDemo(version?.demoUrl ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [existing?.id, existing?.currentVersion, existing?.latestVersion]);

  const roundOpen = isRoundOpen(round);
  const formLocked = locked || !roundOpen;
  const currentPdf = existing?.latestVersion?.attachments?.[0] ?? null;

  const partStatus = useMemo(
    () => submissionPartsFromVersion(existing?.latestVersion),
    [existing?.latestVersion],
  );
  const submittedParts = countSubmissionParts(partStatus);

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

    if (formLocked) {
      setError(lockMessage || roundLockMessage(round));
      return;
    }

    const latest = existing?.latestVersion;
    const existingSource = (latest?.sourceCodeUrl ?? latest?.githubUrl ?? "").trim();

    const run = (
      request: { slideUrl?: string; sourceCodeUrl?: string; demoUrl?: string },
      pdf?: File | null,
      okMessage?: string,
    ) => {
      setSavingPart(part);
      submit(
        { roundId: round.id, teamId, request, pdfFile: pdf ?? null },
        {
          onSuccess: () => {
            setSuccess(okMessage ?? "Saved!");
            if (part === "pdf") setPdfFile(null);
            setSavingPart(null);
          },
          onError: (err: Error) => {
            setError(err.message);
            setSavingPart(null);
          },
        },
      );
    };

    if (part === "slide") {
      if (!slideUrl.trim() || !isValidHttpUrl(slideUrl)) {
        setError("Invalid slide URL");
        return;
      }
      if (slideUrl.trim() === (latest?.slideUrl ?? "").trim()) {
        setSuccess("No changes — version unchanged");
        return;
      }
      run({ slideUrl: slideUrl.trim() }, null, "Slide saved!");
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
      run({ sourceCodeUrl: sourceCodeUrl.trim() }, null, "Source code saved!");
      return;
    }

    if (part === "demo") {
      if (!demo.trim() || !isValidHttpUrl(demo)) {
        setError("Invalid demo URL");
        return;
      }
      if (demo.trim() === (latest?.demoUrl ?? "").trim()) {
        setSuccess("No changes — version unchanged");
        return;
      }
      run({ demoUrl: demo.trim() }, null, "Demo saved!");
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
    run({}, pdfFile, "PDF saved!");
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <SubmissionProgressBar
          percent={submittedParts * 25}
          submittedParts={submittedParts}
          requiredParts={4}
          partStatus={partStatus}
          showPartLabels
          size="sm"
        />
      </div>

      {formLocked && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {lockMessage || roundLockMessage(round)}
        </div>
      )}

      <div className={`flex flex-col gap-4 ${formLocked ? "pointer-events-none opacity-60" : ""}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-seal-text-secondary">
              Slide URL {partStatus.slide ? "✓" : ""}
            </label>
            <input
              value={slideUrl}
              onChange={(e) => setSlideUrl(e.target.value)}
              placeholder="https://docs.google.com/presentation/..."
              className={inputClassName}
            />
          </div>
          <button
            type="button"
            onClick={() => handleSavePart("slide")}
            disabled={isPending}
            className={saveBtnClassName}
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
              className={inputClassName}
            />
          </div>
          <button
            type="button"
            onClick={() => handleSavePart("source")}
            disabled={isPending}
            className={saveBtnClassName}
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
              className={inputClassName}
            />
          </div>
          <button
            type="button"
            onClick={() => handleSavePart("demo")}
            disabled={isPending}
            className={saveBtnClassName}
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
            className={`mt-2 ${saveBtnClassName}`}
          >
            {savingPart === "pdf" ? "Saving..." : "Save PDF"}
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</div>
        )}
      </div>
    </div>
  );
}
