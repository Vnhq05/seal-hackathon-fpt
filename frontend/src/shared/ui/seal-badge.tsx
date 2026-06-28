import type { ReactNode } from "react";

type SealBadgeProps = {
  children: ReactNode;
  variant?: "default" | "royal" | "success" | "warning" | "error";
  className?: string;
};

const variantClasses = {
  default: "border-navy/30 bg-seal-surface-sunken text-navy",
  royal: "border-royal/30 bg-royal/10 text-royal",
  success: "border-seal-success/30 bg-seal-success/10 text-seal-success",
  warning: "border-seal-yellow/40 bg-seal-yellow/20 text-navy",
  error: "border-seal-error/30 bg-seal-error/10 text-seal-error",
};

export function SealBadge({
  children,
  variant = "default",
  className = "",
}: SealBadgeProps) {
  return (
    <span
      className={`inline-flex items-center border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
