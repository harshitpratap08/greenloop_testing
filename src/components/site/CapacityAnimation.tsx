import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/utils";
import VideoBackground from "./VideoBackground";

/**
 * Ledger segments as a share of total capacity, interpolated across the
 * seven keyframes of the A/B story (baseline → A request → A confirmed →
 * B request → B hold → A cancels/released → B confirmed).
 */
const PHASES = 7;
const KEYS = Array.from({ length: PHASES }, (_, i) => i / (PHASES - 1));

const AVAILABLE = [15, 15, 5, 5, 0, 10, 10];
const CONFIRMED_A = [0, 0, 10, 10, 10, 0, 0];
const HELD_B = [0, 0, 0, 0, 5, 5, 0];
const CONFIRMED_B = [0, 0, 0, 0, 0, 0, 5];

const CAPTIONS = [
  "Ledger opens — 15 t available",
  "Project A requests 10 t",
  "A confirmed — 5 t left",
  "Project B requests 8 t",
  "Only 5 t free — B held",
  "A cancels — 10 t released",
  "Rechecked — B confirmed",
];

/**
 * Presentational capacity bar reused by the live scene and the simulation.
 */
export function CapacityBar({
  total,
  confirmed,
  held,
  availableValue,
  showLegend = false,
  className,
}: {
  total: number;
  confirmed: number;
  held: number;
  availableValue: number;
  showLegend?: boolean;
  className?: string;
}) {
  const pct = (v: number) => `${(Math.max(0, v) / total) * 100}%`;
  return (
    <div className={className}>
      <div className="flex h-5 w-full overflow-hidden border border-white/15 bg-white/[0.04]" aria-hidden="true">
        <div className="h-full bg-loop-600 transition-[width] duration-500" style={{ width: pct(confirmed) }} />
        <div className="h-full bg-signal-500/70 transition-[width] duration-500" style={{ width: pct(held) }} />
        <div className="h-full bg-white/10 transition-[width] duration-500" style={{ width: pct(availableValue) }} />
      </div>
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/60">
          <span className="flex items-center gap-2"><span className="size-2 bg-loop-600" aria-hidden="true" />Confirmed {confirmed} t</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-signal-500/70" aria-hidden="true" />Held {held} t</span>
          <span className="flex items-center gap-2"><span className="size-2 bg-white/25" aria-hidden="true" />Available {availableValue} t</span>
        </div>
      )}
    </div>
  );
}

/**
 * Scroll-driven A/B capacity story. A tall section hosts a sticky stage; the
 * ledger bar, numerals and booking badges animate through the exact scripted
 * sequence as the user scrolls. Reduced motion renders the resolved final
 * ledger plus a static storyboard of the sequence.
 */
