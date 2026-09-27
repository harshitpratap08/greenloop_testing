/**
 * Reports — animated charts answering real questions from the demo dataset.
 *
 * Every figure comes from the domain engine; charts animate on entry and
 * honor reduced-motion (CSS transitions collapse to 0.01ms globally).
 */

import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { FriendlyPageHeader } from "@/components/greenloop/AppExploration";
import type { GreenLoopDataset } from "@/domain/types";
import { useEffect, useState } from "react";

/* Deterministic demo palette — no purple/blue. */
const TYPE_COLORS: Record<string, string> = {
  concrete: "bg-ink-900 dark:bg-white",
  brick: "bg-steel-600 dark:bg-steel-400",
  timber: "bg-steel-400 dark:bg-steel-500",
  steel: "bg-steel-800 dark:bg-steel-300",
  plasterboard: "bg-steel-300 dark:bg-steel-600",
  glass: "bg-gray-500 dark:bg-gray-400",
};

/** Count-up hook: animates 0 → value once mounted; instant under reduced motion. */
function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export default function Reports() {
  const { dataset } = useGreenLoopStore();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <FriendlyPageHeader
        title="Reports"
        subtitle="Six charts, six real questions — every figure from the live dataset."
        className="mb-6 border-b border-gray-200 pb-6 dark:border-gray-800"
        titleClassName="text-3xl tracking-tight sm:text-title-sm"
      />

      <div className="mb-8 overflow-x-auto">
        <ol className="flex min-w-max items-center gap-3 border-y border-gray-200 py-4 dark:border-gray-800" aria-label="Recovery process">
          {FLOW_STAGES.map((stage, index) => (
            <li key={stage} className="flex items-center gap-3">
              <span className={`eyebrow-label ${index === FLOW_STAGES.length - 1 ? "text-loop-600 dark:text-loop-400" : "text-gray-600 dark:text-gray-400"}`}>
                {stage}
              </span>
              {index < FLOW_STAGES.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-gray-300 dark:bg-gray-700 sm:w-10" />}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CompositionChart dataset={dataset} className="lg:col-span-2" />
        <RecoveryFlowChart dataset={dataset} className="lg:col-span-2" />
        <ReceiverCapacityChart dataset={dataset} />
        <ProjectRecoveryChart dataset={dataset} />
        <PlannedActualChart dataset={dataset} />
        <CapacityTimelineChart dataset={dataset} />
      </div>
    </div>
  );
}

/* 1 — What materials do we have? ---------------------------------- */

function CompositionChart({ dataset, className }: { dataset: GreenLoopDataset; className?: string }) {
  const totals = new Map<string, number>();
  for (const m of dataset.materials) {
    totals.set(m.type, (totals.get(m.type) ?? 0) + m.quantityT);
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const animatedGrand = useCountUp(grand);

  return (
    <section className={`border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark sm:p-6 ${className ?? ""}`}>
      <ChartHeader
        question="What materials do we have?"
        note="Surveyed tonnage by material type across all projects."
        figure={`${animatedGrand.toFixed(1)} t`}
      />
      <div className="mt-5 space-y-3">
        {rows.map(([type, t], i) => {
          const pct = (t / grand) * 100;
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-theme-sm capitalize text-ink-800 dark:text-gray-200">{type}</span>
              <div className="h-5 grow overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div
                  className={`h-full ${TYPE_COLORS[type] ?? "bg-steel-400"}`}
                  style={{ width: `${pct}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 80}ms` }}
                  data-width={pct}
                />
              </div>
              <span className="ledger-numeral w-16 shrink-0 text-end text-theme-sm font-semibold text-ink-900 dark:text-white">
                {t.toFixed(1)} t
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* 2 — Where is material in the process? --------------------------- */

const FLOW_STAGES = ["Surveyed", "Matched", "Reserved", "Dispatched", "Verified"] as const;

function RecoveryFlowChart({ dataset, className }: { dataset: GreenLoopDataset; className?: string }) {
  const flow = computeFlow(dataset);
  return (
    <section className={`border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark sm:p-6 ${className ?? ""}`}>
      <ChartHeader
        question="Where is material in the process?"
        note="Tonnage at each lifecycle stage right now."
        figure={`${flow.surveyed.toFixed(1)} t surveyed`}
      />
      <div className="mt-5 flex items-end gap-2 sm:gap-4" aria-label="Recovery flow">
        {FLOW_STAGES.map((stage, i) => {
          const t = flow[stage.toLowerCase() as keyof typeof flow] as number;
          const max = flow.surveyed || 1;
          const h = Math.max(4, Math.round((t / max) * 120));
          return (
            <div key={stage} className="flex flex-1 flex-col items-center gap-2">
              <span className="ledger-numeral text-theme-xs font-semibold text-ink-900 dark:text-white">
                {t.toFixed(1)}
              </span>
              <div
                className={`w-full ${i === FLOW_STAGES.length - 1 ? "bg-loop-500" : "bg-steel-800 dark:bg-steel-300"}`}
                style={{ height: h, transition: "height 700ms cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 90}ms` }}
              />
              <span className="text-center text-theme-xs text-gray-500 dark:text-gray-400">{stage}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function computeFlow(dataset: GreenLoopDataset): Record<string, number> {
  const surveyed = dataset.materials.reduce((s, m) => s + m.quantityT, 0);
  const allocatedIds = new Set(dataset.allocations.map((a) => a.materialId));
  const matched = dataset.materials.filter((m) => allocatedIds.has(m.id)).reduce((s, m) => s + m.quantityT, 0);
  const activeBookings = dataset.bookings.filter((b) => b.status === "confirmed" || b.status === "hold" || b.status === "pending");
  const reserved = activeBookings.reduce((s, b) => s + b.tonnesT, 0);
  // Dispatch is an event, not a booking status: derive dispatched tonnage
  // from the load.dispatched trail (deduped by booking id).
  const dispatchedBookingIds = new Set(
    dataset.events.filter((e) => e.kind === "load.dispatched").flatMap((e) => e.subjectIds.filter((id) => dataset.bookings.some((b) => b.id === id))),
  );
  const dispatched = dataset.bookings
    .filter((b) => dispatchedBookingIds.has(b.id))
    .reduce((s, b) => s + b.tonnesT, 0);
  const verified = dataset.verifications.filter((v) => v.status === "verified").reduce((s, v) => s + v.acceptedT, 0);
  return { surveyed, matched, reserved, dispatched, verified };
}

/* 3 — Where can this material go? --------------------------------- */

function ReceiverCapacityChart({ dataset }: { dataset: GreenLoopDataset }) {
  const totals = dataset.receivers.map((r) => {
    const slots = dataset.slots.filter((s) => s.receiverId === r.id);
    const capacity = slots.reduce((s, slot) => s + slot.capacityT, 0);
    const bookings = dataset.bookings.filter(
      (b) => b.receiverId === r.id && (b.status === "confirmed" || b.status === "hold" || b.status === "pending"),
    );
    const reserved = bookings.reduce((s, b) => s + b.tonnesT, 0);
    return { name: r.name, capacity, reserved, available: capacity - reserved };
  });
  const max = Math.max(...totals.map((t) => t.capacity), 1);

  return (
    <section className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark sm:p-6">
      <ChartHeader
        question="Where can this material go?"
        note="Total 28 Sep intake capacity, reserved vs available."
        figure={`${totals.reduce((s, t) => s + t.available, 0).toFixed(1)} t available`}
      />
      <div className="mt-5 space-y-4">
        {totals.map((t, i) => {
          const reservedPct = (t.reserved / max) * 100;
          const availablePct = (t.available / max) * 100;
          return (
            <div key={t.name}>
              <div className="flex items-baseline justify-between">
                <span className="text-theme-sm text-ink-800 dark:text-gray-200">{t.name}</span>
                <span className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
                  {t.reserved.toFixed(1)} reserved · {t.available.toFixed(1)} free
                </span>
              </div>
              <div className="mt-2 flex h-3 w-full overflow-hidden bg-gray-100 dark:bg-gray-800" style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="h-full bg-ink-900 dark:bg-white" style={{ width: `${reservedPct}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)" }} />
                <div className="h-full bg-loop-500" style={{ width: `${availablePct}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)" }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">
        Dark = reserved · green = available
      </p>
    </section>
  );
}

/* 4 — How are projects progressing? -------------------------------- */

function ProjectRecoveryChart({ dataset }: { dataset: GreenLoopDataset }) {
  const rows = dataset.projects.map((p) => {
    const surveyed = dataset.materials.filter((m) => m.projectId === p.id).reduce((s, m) => s + m.quantityT, 0);
    const verified = dataset.verifications
      .filter((v) => {
        const material = dataset.materials.find((m) => m.id === v.materialId);
        return material?.projectId === p.id;
      })
      .reduce((s, v) => s + v.acceptedT, 0);
    return { name: p.name, surveyed, verified };
  });
  const max = Math.max(...rows.map((r) => r.surveyed), 1);

  return (
    <section className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark sm:p-6">
      <ChartHeader
        question="How are projects progressing?"
        note="Surveyed tonnage vs verified recovery per project."
        figure={`${rows.filter((r) => r.verified > 0).length} verifying`}
      />
      <div className="mt-5 space-y-4">
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="flex items-baseline justify-between">
              <span className="text-theme-sm text-ink-800 dark:text-gray-200">{r.name}</span>
              <span className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
                {r.verified.toFixed(1)} / {r.surveyed.toFixed(1)} t
              </span>
            </div>
            <div className="relative mt-2 h-3 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              <div className="h-full bg-steel-300 dark:bg-steel-700" style={{ width: `${(r.surveyed / max) * 100}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 70}ms` }} />
              <div className="absolute inset-y-0 start-0 h-full bg-loop-500" style={{ width: `${(r.verified / max) * 100}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 70 + 150}ms` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">
        Grey = surveyed · green = verified recovery
      </p>
    </section>
  );
}

/* 5 — What actually arrived? --------------------------------------- */

function PlannedActualChart({ dataset }: { dataset: GreenLoopDataset }) {
  const v = dataset.verifications[0];
  const planned = useCountUp(v?.plannedT ?? 0);
  const actual = useCountUp(v?.actualT ?? 0);
  const accepted = useCountUp(v?.acceptedT ?? 0);
  const rejected = useCountUp(v?.rejectedT ?? 0);
  if (!v) return null;
  const max = v.plannedT || 1;

  const rows: { label: string; value: number; cls: string }[] = [
    { label: "Planned", value: planned, cls: "bg-steel-400" },
    { label: "Actual", value: actual, cls: "bg-ink-900 dark:bg-white" },
    { label: "Accepted", value: accepted, cls: "bg-loop-500" },
    { label: "Rejected", value: rejected, cls: "bg-error-500" },
  ];

  return (
    <section className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark sm:p-6">
      <ChartHeader
        question="What actually arrived?"
        note={`${v.loadRef} at ${dataset.receivers.find((r) => r.id === v.receiverId)?.name}.`}
        figure={`${Math.round((v.acceptedT / v.plannedT) * 100)}% accepted`}
      />
      <div className="mt-5 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-theme-sm text-ink-800 dark:text-gray-200">{r.label}</span>
            <div className="h-5 grow overflow-hidden bg-gray-100 dark:bg-gray-800">
              <div className={`h-full rounded ${r.cls}`} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="ledger-numeral w-16 shrink-0 text-end text-theme-sm font-semibold text-ink-900 dark:text-white">
              {r.value.toFixed(1)} t
            </span>
          </div>
        ))}
      </div>
      {v.rejectReason && (
        <p className="mt-4 text-theme-xs text-error-700 dark:text-error-300">
          Rejected: {v.rejectReason}
        </p>
      )}
    </section>
  );
}

/* 6 — The A/B capacity timeline ------------------------------------ */

interface TimelineStep {
  time: string;
  label: string;
  availableT: number;
  tone: "confirmed" | "hold" | "released" | "recheck";
}

function CapacityTimelineChart({ dataset }: { dataset: GreenLoopDataset }) {
  const story = dataset.bookings;
  const slot = dataset.slots.find((s) => s.id === "SL-R1-CONC-0924");
  const capacity = slot?.capacityT ?? 15;
  const a = story.find((b) => b.id === "BK-1");
  const b = story.find((b) => b.id === "BK-2");

  const steps: TimelineStep[] = [
    { time: "09:05", label: "Project A books 10.0 t — confirmed", availableT: capacity - (a?.tonnesT ?? 10), tone: "confirmed" },
    { time: "09:40", label: "Project B requests 8.0 t — HOLD", availableT: capacity - (a?.tonnesT ?? 10), tone: "hold" },
    { time: "10:15", label: "Project A cancels — 10.0 t released", availableT: capacity, tone: "released" },
    { time: "10:15", label: "Recheck — Project B 8.0 t confirmed", availableT: capacity - (b?.tonnesT ?? 8), tone: "recheck" },
  ];

  return (
    <section className="border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-dark sm:p-6">
      <ChartHeader
        question="How does the ledger resolve conflicts?"
        note={`Riverstone Aggregates ${capacity.toFixed(0)} t concrete slot, 24 Sep — the A/B story.`}
        figure={`${steps[steps.length - 1].availableT.toFixed(1)} t final free`}
      />
      <div className="mt-5 space-y-4">
        {steps.map((s, i) => {
          const usedPct = ((capacity - s.availableT) / capacity) * 100;
          return (
            <div key={i} className="flex items-center gap-4">
              <span className="ledger-numeral w-12 shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">{s.time}</span>
              <div className="grow">
                <p className="text-theme-sm text-ink-800 dark:text-gray-200">{s.label}</p>
                <div className="mt-2 h-2 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full rounded-full ${
                      s.tone === "hold"
                        ? "bg-signal-500"
                        : s.tone === "released"
                          ? "bg-loop-300"
                          : s.tone === "recheck"
                            ? "bg-loop-500"
                            : "bg-ink-900 dark:bg-white"
                    }`}
                    style={{ width: `${usedPct}%`, transition: "width 700ms cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 120}ms` }}
                  />
                </div>
              </div>
              <span className="ledger-numeral w-14 shrink-0 text-end text-theme-xs text-gray-500 dark:text-gray-400">
                {s.availableT.toFixed(1)} t free
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* Shared header ----------------------------------------------------- */

function ChartHeader({ question, note, figure }: { question: string; note: string; figure: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
      <div>
        <h2 className="font-archivo text-lg font-semibold tracking-tight text-ink-900 dark:text-white">{question}</h2>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{note}</p>
      </div>
      <p className="ledger-numeral text-xl font-bold text-ink-900 dark:text-white">{figure}</p>
    </div>
  );
}
