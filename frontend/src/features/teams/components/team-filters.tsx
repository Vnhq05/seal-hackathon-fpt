"use client";

import { useTeamFilterStore } from "@/features/teams/store/team-filter.store";

export function TeamFilters() {
  const { search, openOnly, setSearch, setOpenOnly } =
    useTeamFilterStore();

  return (
    <div
      className="flex items-center justify-between rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(223,226,236,0.8)",
        padding: 17,
        filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))",
      }}
    >
      <div className="relative flex-1" style={{ maxWidth: 448 }}>
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2"
          style={{ pointerEvents: "none" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7.5" cy="7.5" r="5.5" stroke="#2dd4bf" strokeWidth="1.5" />
            <path
              d="M12 12l4 4"
              stroke="#2dd4bf"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search teams by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
          style={{
            backgroundColor: "#eef0f6",
            border: "1px solid rgba(223,226,236,0.8)",
            borderRadius: 8,
            padding: "11px 9px 11px 37px",
            fontSize: 14,
            color: "#0e1528",
            outline: "none",
            lineHeight: "normal",
          }}
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={openOnly}
            onClick={() => setOpenOnly(!openOnly)}
            className="relative flex-shrink-0"
            style={{
              width: 44,
              height: 24,
              borderRadius: 9999,
              backgroundColor: openOnly ? "#38bdf8" : "rgba(223,226,236,0.8)",
              transition: "background-color 200ms",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <span
              className="absolute rounded-full"
              style={{
                width: 20,
                height: 20,
                top: 2,
                left: openOnly ? 22 : 2,
                backgroundColor: "#ffffff",
                border: "1px solid rgba(64,145,108,0.25)",
                transition: "left 200ms",
              }}
            />
          </button>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#8891a5",
              letterSpacing: "0.24px",
              lineHeight: "12px",
              whiteSpace: "nowrap",
            }}
          >
            Open teams only
          </span>
        </label>
      </div>
    </div>
  );
}
