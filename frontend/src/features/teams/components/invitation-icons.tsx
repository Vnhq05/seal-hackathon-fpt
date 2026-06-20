interface IconProps {
  size?: number;
  color?: string;
}

export function TeamGroupIcon({ size = 24, color = "#4f46e5" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17 20c0-1.657-2.239-3-5-3s-5 1.343-5 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="10"
        r="3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 20c0-1.259-1.17-2.345-2.87-2.808"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 7.132a3 3 0 0 1 0 5.736"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 20c0-1.259 1.17-2.345 2.87-2.808"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 7.132a3 3 0 0 0 0 5.736"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrackPinIcon({ size = 10, color = "#8891a5" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 1C3.79 1 2 2.79 2 5c0 2.76 3.15 5.64 3.7 6.14a.5.5 0 0 0 .6 0C6.85 10.64 10 7.76 10 5c0-2.21-1.79-4-4-4Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
        fill={color}
      />
    </svg>
  );
}

export function PersonPlaceholderIcon({
  size = 18,
  color = "rgba(223,226,236,0.8)",
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="7" r="3" stroke={color} strokeWidth="1.5" />
      <path
        d="M4 17c0-2.761 2.686-5 6-5s6 2.239 6 5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WarningTriangleIcon({
  size = 18,
  color = "#f59e0b",
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.57 3.223c.63-1.098 2.23-1.098 2.86 0l5.79 10.108c.62 1.082-.17 2.419-1.43 2.419H4.21c-1.26 0-2.05-1.337-1.43-2.419L8.57 3.223Z"
        fill={color}
      />
      <path
        d="M10 7.5v3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="13" r="0.75" fill="white" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, color = "#ffffff" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" />
      <path
        d="M5.5 8l1.75 1.75L10.5 6.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XIcon({ size = 12, color = "#ba1a1a" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 3L3 9M3 3l6 6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InfoCircleIcon({ size = 12, color = "#8891a5" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1" />
      <path
        d="M6 5.5V8.5"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="6" cy="4" r="0.5" fill={color} />
    </svg>
  );
}
