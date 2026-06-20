"use client";

import { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { EyeOpenIcon, EyeOffIcon } from "@/features/auth/components/icons";

interface PasswordFieldProps {
  id: string;
  label: string;
  error?: string;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  ref: React.Ref<HTMLInputElement>;
}

export const PasswordField = ({
  id,
  label,
  error,
  ...registration
}: PasswordFieldProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          className="pr-11"
          error={error}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-3 text-seal-text-muted transition-colors hover:text-seal-text focus:outline-none"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOffIcon /> : <EyeOpenIcon />}
        </button>
      </div>
    </div>
  );
};

PasswordField.displayName = "PasswordField";
