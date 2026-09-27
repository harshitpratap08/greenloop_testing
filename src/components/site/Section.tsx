import { cn } from "@/utils";
import type { ReactNode } from "react";

/**
 * Editorial section shell — hairline top rule, optional index numeral
 * (01, 02, …) and mono eyebrow, generous asymmetric padding. `band` renders
 * the charcoal full-bleed treatment for dark storytelling sections.
 */
export default function Section({
  children,
  index,
  eyebrow,
  id,
  band = false,
  className,
  innerClassName,
}: {
  children: ReactNode;
  index?: string;
  eyebrow?: string;
  id?: string;
  band?: boolean;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        band
          ? "bg-ink-900 text-white dark:bg-black"
          : "bg-[#F4F2ED] dark:bg-gray-900",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 md:py-24",
          innerClassName,
        )}
      >
        {(index || eyebrow) && (
          <div className="mb-10 flex items-center gap-4">
            {index && (
              <span
                className={cn(
                  "ledger-numeral text-theme-xs font-semibold",
                  band ? "text-white/40" : "text-steel-500",
                )}
              >
                {index}
              </span>
            )}
            {eyebrow && (
              <>
                <span
                  className={cn(
                    "h-px w-10",
                    band ? "bg-white/25" : "bg-steel-300",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "eyebrow-label",
                    band ? "text-white/60" : "text-steel-600 dark:text-steel-400",
                  )}
                >
                  {eyebrow}
                </span>
              </>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
