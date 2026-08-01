"use client";

import { useQuery } from "@tanstack/react-query";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { roundApi } from "@/lib/api";
import { useTeamSubmission } from "@/features/submissions/hooks/use-team-submission";
import { SubmissionPartsForm } from "@/features/submissions/components/submission-parts-form";
import {
  findCurrentRound,
  isRoundOpen,
  roundLockMessage,
} from "@/features/submissions/utils/round.utils";
import {
  canSubmitInSealPhase,
  isSealPreliminaryRound,
  resolveSealPhase,
  sealPhaseDescription,
} from "@/features/submissions/utils/seal-submission.utils";

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

  const currentRound = rounds ? findCurrentRound(rounds) : null;
  const isSealPrelim =
    !!event && !!currentRound && isSealPreliminaryRound(event.competitionFormat, currentRound);
  const sealPhase = isSealPrelim && currentRound ? resolveSealPhase(currentRound) : null;

  const { data: existing } = useTeamSubmission(currentRound?.id, team?.id);

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

  if (teamsLoading || roundsLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-seal-text">Submit</h1>
        <p className="mt-1 text-sm text-seal-text-secondary">
          Save each part when ready — Slide, GitHub, and Other (any link or file under 5MB).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-navy bg-white p-4 shadow-[4px_4px_0_0_#0c1228]">
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
        <div className="border-2 border-navy bg-white p-4 shadow-[4px_4px_0_0_#0c1228]">
          <div className="text-[11px] font-medium uppercase tracking-wider text-seal-text-muted">
            Current round
          </div>
          {currentRound ? (
            <>
              <div className="mt-1 font-semibold text-seal-text">{currentRound.name}</div>
              <div className="text-xs text-seal-text-muted">
                {currentRound.startDate.slice(0, 16).replace("T", " ")} —{" "}
                {currentRound.endDate.slice(0, 16).replace("T", " ")}
              </div>
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

      {team && currentRound ? (
        <div className="border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]">
          <SubmissionPartsForm
            round={currentRound}
            teamId={team.id}
            existing={existing ?? null}
            locked={locked}
            lockMessage={lockReason || undefined}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {lockReason || "Join a team with an active round to submit."}
        </div>
      )}
    </div>
  );
}
