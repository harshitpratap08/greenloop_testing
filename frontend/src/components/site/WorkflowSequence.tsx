import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

/**
 * Sequential workflow with a coordination rail on the inline start: each
 * stage lights up in order while the rail fills and a node travels down it —
 * the process physically progresses rather than text fading in.
 */
export default function WorkflowSequence({
  steps,
  accent = "loop",
  className,
}: {
  steps: string[];
  /** Visual accent for the active rail: provider or receiver side. */
  accent?: "loop" | "steel";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px" });
  const [active, setActive] = useState(reduceMotion ? steps.length : 0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timers = steps.map((_, index) =>
      window.setTimeout(() => setActive(index + 1), 420 * index + 260),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [inView, reduceMotion, steps]);

  const railColor = accent === "loop" ? "bg-loop-400" : "bg-steel-400";
  const activeText = accent === "loop" ? "text-loop-300" : "text-steel-200";

  return (
    <div className={cn("relative ps-7", className)}>
      {/* Coordination rail */}
      <div className="absolute inset-y-2 start-0 w-px bg-white/15" aria-hidden="true">
        {reduceMotion ? (
          <div className={cn("absolute inset-0 w-px", railColor)} />
        ) : (
          <motion.div
            className={cn("absolute start-0 top-0 w-px origin-top", railColor)}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : undefined}
            transition={{ duration: 0.45 * steps.length + 0.6, ease: "easeInOut" }}
          />
        )}
      </div>
      <ol ref={ref} className="divide-y divide-white/[0.07]">
        {steps.map((step, index) => {
          const isActive = index < active;
          return (
            <li key={step} className="relative flex min-h-11 items-center gap-3 py-1.5 text-sm">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -start-7 flex size-3.5 items-center justify-center border transition-colors duration-300",
                  isActive ? "border-transparent" : "border-white/25 bg-ink-950",
                  isActive && accent === "loop" && "bg-loop-400",
                  isActive && accent === "steel" && "bg-steel-400",
                )}
              />
              <span
                className={cn(
                  "ledger-numeral text-xs transition-colors duration-300",
                  isActive ? activeText : "text-white/30",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={cn("transition-colors duration-300", isActive ? "text-white" : "text-white/45")}>
                {step}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    "ms-auto font-mono text-xs transition-colors duration-300",
                    isActive ? "text-loop-300" : "text-white/20",
                  )}
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
