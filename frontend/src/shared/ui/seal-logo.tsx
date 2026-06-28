import Link from "next/link";

export const SEAL_LOGO_SRC = "/logo-removebg-preview.png";

type SealLogoMarkProps = {
  size?: number;
  variant?: "light" | "dark";
  className?: string;
};

export function SealLogoMark({
  size = 40,
  variant = "light",
  className = "",
}: SealLogoMarkProps) {
  const colorClass = variant === "light" ? "bg-navy" : "bg-seal-yellow";

  return (
    <span
      role="img"
      aria-label="SEAL Hackathon"
      className={`inline-block shrink-0 ${colorClass} ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${SEAL_LOGO_SRC})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
        maskImage: `url(${SEAL_LOGO_SRC})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
    />
  );
}

export function GridBackground({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 grid-pattern-light ${className}`}
      aria-hidden="true"
    />
  );
}

type PixelLogoProps = {
  size?: "sm" | "md";
  variant?: "light" | "dark";
  href?: string;
};

export function PixelLogo({ size = "md", variant = "light", href }: PixelLogoProps) {
  const logoSize = size === "sm" ? 32 : 40;
  const text = size === "sm" ? "text-base" : "text-lg";
  const markVariant = variant === "dark" ? "dark" : "light";
  const titleClass =
    variant === "dark"
      ? "font-mono text-white"
      : "font-mono text-navy";
  const accentClass = variant === "dark" ? "text-seal-yellow" : "text-royal";

  const content = (
    <div className="flex items-center gap-2.5">
      <SealLogoMark size={logoSize} variant={markVariant} />
      <span className={`${titleClass} ${text} font-bold tracking-tight`}>
        SEAL <span className={accentClass}>Hackathon</span>
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
