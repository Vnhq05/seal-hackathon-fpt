interface HackathonAboutProps {
  paragraphs: string[];
}

export function HackathonAbout({ paragraphs }: HackathonAboutProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#0e1528",
          letterSpacing: "-0.24px",
          lineHeight: "31.2px",
        }}
      >
        About the Event
      </h2>
      <div className="flex flex-col gap-2">
        {paragraphs.map((text, i) => (
          <p
            key={i}
            style={{
              fontSize: 14,
              color: "#8891a5",
              lineHeight: "22.75px",
            }}
          >
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
