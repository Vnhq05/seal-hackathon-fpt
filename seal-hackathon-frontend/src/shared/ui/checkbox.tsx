import * as React from "react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, id, className = "", ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer select-none items-center gap-2 text-sm text-seal-text-secondary transition-colors hover:text-seal-text"
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={`h-4 w-4 cursor-pointer rounded-sm border-seal-border-dark accent-seal-cyan transition-colors ${className}`}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
