"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { roundApi, submissionApi } from "@/lib/api";
import type { SubmissionResponse } from "@/lib/api";
import {
  findCurrentRound,
  isRoundOpen,
  roundLockMessage,
  validatePdfFile,
} from "@/features/submissions/utils/round.utils";


function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function StudentSubmissionPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
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

  const currentRound = rounds ? findCurrentRound(rounds) : null;

  const { data: existing } = useQuery({
    queryKey: ["team-submission", currentRound?.id, team?.id],
    queryFn: () => submissionApi.getByTeamOptional(currentRound!.id, team!.id),
    enabled: !!currentRound?.id && !!team?.id,
  });

  const [source, setSource] = useState("");
  const [slide, setSlide] = useState("");
  const [demo, setDemo] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
  const locked = !roundOpen || !isLeader;
  const lockReason = !team
    ? "Bạn chưa có team. Hãy tham gia team trước khi nộp bài."
    : !currentRound
      ? "Không có round nào đang diễn ra."
      : !isLeader
        ? "Chỉ Leader mới được nộp bài."
        : currentRound
          ? roundLockMessage(currentRound)
          : "";

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (!currentRound || !team) throw new Error("Missing round or team");
      return submissionApi.submit(
        currentRound.id,
        {
          sourceCodeUrl: source.trim(),
          slideUrl: slide.trim() || undefined,
          demoUrl: demo.trim(),
        },
        pdfFile,
      );
    },
    onSuccess: (res: SubmissionResponse) => {
      setSuccess(`Đã lưu bài nộp v${res.currentVersion} (${res.status})`);
      setPdfFile(null);
      qc.invalidateQueries({ queryKey: ["team-submission", currentRound?.id, team?.id] });
    },
    onError: (err: Error) => setFormError(err.message),
  });

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
    if (!roundOpen) {
      setFormError(lockReason);
      return;
    }
    if (!source.trim() || !isValidUrl(source)) {
      setFormError("Source code URL không hợp lệ (GitHub, Jira, Confluence, Notion)");
      return;
    }
    if (source.toLowerCase().includes("drive.google.com")) {
      setFormError("Không dùng Google Drive làm nơi chứa source code");
      return;
    }
    if (!demo.trim() || !isValidUrl(demo)) {
      setFormError("Demo Video URL không hợp lệ");
      return;
    }
    if (!existing && !pdfFile) {
      setFormError("Vui lòng upload file PDF");
      return;
    }
    submit();
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
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Nộp bài</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Slide, source code và demo cho round hiện tại.
        </p>
      </div>

      {/* Team + Round info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">Team</div>
          {team && event ? (
            <>
              <div className="mt-1 font-semibold text-seal-text">{team.name}</div>
              <div className="text-xs text-seal-text-muted">{event.name}</div>
              <div className="mt-1 text-xs text-seal-text-secondary">{team.memberCount} thành viên</div>
            </>
          ) : (
            <p className="mt-1 text-sm text-seal-text-muted">Chưa có team</p>
          )}
        </div>
        <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">Round hiện tại</div>
          {currentRound ? (
            <>
              <div className="mt-1 font-semibold text-seal-text">{currentRound.name}</div>
              <div className="text-xs text-seal-text-muted">
                {currentRound.startDate.slice(0, 16).replace("T", " ")} — {currentRound.endDate.slice(0, 16).replace("T", " ")}
              </div>
              <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium ${
                roundOpen ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                {roundOpen ? "Đang mở nộp bài" : "Đã đóng"}
              </span>
            </>
          ) : (
            <p className="mt-1 text-sm text-seal-text-muted">Không có round đang diễn ra</p>
          )}
        </div>
      </div>

      {/* Existing submission status */}
      {existing && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <span className="font-semibold">Đã nộp:</span> v{existing.currentVersion} — {existing.status}
          {existing.latestVersion?.submittedAt && (
            <span className="text-emerald-700"> · {new Date(existing.latestVersion.submittedAt).toLocaleString()}</span>
          )}
        </div>
      )}

      {locked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {lockReason}
        </div>
      )}

      <div className={`border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-6 flex flex-col gap-4 ${locked ? "opacity-60 pointer-events-none" : ""}`}>
        <div>
          <label className="text-xs font-medium text-seal-text-secondary">Slide URL</label>
          <input
            value={slide}
            onChange={(e) => setSlide(e.target.value)}
            disabled={locked}
            placeholder="https://docs.google.com/presentation/..."
            className="mt-1.5 w-full border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] px-3 py-2 text-sm outline-none focus:border-royal/40"
          />
        </div>

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

        <div>
          <label className="text-xs font-medium text-seal-text-secondary">
            PDF {existing ? "(tuỳ chọn khi cập nhật)" : "*"}
          </label>
          <input
            type="file"
            accept="application/pdf"
            disabled={locked}
            onChange={(e) => handlePdfChange(e.target.files?.[0] ?? null)}
            className="mt-1.5 w-full text-sm"
          />
          {pdfError && <p className="mt-1 text-xs text-red-600">{pdfError}</p>}
          {pdfFile && <p className="mt-1 text-xs text-seal-text-muted">Đã chọn: {pdfFile.name}</p>}
          {!pdfFile && existing?.latestVersion?.attachments?.[0] && (
            <p className="mt-1 text-xs text-seal-text-muted">
              File hiện tại: {existing.latestVersion.attachments[0].fileName}
            </p>
          )}
        </div>

        {formError && <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{formError}</div>}
        {success && <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{success}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={locked || isPending}
          className="border-2 border-navy bg-seal-yellow py-2.5 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
        >
          {isPending ? "Đang gửi..." : existing ? "Cập nhật bài nộp" : "Nộp bài"}
        </button>
      </div>
    </div>
  );
}
