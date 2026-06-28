import { FAQ_ITEMS } from "@/lib/landing-data";
import { SectionHeading } from "./landing-ui";

export function FaqSection() {
  return (
    <section id="faq" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Frequently Asked Questions"
          description="Common questions about registration, competition format, and participation."
          align="center"
        />

        <div className="mt-10 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group border-2 border-navy/15 bg-seal-surface-sunken open:bg-white open:shadow-[3px_3px_0_0_rgba(12,18,40,0.08)]"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-mono text-sm font-bold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {item.question}
                  <span
                    className="shrink-0 font-mono text-lg text-royal transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-navy/10 px-5 pb-4 pt-2 text-sm leading-relaxed text-seal-text-secondary">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
