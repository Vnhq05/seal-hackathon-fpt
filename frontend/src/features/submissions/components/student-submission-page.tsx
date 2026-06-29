"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { EventScheduleTimeline } from "@/features/events/components/event-schedule-timeline";
import { useEventSchedule } from "@/features/events/hooks/use-event-schedule";
import { findActiveMilestone } from "@/features/events/utils/schedule.utils";
import { roundApi } from "@/lib/api";
import { useTeamSubmission } from "@/features/submissions/hooks/use-team-submission";
import { useSubmitSubmission } from "@/features/submissions/hooks/use-submit-submission";
import {
  findCurrentRound,
  isRoundOpen,
  roundLockMessage,
  validatePdfFile,
} from "@/features/submissions/utils/round.utils";
import {
  canSubmitInSealPhase,
  formatCountdown,
  isSealPreliminaryRound,
  isValidHttpUrl,
  msUntil,
  resolveSealPhase,
  sealPhaseDescription,
  sealPhaseLabel,
} from "@/features/submissions/utils/seal-submission.utils";
import { validateSourceCodeUrl } from "@/features/submissions/utils/source-code-url.utils";

export function StudentSubmissionPage() {
  const { user } = useAuthStore();
  const { data: teams, isLoading: teamsLoading } = useMyTeamsAllEvents();
  const active = teams?.find((t) => t.team && t.event.status !== "COMPLETED");
  const team = active?.team ?? null;
  const event = active?.event ?? null;
  const isLeader = team?.leaderId === user?.id;

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
  const [demo, setDemo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
      setDemo(version.demoUrl ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [existing?.id, existing?.currentVersion, existing?.latestVersion]);

  const roundOpen = currentRound ? isRoundOpen(currentRound) : false;
  const sealGateOpen = sealPhase ? canSubmitInSealPhase(sealPhase) : true;
  const locked = !roundOpen || !isLeader || (isSealPrelim && !sealGateOpen);

  const lockReason = !team
    ? "You don't have a team yet. Join a team before submitting."
    : !currentRound
      ? "No round is currently active."
      : !isLeader
        ? "Only the team leader can submit."
        : isSealPrelim && sealPhase === "DEMO_CLOSED"
          ? sealPhaseDescription("DEMO_CLOSED")
          : !roundOpen && currentRound
              ? roundLockMessage(currentRound)
              : "";

  const showSlideOnly = isSealPrelim && sealPhase === "SLIDE_ONLY";
  const showFullFields = !isSealPrelim || sealPhase === "FULL";
  const requirePdf = !isSealPrelim;

  const slideCountdown =
    isSealPrelim && currentRound?.slideDeadline
      ? msUntil(currentRound.slideDeadline, now)
      : null;
  const demoCountdown =
    isSealPrelim && currentRound?.submissionDeadline
      ? msUntil(currentRound.submissionDeadline, now)
      : null;

  const activeMilestone = findActiveMilestone(schedule, now);

  const { mutate: submit, isPending } = useSubmitSubmission();

  const handleSubmitMutation = () => {
    if (!currentRound || !team) return;

    if (showSlideOnly) {
      submit(
        {
          roundId: currentRound.id,
          teamId: team.id,
          request: { slideUrl: slide.trim() },
        },
        {
          onSuccess: (res) => {
            setSuccess(`Submission saved as v${res.currentVersion} (${res.status})`);
            setPdfFile(null);
          },
          onError: (err: Error) => setFormError(err.message),
        },
      );
      return;
    }

    submit(
      {
        roundId: currentRound.id,
        teamId: team.id,
        request: {
          sourceCodeUrl: source.trim() || undefined,
          slideUrl: slide.trim() || undefined,
          demoUrl: demo.trim() || undefined,
        },
        pdfFile: requirePdf ? pdfFile : null,
      },
      {
        onSuccess: (res) => {
          setSuccess(`Submission saved as v${res.currentVersion} (${res.status})`);
          setPdfFile(null);
        },
        onError: (err: Error) => setFormError(err.message),
      },
    );
  };

  const handlePdfChange = (file: File | null) => {
    setPdfError(null);
    if (!file) {
      setPdfFile(null);
      return;
    }
    const err = validatePdfFile(file);
    if (err) {
      setPdfError(err);
      setPdfFile(null);
      return;
    }
    setPdfFile(file);
  };

  const handleSubmit = () => {
    setFormError(null);
    setSuccess(null);

    if (locked) {
      setFormError(lockReason);
      return;
    }

    if (showSlideOnly) {
      if (!slide.trim() || !isValidHttpUrl(slide)) {
        setFormError("Invalid slide URL");
        return;
      }
      handleSubmitMutation();
      return;
    }

    if (showFullFields) {
      const sourceError = validateSourceCodeUrl(source);
      if (sourceError) {
        setFormError(sourceError);
        return;
      }
      if (!slide.trim() || !isValidHttpUrl(slide)) {
        setFormError("Invalid slide URL");
        return;
      }
      if (!demo.trim() || !isValidHttpUrl(demo)) {
        setFormError("Invalid demo video URL");
        return;
      }
      if (requirePdf && !existing && !pdfFile) {
        setFormError("Please upload a PDF file");
        return;
      }
      handleSubmitMutation();
    }
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
          {isSealPrelim
            ? "SEAL Spring 2026 milestone gates — slides before 10:00, full submission before 14:00."
            : "Slides, source code, and demo for the current round."}
        </p>
      </div>

      {isSealPrelim && sealPhase && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            sealGateOpen
              ? "border-blue-200 bg-blue-50 text-blue-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">{sealPhaseLabel(sealPhase)}</p>
          <p className="mt-1 text-xs opacity-90">{sealPhaseDescription(sealPhase)}</p>
          {activeMilestone && (
            <p className="mt-2 text-xs font-medium">{activeMilestone.title}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs">
            {slideCountdown !== null && sealPhase === "SLIDE_ONLY" && slideCountdown > 0 && (
              <span>{formatCountdown(slideCountdown)} until slide deadline (10:00)</span>
            )}
            {demoCountdown !== null && sealPhase === "FULL" && demoCountdown > 0 && (
              <span>{formatCountdown(demoCountdown)} until demo deadline (14:00)</span>
            )}
          </div>
          <p className="mt-2 text-[10px] text-seal-text-muted">
            Server time is authoritative.
          </p>
        </div>
      )}

      {isSealPrelim && schedule && schedule.length > 0 && (
        <div className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
          <h2 className="font-mono text-base font-bold text-navy">Milestone timeline</h2>
          <p className="mt-1 mb-4 text-xs text-seal-text-secondary">
            Milestone 1 (slides) and Milestone 2 (full demo submission) per the SEAL Spring 2026 schedule.
          </p>
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
              <div className="mt-1 text-xs text-seal-text-secondary">{team.memberCount} members</div>
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
              <div className="text-xs text-seal-text-muted">
                {currentRound.startDate.slice(0, 16).replace("T", " ")} —{" "}
                {currentRound.endDate.slice(0, 16).replace("T", " ")}
              </div>
              {isSealPrelim && currentRound.slideDeadline && (
                <div className="mt-1 text-[10px] text-seal-text-muted">
                  Slide: {currentRound.slideDeadline.slice(11, 16)} · Demo:{" "}
                  {currentRound.submissionDeadline.slice(11, 16)}
                </div>
              )}
              <span
                className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${
                  roundOpen && sealGateOpen
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {roundOpen && sealGateOpen ? "Open for submission" : "Closed"}
              </span>
            </>
          ) : (
            <p className="mt-1 text-sm text-seal-text-muted">No active round</p>
          )}
        </div>
      </div>

      {existing && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="font-semibold">Submitted:</span> v{existing.currentVersion} — {existing.status}
          {existing.latestVersion?.submittedAt && (
            <span className="text-emerald-700">
              {" "}
              · {new Date(existing.latestVersion.submittedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {locked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {lockReason}
        </div>
      )}

      <div
        className={`border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 flex flex-col gap-4 ${locked ? "pointer-events-none opacity-60" : ""}`}
      >
        <div>
          <label className="text-xs font-medium text-seal-text-secondary">
            Slide URL {showSlideOnly || showFullFields ? "*" : ""}
          </label>
          <input
            value={slide}
            onChange={(e) => setSlide(e.target.value)}
            disabled={locked}
            placeholder="https://docs.google.com/presentation/..."
            className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm outline-none focus:border-royal/40"
          />
        </div>

        {showFullFields && (
          <>
            <div>
              <label className="text-xs font-medium text-seal-text-secondary">Source Code URL *</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={locked}
                placeholder="https://github.com/team/project"
                className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm outline-none focus:border-royal/40"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-seal-text-secondary">Demo URL *</label>
              <input
                value={demo}
                onChange={(e) => setDemo(e.target.value)}
                disabled={locked}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm outline-none focus:border-royal/40"
              />
            </div>
          </>
        )}

        {requirePdf && (
          <div>
            <label className="text-xs font-medium text-seal-text-secondary">
              PDF {existing ? "(optional when updating)" : "*"}
            </label>
            <input
              type="file"
              accept="application/pdf"
              disabled={locked}
              onChange={(e) => handlePdfChange(e.target.files?.[0] ?? null)}
              className="mt-1.5 w-full text-sm"
            />
            {pdfError && <p className="mt-1 text-xs text-red-600">{pdfError}</p>}
            {pdfFile && <p className="mt-1 text-xs text-seal-text-muted">Selected: {pdfFile.name}</p>}
            {!pdfFile && existing?.latestVersion?.attachments?.[0] && (
              <p className="mt-1 text-xs text-seal-text-muted">
                Current file: {existing.latestVersion.attachments[0].fileName}
              </p>
            )}
          </div>
        )}

        {formError && <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</div>}
        {success && <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{success}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={locked || isPending}
          className="border-2 border-navy bg-seal-yellow py-2.5 font-mono font-bold text-navy shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending
            ? "Submitting..."
            : showSlideOnly
              ? existing
                ? "Update slides"
                : "Submit slides (Milestone 1)"
              : existing
                ? "Update submission"
                : "Submit"}
        </button>
      </div>
    </div>
  );
}
