export function SealSectionHeading({
  title,
  description,
  align = "left",
}: {
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <h2 className="font-mono text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-3 max-w-2xl text-base leading-relaxed text-seal-text-secondary ${align === "center" ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated Use SealSectionHeading */
export const SectionHeading = SealSectionHeading;