export default function CapacityAnimation({
  video,
  className,
}: {
  /** Optional receiving-yard footage behind the ledger — makes it a live scene. */
  video?: { src: string; poster: string; alt: string };
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const scroll = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scroll.scrollYProgress, { stiffness: 120, damping: 28, mass: 0.5 });
  const [phase, setPhase] = useState(reduceMotion ? PHASES - 1 : 0);

  useMotionValueEvent(progress, "change", (v) => {
    const idx = Math.min(PHASES - 1, Math.max(0, Math.floor(v * (PHASES - 1) + 0.0001)));
    setPhase((current) => (current === idx ? current : idx));
  });

  const availableNum = useTransform(progress, KEYS, AVAILABLE);
  const confirmedANum = useTransform(progress, KEYS, CONFIRMED_A);
  const heldBNum = useTransform(progress, KEYS, HELD_B);
  const confirmedBNum = useTransform(progress, KEYS, CONFIRMED_B);

  const availableRounded = useTransform(availableNum, (v) => Math.round(v));
  const confirmedARounded = useTransform(confirmedANum, (v) => Math.round(v));
  const heldBRounded = useTransform(heldBNum, (v) => Math.round(v));
  const confirmedBRounded = useTransform(confirmedBNum, (v) => Math.round(v));

  const availableWidth = useTransform(availableNum, (v) => `${(Math.max(0, v) / 15) * 100}%`);
  const confirmedAWidth = useTransform(confirmedANum, (v) => `${(v / 15) * 100}%`);
  const heldBWidth = useTransform(heldBNum, (v) => `${(v / 15) * 100}%`);
  const confirmedBWidth = useTransform(confirmedBNum, (v) => `${(v / 15) * 100}%`);

  const aState =
    phase <= 0 ? "WATCHING" : phase === 1 ? "REQUESTED" : phase <= 4 ? "CONFIRMED" : "CANCELLED";
  const bState =
    phase <= 2 ? "WATCHING" : phase === 3 ? "REQUESTED" : phase === 4 ? "HELD" : phase === 5 ? "RECHECKING" : "CONFIRMED";

  const badgeClass = (state: string) =>
    state === "CONFIRMED"
      ? "border-loop-400/60 bg-loop-500/15 text-loop-300"
      : state === "HELD"
        ? "border-signal-400/60 bg-signal-500/15 text-signal-300"
        : state === "CANCELLED"
          ? "border-white/20 bg-white/[0.04] text-white/40 line-through"
          : state === "RECHECKING"
            ? "border-signal-400/60 bg-signal-500/10 text-signal-200"
            : state === "REQUESTED"
              ? "border-white/30 bg-white/[0.06] text-white"
              : "border-white/15 bg-transparent text-white/40";

  const stage = (
    <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <p className="eyebrow-label text-loop-300">Live capacity · one date, one ledger</p>
      <h3 className="mt-3 font-archivo text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Two projects. One receiving day.
      </h3>

      {/* Ledger */}
      <div className="mt-8 border border-white/15 bg-ink-950/85 p-5 backdrop-blur-sm sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="eyebrow-label text-white/45">Riverstone Aggregates · Receiving slot · Tuesday</p>
            <p className="mt-2 font-archivo text-lg font-bold text-white">Total capacity 15 t</p>
          </div>
          <p className="ledger-numeral text-sm text-white/60">
            AVAILABLE <motion.span className="text-2xl font-semibold text-loop-300">{availableRounded}</motion.span> t
          </p>
        </div>

        <div className="mt-6">
          <div className="flex h-7 w-full overflow-hidden border border-white/15" aria-hidden="true">
            <motion.div className="h-full bg-loop-600" style={reduceMotion ? { width: "0%" } : { width: confirmedAWidth }} />
            <motion.div className="h-full bg-loop-700" style={reduceMotion ? { width: `${(5 / 15) * 100}%` } : { width: confirmedBWidth }} />
            <motion.div className="h-full bg-signal-500/70" style={reduceMotion ? { width: "0%" } : { width: heldBWidth }} />
            <motion.div className="h-full bg-white/10" style={reduceMotion ? { width: `${(10 / 15) * 100}%` } : { width: availableWidth }} />
          </div>
          <div className="mt-3 hidden justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-white/40 sm:flex">
            <span>A confirmed <motion.span className="ledger-numeral text-loop-300">{confirmedARounded}</motion.span> t</span>
            <span>B confirmed <motion.span className="ledger-numeral text-loop-300">{confirmedBRounded}</motion.span> t</span>
            <span>B held <motion.span className="ledger-numeral text-signal-300">{heldBRounded}</motion.span> t</span>
            <span>Free <motion.span className="ledger-numeral text-white/70">{availableRounded}</motion.span> t</span>
          </div>
        </div>

        {/* Project cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="border border-white/15 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-archivo text-base font-bold text-white">Project A</p>
              <span className={cn("border px-2 py-1 font-mono text-[10px] tracking-wide", badgeClass(aState))}>{aState}</span>
            </div>
            <p className="ledger-numeral mt-3 text-sm text-white/60">10 t requested</p>
            <p className="mt-1 text-xs text-white/45">
              {phase <= 1 ? "Waiting on the receiver's check." : phase <= 4 ? "Holding 10 t of Tuesday's yard." : "Load released — 10 t returned to the ledger."}
            </p>
          </div>
          <div className="border border-white/15 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-archivo text-base font-bold text-white">Project B</p>
              <span className={cn("border px-2 py-1 font-mono text-[10px] tracking-wide", badgeClass(bState))}>{bState}</span>
            </div>
            <p className="ledger-numeral mt-3 text-sm text-white/60">8 t requested</p>
            <p className="mt-1 text-xs text-white/45">
              {phase <= 2 ? "Queued behind Project A." : phase === 3 ? "8 t asked — only 5 t free." : phase === 4 ? "5 t held while A's booking stands." : phase === 5 ? "Ledger rechecked after release." : "Confirmed for the released 5 t."}
            </p>
          </div>
        </div>
      </div>

      {/* Story rail */}
      <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {CAPTIONS.slice(1).map((caption, index) => (
          <li
            key={caption}
            className={cn(
              "border p-2.5 font-mono text-[10px] uppercase leading-4 tracking-[0.1em] transition-colors duration-300",
              reduceMotion
                ? "border-white/12 text-white/45"
                : index + 1 <= phase
                  ? "border-loop-400/40 bg-loop-500/10 text-loop-200"
                  : "border-white/10 text-white/35",
            )}
          >
            <span className="ledger-numeral me-1.5 text-white/40">{String(index + 1).padStart(2, "0")}</span>
            {caption}
          </li>
        ))}
      </ol>
    </div>
  );

  if (reduceMotion) {
    return (
      <div className={cn("relative py-20", className)}>
        {video && <VideoBackground video={video} overlayClassName="bg-ink-950/80" />}
        <div className="relative py-10">{stage}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative h-[280vh]", className)}>
      {/* Tall track gives the sticky ledger a real scrub range: the seven
          story phases map onto ~180vh of scroll instead of snapping. */}
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden py-24">
        {video && <VideoBackground video={video} overlayClassName="bg-ink-950/70" />}
        <div className="relative w-full">{stage}</div>
      </div>
    </div>
  );
}
