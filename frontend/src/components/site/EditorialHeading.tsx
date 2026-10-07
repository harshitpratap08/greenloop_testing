import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/utils";
import type { ReactNode } from "react";

/**
 * Display heading — Archivo, tight tracking, sizes up to editorial scale.
 * Lines reveal with a clip mask unless reduced motion is requested.
 */
export default function EditorialHeading({
  lines,
  level = 2,
  band = false,
  className,
}: {
  lines: ReactNode[];
  level?: 1 | 2 | 3;
  band?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
  const sizes = {
    1: "text-title-md sm:text-title-lg lg:text-title-xl",
    2: "text-title-md sm:text-title-lg",
    3: "text-title-sm sm:text-title-md",
  } as const;

  return (
    <Tag className={cn("font-archivo font-bold tracking-[-0.02em]", sizes[level], className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={cn("block", band ? "text-white" : "text-ink-900 dark:text-white")}
            initial={reduceMotion ? undefined : { y: "110%" }}
            animate={reduceMotion ? undefined : { y: "0%" }}
            transition={{ duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
