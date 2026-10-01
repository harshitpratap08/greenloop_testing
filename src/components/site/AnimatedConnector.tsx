import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/utils";

/**
 * A coordination line that physically draws itself as the story scrolls,
 * with a node travelling along it — material/demand moving between stages.
 * Horizontal lines draw from the inline start and mirror in RTL.
 */
export default function AnimatedConnector({
  orientation = "vertical",
  className,
  strokeWidth = 2,
  drawSpeed = 0.28,
}: {
  orientation?: "vertical" | "horizontal";
  className?: string;
  strokeWidth?: number;
  /** Share of the scroll range consumed by the draw. */
  drawSpeed?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useScroll({ target: ref, offset: ["start 0.92", "end 0.45"] });
  const progress = useSpring(scroll.scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const length = useTransform(progress, [0, drawSpeed], [0, 100]);
  const lengthPercent = useTransform(length, (v) => `${v}%`);
  const nodeTravel = useTransform(progress, [0, drawSpeed * 2], [0, 100]);
  const nodePercent = useTransform(nodeTravel, (v) => `${v}%`);
  const railThickness = `${strokeWidth}px`;

  if (orientation === "horizontal") {
    return (
      <div ref={ref} className={cn("relative h-8 w-full", className)} aria-hidden="true">
        {/* Rail */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white/15 rtl:scale-x-[-1]" style={{ height: railThickness }} />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 bg-loop-400 rtl:scale-x-[-1]"
          style={reduceMotion ? { insetInlineStart: 0, width: "100%", height: railThickness } : { insetInlineStart: 0, width: lengthPercent, height: railThickness }}
        />
        {/* Travelling load node */}
        <motion.span
          className="absolute top-1/2 size-1.5 -translate-y-1/2 bg-loop-300"
          style={reduceMotion ? { insetInlineStart: "calc(100% - 6px)" } : { insetInlineStart: nodePercent }}
        />
        {/* Soft glow above the drawn line */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-loop-400/25 blur-[2px] rtl:scale-x-[-1]" />
        {/* Measure ticks */}
        {[20, 40, 60, 80].map((tick) => (
          <span key={tick} className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-white/20" style={{ insetInlineStart: `${tick}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative w-px", className)} aria-hidden="true">
      {/* Rail */}
      <div className="absolute inset-y-0 start-0 bg-white/15" style={{ width: railThickness }} />
      <motion.div
        className="absolute start-0 top-0 bg-loop-400"
        style={reduceMotion ? { height: "100%", width: railThickness } : { height: lengthPercent, width: railThickness }}
      />
      {/* Travelling load node */}
      <motion.span
        className="absolute -start-[2.5px] size-1.5 bg-loop-300"
        style={reduceMotion ? { top: "calc(100% - 6px)" } : { top: nodePercent }}
      />
      <div className="absolute inset-y-0 -start-[2.5px] w-1.5 bg-loop-400/20 blur-[3px]" />
    </div>
  );
}
