"use client";

import { useTeamFilterStore } from "@/features/teams/store/team-filter.store";

interface TeamsPaginationProps {
  totalPages: number;
}

export function TeamsPagination({ totalPages }: TeamsPaginationProps) {
  const { page, setPage } = useTeamFilterStore();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center pt-4">
      <div
        className="flex items-center gap-1 rounded-lg"
        style={{
          backgroundColor: "#eef0f6",
          border: "1px solid rgba(223,226,236,0.8)",
          padding: "5px 9px",
          filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
        }}
      >
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="rounded p-1 disabled:opacity-50"
          style={{
            background: "none",
            border: "none",
            cursor: page <= 1 ? "default" : "pointer",
          }}
          aria-label="Previous page"
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
            <path
              d="M5 1L1 5l4 4"
              stroke="#0e1528"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span
          className="px-4"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: "#0e1528",
            lineHeight: "19.5px",
          }}
        >
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded p-1 disabled:opacity-50"
          style={{
            background: "none",
            border: "none",
            cursor: page >= totalPages ? "default" : "pointer",
          }}
          aria-label="Next page"
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" aria-hidden="true">
            <path
              d="M1 1l4 4-4 4"
              stroke="#0e1528"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
