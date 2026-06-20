import * as React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-seal-text ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
