import * as React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`block font-mono text-xs font-bold uppercase tracking-wide text-navy ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
