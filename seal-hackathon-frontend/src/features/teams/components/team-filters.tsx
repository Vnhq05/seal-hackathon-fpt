"use client";

import { useTeamFilterStore } from "@/features/teams/store/team-filter.store";
import { useTracks } from "@/features/teams/hooks/use-tracks";

export function TeamFilters() {
  const { search, track, openOnly, setSearch, setTrack, setOpenOnly } =
    useTeamFilterStore();
  const { data: tracksData } = useTracks();
  const tracks = tracksData?.data ?? [];

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
        <div className="relative" style={{ minWidth: 160 }}>
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            className="w-full appearance-none"
            style={{
              backgroundColor: "#eef0f6",
              border: "1px solid rgba(223,226,236,0.8)",
              borderRadius: 8,
              padding: "9px 33px 9px 9px",
              fontSize: 14,
              color: "#0e1528",
              outline: "none",
              lineHeight: "21px",
              cursor: "pointer",
            }}
          >
            <option value="">All Tracks</option>
            {tracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          >
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 1l4 4 4-4"
                stroke="#0e1528"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

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
