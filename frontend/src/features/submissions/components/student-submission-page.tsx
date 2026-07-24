"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { EventScheduleTimeline } from "@/features/events/components/event-schedule-timeline";
import { useEventSchedule } from "@/features/events/hooks/use-event-schedule";
import { findActiveMilestone } from "@/features/events/utils/schedule.utils";
import { roundApi } from "@/lib/api";
import { openSubmissionAttachment } from "@/lib/files";
import { useTeamSubmission } from "@/features/submissions/hooks/use-team-submission";
import { useSubmitSubmission } from "@/features/submissions/hooks/use-submit-submission";
import {
  findCurrentRound,
  isRoundOpen,
  roundLockMessage,
  validateAnySubmissionFile,
} from "@/features/submissions/utils/round.utils";
import {
  formatCountdown,
  isSealPreliminaryRound,
  isValidHttpUrl,
  msUntil,
  resolveSealPhase,
  sealPhaseDescription,
  sealPhaseLabel,
} from "@/features/submissions/utils/seal-submission.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";
import {
  countSubmissionParts,
  percentForSubmittedParts,
  REQUIRED_SUBMISSION_PARTS,
  submissionPartsFromVersion,
  SubmissionProgressBar,
} from "@/features/progress/components/submission-progress-bar";

type SubmitPart = "slide" | "source" | "other";

