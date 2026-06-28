import type { HTMLAttributes, ReactNode } from "react";
import { SEAL_BORDER, SEAL_SHADOW_SM } from "./seal-pixel";

type SealCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  shadow?: "sm" | "md" | "lg" | "none";
};

const shadowMap = {
  sm: SEAL_SHADOW_SM,
  md: "shadow-[6px_6px_0_0_#0c1228]",
  lg: "shadow-[8px_8px_0_0_#0c1228]",
  none: "",
};

export function SealCard({
  children,
  className = "",
  shadow = "sm",
  ...props
}: SealCardProps) {
  return (
    <div
      className={`${SEAL_BORDER} bg-white ${shadowMap[shadow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SealCardHeader({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-b-2 border-navy/15 bg-seal-surface-sunken px-5 py-4 sm:px-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SealCardBody({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
