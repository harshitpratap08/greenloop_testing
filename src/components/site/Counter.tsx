import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils";

/**
 * Count-up numeral for engine-sourced values. It resolves to the exact real
 * value; animation is a courtesy, never a different number.
 */
export default function Counter({
  value,
  decimals = 1,
  suffix = "",
  duration = 1.2,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(() => (reduceMotion ? value : 0));

  useEffect(() => {
    if (reduceMotion || !inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduceMotion]);

  // Value changes (live store updates) always resolve exactly.
  const shown = inView || reduceMotion ? value : display;

  return (
    <span ref={ref} className={cn("ledger-numeral tabular-nums", className)}>
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
