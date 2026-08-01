"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundResponse, SubmissionResponse } from "@/lib/api";
import { openSubmissionAttachment } from "@/lib/files";
import { useSubmitSubmission } from "@/features/submissions/hooks/use-submit-submission";
import {
  isRoundOpen,
  roundLockMessage,
  validateAnySubmissionFile,
} from "@/features/submissions/utils/round.utils";
import { isValidHttpUrl } from "@/features/submissions/utils/seal-submission.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";
import {
  countSubmissionParts,
  percentForParts,
  REQUIRED_SUBMISSION_PARTS,
  submissionPartsFromVersion,
  SubmissionProgressBar,
} from "@/features/progress/components/submission-progress-bar";

type SubmitPart = "slide" | "source" | "otherLink" | "otherFile";

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
  const [otherUrl, setOtherUrl] = useState("");
  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [viewingFile, setViewingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPart, setSavingPart] = useState<SubmitPart | null>(null);

  useEffect(() => {
    const version = existing?.latestVersion;
    const timer = window.setTimeout(() => {
      setSlideUrl(version?.slideUrl ?? "");
      setSourceCodeUrl(version?.sourceCodeUrl ?? version?.githubUrl ?? "");
      setOtherUrl(version?.otherUrl ?? version?.demoUrl ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [existing?.id, existing?.currentVersion, existing?.latestVersion]);

  const roundOpen = isRoundOpen(round);
  const formLocked = locked || !roundOpen;
  const currentFile = existing?.latestVersion?.attachments?.[0] ?? null;

  const partStatus = useMemo(
    () => submissionPartsFromVersion(existing?.latestVersion),
    [existing?.latestVersion],
  );
  const submittedParts = countSubmissionParts(partStatus);

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

    if (formLocked) {
      setError(lockMessage || roundLockMessage(round));
      return;
    }

    const latest = existing?.latestVersion;
    const existingSource = (latest?.sourceCodeUrl ?? latest?.githubUrl ?? "").trim();
    const existingOther = (latest?.otherUrl ?? latest?.demoUrl ?? "").trim();

    const run = (
      request: { slideUrl?: string; sourceCodeUrl?: string; otherUrl?: string },
      file?: File | null,
      okMessage?: string,
    ) => {
      setSavingPart(part);
      submit(
        { roundId: round.id, teamId, request, file: file ?? null },
        {
          onSuccess: () => {
            setSuccess(okMessage ?? "Saved!");
            if (part === "otherFile") setOtherFile(null);
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

    if (part === "otherLink") {
      if (!otherUrl.trim() || !isValidHttpUrl(otherUrl)) {
        setError("Other URL must be a valid http:// or https:// link");
        return;
      }
      if (otherUrl.trim() === existingOther) {
        setSuccess("No changes — version unchanged");
        return;
      }
      run({ otherUrl: otherUrl.trim() }, null, "Other link saved!");
      return;
    }

    if (!otherFile) {
      setError("Please select a file");
      return;
    }
    const fileErr = validateAnySubmissionFile(otherFile);
    if (fileErr) {
      setError(fileErr);
      return;
    }
    run({}, otherFile, "File saved!");
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <SubmissionProgressBar
          percent={percentForParts(submittedParts)}
          submittedParts={submittedParts}
          requiredParts={REQUIRED_SUBMISSION_PARTS}
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

        <div className="border-t border-seal-border pt-4">
          <p className="mb-3 text-xs text-seal-text-muted">
            Other — any http(s) link and/or any file under 5MB. Either one completes this part.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-seal-text-secondary">
                Other URL {partStatus.otherLink ? "✓" : ""}
              </label>
              <input
                value={otherUrl}
                onChange={(e) => setOtherUrl(e.target.value)}
                placeholder="https://… (any link)"
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={() => handleSavePart("otherLink")}
              disabled={isPending}
              className={saveBtnClassName}
            >
              {savingPart === "otherLink" ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="mt-3">
            <label className="text-xs font-medium text-seal-text-secondary">
              Other file {partStatus.otherFile ? "✓" : ""}
            </label>
            {currentFile && !otherFile && (
              <div className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-seal-border bg-seal-surface-elevated px-3 py-2">
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
                  {viewingFile ? "Opening..." : "View file"}
                </button>
              </div>
            )}
            <div
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-seal-border bg-seal-surface-sunken p-4 text-sm text-seal-text-muted"
            >
              {otherFile ? otherFile.name : "Click to select any file (max 5MB)"}
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
                    e.target.value = "";
                    return;
                  }
                }
                setError(null);
                setOtherFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => handleSavePart("otherFile")}
              disabled={isPending || !otherFile}
              className={`mt-2 ${saveBtnClassName}`}
            >
              {savingPart === "otherFile" ? "Saving..." : "Save file"}
            </button>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-700">{success}</div>
        )}
      </div>
    </div>
  );
}
