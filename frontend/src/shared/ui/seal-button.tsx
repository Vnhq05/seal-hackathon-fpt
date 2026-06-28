import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  SEAL_BUTTON_DANGER,
  SEAL_BUTTON_GHOST,
  SEAL_BUTTON_PRIMARY,
  SEAL_BUTTON_SECONDARY,
} from "./seal-pixel";

type SealButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type SealButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<SealButtonVariant, string> = {
  primary: SEAL_BUTTON_PRIMARY,
  secondary: SEAL_BUTTON_SECONDARY,
  ghost: SEAL_BUTTON_GHOST,
  danger: SEAL_BUTTON_DANGER,
};

const sizeClasses: Record<SealButtonSize, string> = {
  sm: "h-9 px-4 text-xs gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-sm gap-2.5",
};

type SealButtonBaseProps = {
  children: ReactNode;
  variant?: SealButtonVariant;
  size?: SealButtonSize;
  className?: string;
  isLoading?: boolean;
};

type SealButtonAsButton = SealButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type SealButtonAsLink = SealButtonBaseProps & {
  href: string;
  external?: boolean;
};

export type SealButtonProps = SealButtonAsButton | SealButtonAsLink;

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function SealButton(props: SealButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    className = "",
    isLoading = false,
  } = props;

  const classes = `inline-flex items-center justify-center transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-royal/40 focus-visible:ring-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external || href.startsWith("#") || href.startsWith("mailto:")) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const { disabled, type = "button", ...rest } = props as SealButtonAsButton;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`w-full ${classes}`}
      {...rest}
    >
      {isLoading ? <LoadingSpinner /> : null}
      {children}
    </button>
  );
}

type PixelButtonProps = {
  href: string;
  children: ReactNode;
  variant?: SealButtonVariant;
  className?: string;
  external?: boolean;
};

/** Link-only pixel button (landing page) */
export function PixelButton({
  href,
  children,
  variant = "primary",
  className = "",
  external = false,
}: PixelButtonProps) {
  return (
    <SealButton href={href} variant={variant} className={className} external={external}>
      {children}
    </SealButton>
  );
}
