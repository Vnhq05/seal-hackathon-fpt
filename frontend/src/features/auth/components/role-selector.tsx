"use client";

import type { UserType } from "@/lib/api/types";

interface RoleSelectorProps {
  value: UserType;
  onChange: (value: UserType) => void;
}

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
        fill={color}
        opacity="0.15"
      />
      <path
        d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12l2.5 2.5 4.5-4.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          { type: "FPT_STUDENT", label: "FPT University Student", Icon: ShieldIcon },
          { type: "EXTERNAL_STUDENT", label: "External Student", Icon: BuildingIcon },
        ] as const
      ).map(({ type, label, Icon }) => {
        const isActive = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-seal-surface px-4 py-4 text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-seal-cyan/40 ${
              isActive
                ? "border-seal-cyan bg-seal-cyan/5 shadow-sm shadow-seal-cyan/10"
                : "border-seal-border hover:border-seal-border-dark hover:bg-seal-surface-elevated"
            }`}
            aria-pressed={isActive}
          >
            <Icon color={isActive ? "var(--color-seal-cyan)" : "var(--color-seal-text-muted)"} />
            <span
              className={`text-[13px] leading-snug ${
                isActive ? "font-semibold text-seal-cyan" : "text-seal-text-secondary"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
