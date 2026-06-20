"use client";

import { useInviteSearch } from "@/features/teams/hooks/use-invite-search";
import { InviteUserCard } from "@/features/teams/components/invite-user-card";

interface InviteSearchResultsProps {
  teamId: string;
  search: string;
}

function ResultSkeleton() {
  return (
    <div
      className="animate-pulse rounded-lg"
      style={{ height: 74, backgroundColor: "#f5f5f5", border: "1px solid rgba(223,226,236,0.8)" }}
    />
  );
}

export function InviteSearchResults({ teamId, search }: InviteSearchResultsProps) {
  const { data, isLoading } = useInviteSearch(teamId, search);
  const candidates = data?.content ?? [];

  if (search.length < 2) return null;

  return (
    <div className="flex flex-col gap-1">
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#8891a5",
          letterSpacing: "0.24px",
          lineHeight: "12px",
          paddingBottom: 8,
        }}
      >
        RESULTS
      </span>

      {isLoading ? (
        <div className="flex flex-col gap-1">
          <ResultSkeleton />
          <ResultSkeleton />
        </div>
      ) : candidates.length === 0 ? (
        <p
          className="py-4 text-center"
          style={{ fontSize: 14, color: "rgba(101,217,243,0.2)" }}
        >
          No participants found
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {candidates.map((c) => (
            <InviteUserCard key={c.id} candidate={c} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  );
}
