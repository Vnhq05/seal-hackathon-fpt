"use client";

import { useTeams } from "@/features/teams/hooks/use-teams";
import { useTeamFilterStore } from "@/features/teams/store/team-filter.store";
import { TeamCard } from "@/features/teams/components/team-card";
import { TeamsPagination } from "@/features/teams/components/teams-pagination";

function CardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{
        border: "1px solid rgba(198,198,205,0.3)",
        height: 215,
        backgroundColor: "#fafafa",
      }}
    />
  );
}

function EmptyState() {
  return (
    <div
      className="col-span-2 flex flex-col items-center justify-center rounded-lg py-16 text-center"
      style={{ border: "1px dashed rgba(223,226,236,0.8)", backgroundColor: "#fafafa" }}
    >
      <svg
        width="40"
        height="32"
        viewBox="0 0 40 32"
        fill="none"
        aria-hidden="true"
        className="mb-4"
      >
        <circle cx="14" cy="10" r="5" stroke="rgba(223,226,236,0.8)" strokeWidth="2" />
        <path
          d="M2 28c0-5.5 5.4-10 12-10s12 4.5 12 10"
          stroke="rgba(223,226,236,0.8)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="28" cy="11" r="4" stroke="rgba(223,226,236,0.8)" strokeWidth="2" />
        <path
          d="M38 28c0-4.4-3.6-8-8-8"
          stroke="rgba(223,226,236,0.8)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>
        No teams found
      </p>
      <p
        className="mt-1"
        style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}
      >
        Try adjusting your filters or create a new team.
      </p>
    </div>
  );
}

export function TeamsGrid() {
  const { search, track, openOnly, page } = useTeamFilterStore();

  const { data, isLoading } = useTeams({
    search: search || undefined,
    track: track || undefined,
    openOnly: openOnly || undefined,
    page,
    pageSize: 4,
  });

  const teams = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: "#0e1528",
          lineHeight: "25.2px",
        }}
      >
        All Teams
      </h2>

      <div className="grid grid-cols-2 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : teams.length === 0
            ? <EmptyState />
            : teams.map((team) => <TeamCard key={team.id} team={team} />)}
      </div>

      {!isLoading && teams.length > 0 && (
        <TeamsPagination totalPages={totalPages} />
      )}
    </div>
  );
}
