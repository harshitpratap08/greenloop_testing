import { slotLedger } from "@shared/domain/capacity";
import { STORY, demoDataset } from "@/domain/demoData";
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion, useInView } from "motion/react";
import { cn } from "@/utils";
import EditorialHeading from "@/components/site/EditorialHeading";
import Reveal from "@/components/site/Reveal";
import Section from "@/components/site/Section";

type Act = 0 | 1 | 2 | 3;

const ACT_TITLES: Record<Act, string> = {
  0: "1 · Two requests",
  1: "2 · A confirms",
  2: "3 · A cancels",
  3: "4 · B rechecked",
};

const ACT_LABELS: Record<Act, string> = {
  0: "Both projects request the same 15 t intake day at Riverstone Aggregates.",
  1: "Project A is confirmed — its tonnage is consumed, 5 t remain free.",
  2: "Project A cancels — its tonnage returns to the ledger automatically.",
  3: "The engine rechecks the held request — Project B's 8 t now fits and confirms.",
};

/**
 * The showpiece: the locked 15-tonne scenario as a four-act story. Act
 * tonnage is read from the demo store (the same dataset the platform uses);
 * the act buttons frame the transitions the engine performs in the app.
 */
export default function CapacityShowpiece() {
  const dataset = demoDataset();
  const [act, setAct] = useState<Act>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-20%" });

  const ledger = slotLedger(dataset, STORY.concreteSlotSept24);
  
  // Auto-play sequence
  useEffect(() => {
    if (!isAutoPlaying || !isInView || reduceMotion) return;
    
    const delay = act === 3 ? 4000 : 2500;
    const timeout = setTimeout(() => {
      setAct((prev) => (prev < 3 ? (prev + 1) as Act : 0));
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [act, isAutoPlaying, isInView, reduceMotion]);

  const handleActClick = (key: Act) => {
    setAct(key);
    setIsAutoPlaying(false);
  };

  if (!ledger) return null;

  // Engine-sourced booking quantities for the scenario slot.
  const bookingA = dataset.bookings.find(
    (b) => b.slotId === STORY.concreteSlotSept24 && b.materialId === "MP-101",
  );
  const bookingB = dataset.bookings.find(
    (b) => b.slotId === STORY.concreteSlotSept24 && b.materialId === "MP-102",
  );
  const aT = bookingA?.tonnesT ?? 0;
  const bT = bookingB?.tonnesT ?? 0;
  const cap = ledger.slot.capacityT;

  const acts: Record<
    Act,
    {
      reserved: number;
      held: number;
      a: "requested" | "confirmed" | "cancelled";
      b: "requested" | "hold" | "recheck" | "confirmed";
    }
  > = {
    0: { reserved: 0, held: 0, a: "requested", b: "requested" },
    1: { reserved: aT, held: bT, a: "confirmed", b: "hold" },
    2: { reserved: 0, held: bT, a: "cancelled", b: "hold" },
    3: { reserved: bT, held: 0, a: "cancelled", b: "confirmed" },
  };
  const current = acts[act];
  const available = Math.max(0, cap - current.reserved - current.held);

  const reservedPct = (current.reserved / cap) * 100;
  const heldPct = (current.held / cap) * 100;

  return (
    <Section id="capacity" index="07" eyebrow="Capacity reservation" band className="scroll-mt-20" innerClassName="py-12 md:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]" ref={containerRef}>
        <div>
          <EditorialHeading
            band
            lines={[
              <>Fifteen tonnes.</>,
              <>Two projects.</>,
              <>One ledger that</>,
              <>
                never <span className="text-loop-400">double-books.</span>
              </>,
            ]}
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              This is the exact interaction the platform performs — reserve,
              hold with a reason, release, recheck. Watch the ledger; the
              tonnage is the engine's, not an animation's.
            </p>
          </Reveal>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Scenario acts">
            {(Object.keys(ACT_TITLES) as unknown as Act[]).map((keyStr) => {
              const key = Number(keyStr) as Act;
              return (
                <button
                  key={key}
                  onClick={() => handleActClick(key)}
                  aria-pressed={act === key}
                  className={cn(
                    "rounded-md border px-3.5 py-2 text-theme-xs font-medium transition-colors relative overflow-hidden",
                    act === key
                      ? "border-white bg-white text-ink-900"
                      : "border-white/25 text-white/70 hover:border-white/50 hover:text-white",
                  )}
                >
                  {ACT_TITLES[key]}
                  {/* Progress indicator when auto-playing */}
                  {act === key && isAutoPlaying && !reduceMotion && (
                    <motion.div 
                      className="absolute bottom-0 left-0 h-[2px] bg-loop-500" 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: key === 3 ? 4 : 2.5, ease: "linear" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-4 min-h-10 max-w-md text-sm text-white/60">{ACT_LABELS[act]}</p>
        </div>

        <Reveal>
          <div className="rounded-lg border border-white/15 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow-label text-white/50">
                Riverstone Aggregates — concrete intake
              </p>
              <p className="ledger-numeral text-theme-xs text-white/50">{ledger.slot.date}</p>
            </div>

            {/* The ledger bar */}
            <div className="mt-6 flex h-14 w-full overflow-hidden rounded-md bg-white/10">
              <motion.div
                className="flex items-center justify-center bg-white"
                animate={reduceMotion ? undefined : { width: `${reservedPct}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={reduceMotion ? { width: `${reservedPct}%` } : undefined}
              >
                {current.reserved >= 8 && (
                  <span className="ledger-numeral text-theme-xs font-semibold text-ink-900">
                    {current.reserved.toFixed(0)} t
                  </span>
                )}
              </motion.div>
              <motion.div
                className="flex items-center justify-center bg-signal-500"
                animate={reduceMotion ? undefined : { width: `${heldPct}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={reduceMotion ? { width: `${heldPct}%` } : undefined}
              >
                {current.held > 0 && (
                  <span className="ledger-numeral text-theme-xs font-semibold text-white">
                    {current.held.toFixed(0)} t
                  </span>
                )}
              </motion.div>
            </div>

            <div className="mt-6 space-y-3">
              <LedgerRow
                label="Project A — Harrow Road Demolition"
                detail={`${aT.toFixed(1)} t crushed concrete`}
                state={current.a === "requested" ? "recheck" : current.a}
                value={
                  current.a === "confirmed"
                    ? `${aT.toFixed(1)} t confirmed`
                    : current.a === "cancelled"
                      ? "released"
                      : "requested"
                }
              />
              <LedgerRow
                label="Project B — Kings Cross Strip-out"
                detail={`${bT.toFixed(1)} t crushed concrete`}
                state={current.b}
                value={
                  current.b === "hold"
                    ? `${bT.toFixed(1)} t on hold`
                    : current.b === "confirmed"
                      ? `${bT.toFixed(1)} t confirmed`
                      : current.b === "recheck"
                        ? "rechecking…"
                        : "requested"
                }
              />
              <div className="border-t border-white/10" aria-hidden="true" />
              <LedgerRow
                label="Available capacity"
                detail="free tonnage on the day"
                state={available > 0 ? "free" : "none"}
                value={`${available.toFixed(1)} t`}
              />
            </div>

            {current.b === "hold" && (
              <p className="mt-5 rounded-md border border-signal-400/40 bg-signal-500/10 p-3 text-theme-xs text-signal-200">
                Reason: insufficient available capacity — {bT.toFixed(1)} t requested,{" "}
                {(cap - aT).toFixed(1)} t available.
              </p>
            )}
            {current.b === "confirmed" && (
              <p className="mt-5 rounded-md border border-loop-400/40 bg-loop-500/10 p-3 text-theme-xs text-loop-200">
                Recheck confirmed — Project B consumed the released capacity automatically.
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function LedgerRow({
  label,
  detail,
  state,
  value,
}: {
  label: string;
  detail: string;
  state: "confirmed" | "hold" | "recheck" | "cancelled" | "free" | "none" | "requested";
  value: string;
}) {
  const stateStyle = {
    confirmed: "text-loop-300",
    hold: "text-signal-300",
    recheck: "text-white/70",
    cancelled: "text-white/40 line-through",
    free: "text-white/85",
    none: "text-white/40",
    requested: "text-white/70",
  }[state];

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            state === "cancelled" ? "text-white/40" : "text-white/85",
          )}
        >
          {label}
        </p>
        <p className="ledger-numeral text-xs text-white/40">{detail}</p>
      </div>
      <p className={cn("ledger-numeral text-sm font-semibold", stateStyle)}>{value}</p>
    </div>
  );
}
