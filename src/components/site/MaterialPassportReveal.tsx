import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/utils";
import VideoBackground from "./VideoBackground";

/**
 * Cinematic physical→digital transformation: real material footage swept by
 * a survey scan, framed by measurement brackets and stage labels, resolving
 * into the Material Passport record rendered as `children`.
 */
export default function MaterialPassportReveal({
  video,
  children,
  className,
}: {
  video: { src: string; poster: string; alt: string };
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useScroll({ target: ref, offset: ["start end", "end start"] });
  const progress = useSpring(scroll.scrollYProgress, { stiffness: 80, damping: 26, mass: 0.5 });

  const scanTop = useTransform(progress, [0.12, 0.52], ["8%", "88%"]);
  const scanOpacity = useTransform(progress, [0.08, 0.16, 0.5, 0.62], [0, 1, 1, 0]);
  const bracketScale = useTransform(progress, [0.1, 0.38], [1.18, 1]);
  const bracketOpacity = useTransform(progress, [0.1, 0.3], [0, 1]);
  const recordOpacity = useTransform(progress, [0.5, 0.68], [0, 1]);
  const recordY = useTransform(progress, [0.5, 0.72], [36, 0]);
  const footageScale = useTransform(progress, [0, 1], [1.08, 1]);

  // Stage labels light up sequentially along the transformation chain.
  const labelOpacities = [0, 1, 2, 3].map((index) =>
    useTransform(progress, [0.1 + index * 0.12, 0.24 + index * 0.12], [0.25, 1]),
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Physical material — an explicit stage so the footage, scan and
          labels have room; the record then overlaps its bottom edge. */}
      <div className="relative min-h-[420px] overflow-hidden border border-white/10 sm:min-h-[560px]">
        <motion.div className="absolute inset-0" style={reduceMotion ? undefined : { scale: footageScale }}>
          <VideoBackground
            video={video}
            objectPosition="center 35%"
            overlayClassName="bg-gradient-to-t from-ink-950/75 via-ink-950/20 to-ink-950/30"
          />
        </motion.div>
        {/* Survey scan line */}
        {reduceMotion ? null : (
          <motion.div
            className="pointer-events-none absolute inset-x-0 z-10"
            style={{ top: scanTop, opacity: scanOpacity }}
            aria-hidden="true"
          >
            <div className="h-px w-full bg-loop-300 shadow-[0_0_14px_2px_rgba(82,150,117,0.55)]" />
            <div className="h-10 w-full bg-loop-400/10" />
          </motion.div>
        )}
        {/* Measurement brackets */}
        <div
          className="pointer-events-none absolute inset-5 z-10"
          aria-hidden="true"
        >
          <motion.span
            className="absolute start-0 top-0 h-6 w-6 border-s-2 border-t-2 border-loop-300/70"
            style={reduceMotion ? undefined : { scale: bracketScale, opacity: bracketOpacity }}
          />
          <motion.span
            className="absolute end-0 top-0 h-6 w-6 border-e-2 border-t-2 border-loop-300/70"
            style={reduceMotion ? undefined : { scale: bracketScale, opacity: bracketOpacity }}
          />
          <motion.span
            className="absolute bottom-0 start-0 h-6 w-6 border-b-2 border-s-2 border-loop-300/70"
            style={reduceMotion ? undefined : { scale: bracketScale, opacity: bracketOpacity }}
          />
          <motion.span
            className="absolute bottom-0 end-0 h-6 w-6 border-b-2 border-e-2 border-loop-300/70"
            style={reduceMotion ? undefined : { scale: bracketScale, opacity: bracketOpacity }}
          />
        </div>
        {/* Stage labels along the transformation */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-gradient-to-t from-ink-950/90 to-transparent px-4 pb-3 pt-10">
          {["PHYSICAL MATERIAL", "SURVEY", "EVIDENCE", "DIGITAL RECORD"].map((label, index) => (
            <motion.span
              key={label}
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={reduceMotion ? { opacity: 1 } : { opacity: labelOpacities[index] }}
            >
              <span className={index === 3 ? "text-loop-300" : "text-white/60"}>{label}</span>
              {index < 3 && <span className="ms-4 text-white/25">→</span>}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Digital record resolving out of the footage */}
      <motion.div
        className="relative z-20 -mt-14 px-3 sm:px-6"
        style={reduceMotion ? undefined : { opacity: recordOpacity, y: recordY }}
      >
        {children}
      </motion.div>
    </div>
  );
}
