import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Directional viewport reveal for section entrances. The direction maps to
 * story meaning — sides converging, systems rising, records settling — and
 * is never a generic fade. Reduced motion renders the final state directly.
 */
export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  distance = 48,
  className,
  once = true,
}: {
  children: ReactNode;
  direction?: "up" | "down" | "start" | "end" | "none";
  delay?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset =
    direction === "up"
      ? { y: distance }
      : direction === "down"
        ? { y: -distance }
        : direction === "start"
          ? { x: -distance }
          : direction === "end"
            ? { x: distance }
            : {};

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