export function StudentSubmissionPage() {
  const { user } = useAuthStore();
  const { data: teams, isLoading: teamsLoading } = useMyTeamsAllEvents();
  const active = teams?.find((t) => t.team && t.event.status !== "COMPLETED");
  const team = active?.team ?? null;
  const event = active?.event ?? null;
  const isLeader = team?.leaderId === user?.id;
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: rounds, isLoading: roundsLoading } = useQuery({
    queryKey: ["event-rounds", event?.id],
    queryFn: () => roundApi.list(event!.id),
    enabled: !!event?.id,
  });

  const { data: schedule } = useEventSchedule(
    event?.id,
    !!event?.id && event?.competitionFormat === "SEAL_RAG_2026",
  );

  const currentRound = rounds ? findCurrentRound(rounds) : null;
  const isSealPrelim =
    !!event && !!currentRound && isSealPreliminaryRound(event.competitionFormat, currentRound);
  const sealPhase = isSealPrelim && currentRound ? resolveSealPhase(currentRound) : null;

  const { data: existing } = useTeamSubmission(currentRound?.id, team?.id);

  const [source, setSource] = useState("");
  const [slide, setSlide] = useState("");
  const [otherUrl, setOtherUrl] = useState("");
  const [otherFile, setOtherFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingPart, setSavingPart] = useState<SubmitPart | null>(null);
  const [viewingFile, setViewingFile] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const currentFile = existing?.latestVersion?.attachments?.[0] ?? null;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!existing?.latestVersion) return;
    const version = existing.latestVersion;
    const timer = window.setTimeout(() => {
      setSource(version.sourceCodeUrl ?? version.githubUrl ?? "");
      setSlide(version.slideUrl ?? "");
      setOtherUrl(version.otherUrl ?? version.demoUrl ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [existing?.id, existing?.currentVersion, existing?.latestVersion]);

  const roundOpen = currentRound ? isRoundOpen(currentRound) : false;
  const locked = !roundOpen || !isLeader;

  const lockReason = !team
    ? "You don't have a team yet. Join a team before submitting."
    : !currentRound
      ? "No round is currently active."
      : !isLeader
        ? "Only the team leader can submit."
        : !roundOpen && currentRound
          ? roundLockMessage(currentRound)
          : "";

  const slideCountdown =
    isSealPrelim && currentRound?.slideDeadline
      ? msUntil(currentRound.slideDeadline, now)
      : null;
  const demoCountdown =
    isSealPrelim && currentRound?.submissionDeadline
      ? msUntil(currentRound.submissionDeadline, now)
      : null;

  const activeMilestone = findActiveMilestone(schedule, now);

  const partStatus = useMemo(
    () => submissionPartsFromVersion(existing?.latestVersion),
    [existing?.latestVersion],
  );
  const submittedParts = countSubmissionParts(partStatus);
  const progressPercent = percentForSubmittedParts(submittedParts);

  const { mutate: submit, isPending } = useSubmitSubmission();

  const handleViewFile = async () => {
    if (!currentFile) return;
    setFormError(null);
    setViewingFile(true);
    try {
      await openSubmissionAttachment(currentFile.fileUrl);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not open file");
    } finally {
      setViewingFile(false);
    }
  };

  const handleSavePart = (part: SubmitPart) => {
    setFormError(null);
    setSuccess(null);

    if (locked) {
      setFormError(lockReason);
      return;
    }
    if (!currentRound || !team) return;

    const prevVersion = existing?.currentVersion;
    const latest = existing?.latestVersion;
    const existingSource = (latest?.sourceCodeUrl ?? latest?.githubUrl ?? "").trim();
    const existingOther = (latest?.otherUrl ?? latest?.demoUrl ?? "").trim();

    const versionSavedMessage = (label: string, nextVersion: number) =>
      prevVersion != null && nextVersion === prevVersion
        ? `No changes — still v${nextVersion}`
        : `${label} saved as v${nextVersion}`;

    if (part === "slide") {
      if (!slide.trim() || !isValidHttpUrl(slide)) {
        setFormError("Invalid slide URL");
        return;
      }
      if (slide.trim() === (latest?.slideUrl ?? "").trim()) {
        setSuccess("No changes — version unchanged");
        return;
      }
      setSavingPart("slide");
      submit(
        { roundId: currentRound.id, teamId: team.id, request: { slideUrl: slide.trim() } },
        {
          onSuccess: (res) => {
            setSuccess(versionSavedMessage("Slide", res.currentVersion));
            setSavingPart(null);
          },
          onError: (err: Error) => {
            setFormError(err.message);
            setSavingPart(null);
          },
        },
      );
      return;
    }

    if (part === "source") {
      const sourceError = validateSourceCodeUrl(source);
      if (sourceError) {
        setFormError(sourceError);
        return;
      }
      if (source.trim() === existingSource) {
        setSuccess("No changes — version unchanged");
        return;
      }
      setSavingPart("source");
      submit(
        { roundId: currentRound.id, teamId: team.id, request: { sourceCodeUrl: source.trim() } },
        {
          onSuccess: (res) => {
            setSuccess(versionSavedMessage("Source code", res.currentVersion));
            setSavingPart(null);
          },
          onError: (err: Error) => {
            setFormError(err.message);
            setSavingPart(null);
          },
        },
      );
      return;
    }

    const hasUrl = Boolean(otherUrl.trim());
    const hasFile = Boolean(otherFile);
    if (!hasUrl && !hasFile) {
      setFormError("Provide an Other URL and/or choose any file");
      return;
    }
    if (hasUrl && !isValidHttpUrl(otherUrl)) {
      setFormError("Invalid Other URL");
      return;
    }
    if (otherFile) {
      const fileErr = validateAnySubmissionFile(otherFile);
      if (fileErr) {
        setFormError(fileErr);
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
        roundId: currentRound.id,
        teamId: team.id,
        request: hasUrl ? { otherUrl: otherUrl.trim() } : {},
        file: otherFile,
      },
      {
        onSuccess: (res) => {
          setSuccess(versionSavedMessage("Other", res.currentVersion));
          setOtherFile(null);
          setSavingPart(null);
        },
        onError: (err: Error) => {
          setFormError(err.message);
          setSavingPart(null);
        },
      },
    );
  };

  const handleFileChange = (file: File | null) => {
    setFileError(null);
    if (!file) {
      setOtherFile(null);
      return;
    }
    const err = validateAnySubmissionFile(file);
    if (err) {
      setFileError(err);
      setOtherFile(null);
      return;
    }
    setOtherFile(file);
  };

  if (teamsLoading || roundsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Submit</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Submit each part separately — Slide, GitHub / Source, and Other.
        </p>
      </div>

      <div className="border-2 border-navy bg-white p-4 shadow-[4px_4px_0_0_#0c1228]">
        <p className="text-xs font-medium uppercase tracking-wider text-seal-text-muted">
          Submission progress
        </p>
        <div className="mt-2">
          <SubmissionProgressBar
            percent={progressPercent}
            submittedParts={submittedParts}
            requiredParts={REQUIRED_SUBMISSION_PARTS}
            partStatus={partStatus}
            showPartLabels
          />
        </div>
      </div>

      {isSealPrelim && sealPhase && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">{sealPhaseLabel(sealPhase)}</p>
          <p className="mt-1 text-xs opacity-90">{sealPhaseDescription(sealPhase)}</p>
          {activeMilestone && <p className="mt-2 text-xs font-medium">{activeMilestone.title}</p>}
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs">
            {slideCountdown !== null && slideCountdown > 0 && (
              <span>{formatCountdown(slideCountdown)} until slide deadline</span>
            )}
            {demoCountdown !== null && demoCountdown > 0 && (
              <span>{formatCountdown(demoCountdown)} until submission deadline</span>
            )}
          </div>
        </div>
      )}

      {isSealPrelim && schedule && schedule.length > 0 && (
        <div className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
          <h2 className="font-mono text-base font-bold text-navy">Milestone timeline</h2>
          <EventScheduleTimeline
            schedules={schedule}
            rounds={rounds}
            variant="full"
            highlightTypes={["MILESTONE"]}
            showDayHeaders={false}
            preliminaryRound={currentRound}
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">Team</div>
          {team && event ? (
            <>
              <div className="mt-1 font-semibold text-seal-text">{team.name}</div>
              <div className="text-xs text-seal-text-muted">{event.name}</div>
            </>
          ) : (
            <p className="mt-1 text-sm text-seal-text-muted">No team</p>
          )}
        </div>
        <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">Current round</div>
          {currentRound ? (
            <>
              <div className="mt-1 font-semibold text-seal-text">{currentRound.name}</div>
              <span
                className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${
                  roundOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {roundOpen ? "Open for submission" : "Closed"}
              </span>
            </>
          ) : (
            <p className="mt-1 text-sm text-seal-text-muted">No active round</p>
          )}
        </div>
      </div>

      {existing && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="font-semibold">Latest version:</span> v{existing.currentVersion} — {existing.status}
        </div>
      )}

      {locked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {lockReason}
        </div>
      )}

      <div
        className={`border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 flex flex-col gap-5 ${locked ? "pointer-events-none opacity-60" : ""}`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-seal-text-secondary">
              Slide URL {partStatus.slide ? "✓" : ""}
            </label>
            <input
              value={slide}
              onChange={(e) => setSlide(e.target.value)}
              disabled={locked}
              placeholder="https://docs.google.com/presentation/..."
              className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSavePart("slide")}
            disabled={locked || isPending}
            className="shrink-0 border-2 border-navy bg-seal-yellow px-4 py-2 font-mono text-xs font-bold text-navy disabled:opacity-50"
          >
            {savingPart === "slide" ? "Saving..." : "Save slide"}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-seal-text-secondary">
              GitHub / Source URL {partStatus.source ? "✓" : ""}
            </label>
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={locked}
              placeholder="https://github.com/team/project"
              className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSavePart("source")}
            disabled={locked || isPending}
            className="shrink-0 border-2 border-navy bg-seal-yellow px-4 py-2 font-mono text-xs font-bold text-navy disabled:opacity-50"
          >
            {savingPart === "source" ? "Saving..." : "Save source"}
          </button>
        </div>

        <div className="rounded-lg border border-seal-border bg-seal-surface-elevated/40 p-4">
          <p className="text-xs font-semibold text-seal-text">
            Other {partStatus.other ? "✓" : ""}
          </p>
          <p className="mt-0.5 text-[11px] text-seal-text-muted">
            Any link and/or any file (counts as one progress part). Max file size 25MB.
          </p>
          <div className="mt-3">
            <label className="text-xs font-medium text-seal-text-secondary">Other URL</label>
            <input
              value={otherUrl}
              onChange={(e) => setOtherUrl(e.target.value)}
              disabled={locked}
              placeholder="https://…"
              className="mt-1.5 w-full border-2 border-navy bg-white px-3 py-2 text-sm shadow-[4px_4px_0_0_#0c1228] outline-none focus:border-royal/40"
            />
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
                disabled={viewingFile || locked}
                className="shrink-0 text-xs font-semibold text-royal underline disabled:opacity-50"
              >
                {viewingFile ? "Opening..." : "View"}
              </button>
            </div>
          )}
          <div
            onClick={() => !locked && fileRef.current?.click()}
            className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-seal-border bg-white p-4 text-sm text-seal-text-muted"
          >
            {otherFile ? otherFile.name : "Click to select any file (optional)"}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            disabled={locked}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
          <button
            type="button"
            onClick={() => handleSavePart("other")}
            disabled={locked || isPending}
            className="mt-3 border-2 border-navy bg-seal-yellow px-4 py-2 font-mono text-xs font-bold text-navy disabled:opacity-50"
          >
            {savingPart === "other" ? "Saving..." : "Save Other"}
          </button>
        </div>

        {formError && <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</div>}
        {success && <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{success}</div>}
      </div>
    </div>
  );
}
