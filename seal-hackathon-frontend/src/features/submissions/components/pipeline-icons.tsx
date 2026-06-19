interface IconProps {
  size?: number;
  color?: string;
}

export function CheckCircleIcon({ size = 15, color = "#4f46e5" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <path d="M5.5 8l1.75 1.75L10.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PencilIcon({ size = 13, color = "#0e1528" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon({ size = 12, color = "rgba(101,217,243,0.2)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 16" fill="none" aria-hidden="true">
      <rect x="1" y="7" width="10" height="8" rx="2" stroke={color} strokeWidth="1.5" />
      <path d="M3 7V5a3 3 0 0 1 6 0v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 12, color = "#8891a5" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <rect x="0.5" y="2" width="11" height="11" rx="1.5" stroke={color} strokeWidth="1" />
      <path d="M0.5 5.5h11M3.5 0.5v2M8.5 0.5v2" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 10, color = "#92400e" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1.2" />
      <path d="M6 3.5V6l2 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CircleIcon({ size = 15, color = "rgba(223,226,236,0.8)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function InfoClockIcon({ size = 13, color = "rgba(101,217,243,0.2)" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.2" />
      <path d="M7 4v3l2 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 10, color = "#000000" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 5h8M6 2l3 3-3 3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadIcon({ size = 16, color = "#0e1528" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 14" fill="none" aria-hidden="true">
      <path d="M11 9l-3-3-3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6v7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.5 10.5A3.5 3.5 0 0 0 10.17 5H9.4A5.5 5.5 0 1 0 2 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RefreshIcon({ size = 10, color = "#8891a5" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1 1v3.5h3.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.76 7.5A5 5 0 1 0 2.64 3.5L1 4.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 12, color = "#8891a5" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M9 6.5v3a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H5.5" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 1.5h3v3" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 7L10.5 1.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
