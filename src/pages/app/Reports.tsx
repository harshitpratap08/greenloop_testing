import { useGreenLoopStore } from "@/store/GreenLoopStore";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import type { GreenLoopDataset } from "@/domain/types";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/utils";

const TYPE_COLORS: Record<string, string> = {
  concrete: "bg-ink-900 dark:bg-white",
  brick: "bg-steel-600 dark:bg-steel-400",
  timber: "bg-steel-400 dark:bg-steel-500",
  steel: "bg-steel-800 dark:bg-steel-300",
  plasterboard: "bg-steel-300 dark:bg-steel-600",
  glass: "bg-gray-500 dark:bg-gray-400",
};

const FLOW_STAGES = ["Surveyed", "Matched", "Reserved", "Dispatched", "Verified"] as const;

function useCountUp(target: number, durationMs = 1500): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 4);
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
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Reports | GreenLoop"
        description="Six charts answering real operational questions."
      />
      <PageBreadCrumb pageTitle="Reports" />

      {/* Hero Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10 border-b border-steel-300 pb-8 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">GreenLoop Intelligence</p>
        <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          System Analytics
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Six animated charts answering real questions from the live dataset. Every figure reflects current operations.
        </p>
      </motion.header>

      <div className="mb-10 overflow-x-auto rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
        <ol className="flex min-w-max items-center justify-between gap-4" aria-label="Recovery process">
          {FLOW_STAGES.map((stage, index) => (
            <motion.li 
              key={stage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-1 items-center gap-4"
            >
              <div className="flex flex-col">
                <span className="ledger-numeral text-xs font-bold text-steel-400 dark:text-steel-600">0{index + 1}</span>
                <span className={cn("font-archivo text-sm font-bold uppercase tracking-wider", index === FLOW_STAGES.length - 1 ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-white")}>
                  {stage}
                </span>
              </div>
              {index < FLOW_STAGES.length - 1 && <span aria-hidden="true" className="h-px flex-1 bg-steel-200 dark:bg-steel-700" />}
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <CompositionChart dataset={dataset} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <RecoveryFlowChart dataset={dataset} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
          <ReceiverCapacityChart dataset={dataset} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
          <ProjectRecoveryChart dataset={dataset} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
          <PlannedActualChart dataset={dataset} />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
          <CapacityTimelineChart dataset={dataset} />
        </motion.div>
      </div>
    </div>
  );
}

function CompositionChart({ dataset }: { dataset: GreenLoopDataset }) {
  const totals = new Map<string, number>();
  for (const m of dataset.materials) {
    totals.set(m.type, (totals.get(m.type) ?? 0) + m.quantityT);
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const animatedGrand = useCountUp(grand);

  return (
    <section className="rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
      <ChartHeader
        question="What materials do we have?"
        note="Surveyed tonnage by material type across all projects."
        figure={`${animatedGrand.toFixed(1)} t`}
      />
      <div className="mt-8 space-y-5">
        {rows.map(([type, t], i) => {
          const pct = (t / grand) * 100;
          return (
            <div key={type} className="group flex items-center gap-4">
              <span className="w-32 shrink-0 font-archivo text-sm font-bold uppercase tracking-wider text-ink-900 dark:text-white">{type}</span>
              <div className="h-6 grow overflow-hidden rounded-r-sm bg-steel-100 dark:bg-steel-900">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                  viewport={{ once: true }}
                  className={cn("h-full", TYPE_COLORS[type] ?? "bg-steel-400")}
                />
              </div>
              <span className="ledger-numeral w-20 shrink-0 text-right text-lg font-bold text-ink-900 dark:text-white">
                {t.toFixed(1)} <span className="text-sm text-steel-400">t</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecoveryFlowChart({ dataset }: { dataset: GreenLoopDataset }) {
  const flow = computeFlow(dataset);
  return (
    <section className="rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
      <ChartHeader
        question="Where is material in the process?"
        note="Tonnage at each lifecycle stage right now."
        figure={`${flow.surveyed.toFixed(1)} t surveyed`}
      />
      <div className="mt-12 flex h-72 items-end gap-3 sm:gap-6" aria-label="Recovery flow">
        {FLOW_STAGES.map((stage, i) => {
          const t = flow[stage.toLowerCase() as keyof typeof flow] as number;
          const max = flow.surveyed || 1;
          const hPct = Math.max(2, (t / max) * 100);
          return (
            <div key={stage} className="group relative flex h-full flex-1 flex-col items-center justify-end perspective-1000">
              <span className="ledger-numeral text-sm font-bold text-ink-900 opacity-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-100 dark:text-white mb-3">
                {t.toFixed(1)} t
              </span>
              <div className="relative w-full flex-1 flex flex-col justify-end rounded-t-lg bg-gradient-to-b from-steel-50 to-transparent dark:from-white/[0.05] dark:to-transparent mb-4 border-x border-t border-steel-100 dark:border-white/[0.05]">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: `${hPct}%` }}
                  transition={{ duration: 1.5, type: "spring", bounce: 0.2, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className={cn(
                    "relative w-full rounded-t-lg transition-all duration-300 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_15px_rgba(0,0,0,0.3)] overflow-hidden",
                    i === FLOW_STAGES.length - 1 
                      ? "bg-gradient-to-t from-loop-600 to-loop-400 group-hover:from-loop-500 group-hover:to-loop-300" 
                      : "bg-gradient-to-t from-ink-950 to-ink-800 dark:from-gray-300 dark:to-white group-hover:from-ink-800 group-hover:to-ink-700 dark:group-hover:from-white dark:group-hover:to-gray-200"
                  )}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.2)_0%,transparent_20%,transparent_80%,rgba(0,0,0,0.2)_100%)] mix-blend-overlay" />
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/40" />
                </motion.div>
              </div>
              <span className="text-center text-xs font-bold uppercase tracking-wider text-steel-500 dark:text-gray-400">{stage}</span>
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
  const dispatchedBookingIds = new Set(
    dataset.events.filter((e) => e.kind === "load.dispatched").flatMap((e) => e.subjectIds.filter((id) => dataset.bookings.some((b) => b.id === id))),
  );
  const dispatched = dataset.bookings
    .filter((b) => dispatchedBookingIds.has(b.id))
    .reduce((s, b) => s + b.tonnesT, 0);
  const verified = dataset.verifications.filter((v) => v.status === "verified").reduce((s, v) => s + v.acceptedT, 0);
  return { surveyed, matched, reserved, dispatched, verified };
}

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
    <section className="h-full rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
      <ChartHeader
        question="Where can this material go?"
        note="Total 28 Sep intake capacity, reserved vs available."
        figure={`${totals.reduce((s, t) => s + t.available, 0).toFixed(1)} t free`}
      />
      <div className="mt-8 space-y-6">
        {totals.map((t, i) => {
          const reservedPct = (t.reserved / max) * 100;
          const availablePct = (t.available / max) * 100;
          return (
            <div key={t.name}>
              <div className="flex items-baseline justify-between">
                <span className="font-archivo text-sm font-bold text-ink-900 dark:text-white">{t.name}</span>
                <span className="ledger-numeral text-xs font-medium text-steel-500 dark:text-gray-400">
                  <span className="text-ink-900 dark:text-gray-200">{t.reserved.toFixed(1)} t</span> reserved · {t.available.toFixed(1)} t free
                </span>
              </div>
              <div className="mt-2 flex h-4 w-full overflow-hidden rounded-sm bg-steel-100 dark:bg-steel-900">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${reservedPct}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                  viewport={{ once: true }}
                  className="h-full bg-loop-600 dark:bg-loop-500" 
                />
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${availablePct}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                  viewport={{ once: true }}
                  className="h-full bg-steel-300 dark:bg-steel-700" 
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-steel-500 dark:text-gray-400">
        <span className="flex items-center gap-2"><span className="h-2 w-2 bg-loop-500" /> Reserved</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 bg-steel-300 dark:bg-steel-700" /> Free</span>
      </div>
    </section>
  );
}

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
    <section className="h-full rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
      <ChartHeader
        question="How are projects progressing?"
        note="Surveyed tonnage vs verified recovery per project."
        figure={`${rows.filter((r) => r.verified > 0).length} verifying`}
      />
      <div className="mt-8 space-y-6">
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="flex items-baseline justify-between">
              <span className="font-archivo text-sm font-bold text-ink-900 dark:text-white">{r.name}</span>
              <span className="ledger-numeral text-xs font-medium text-steel-500 dark:text-gray-400">
                <span className="text-loop-600 dark:text-loop-400">{r.verified.toFixed(1)} t</span> / {r.surveyed.toFixed(1)} t
              </span>
            </div>
            <div className="relative mt-2 h-4 w-full overflow-hidden rounded-sm bg-steel-100 dark:bg-steel-900">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.surveyed / max) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
                className="h-full bg-steel-300 dark:bg-steel-700" 
              />
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.verified / max) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute inset-y-0 left-0 h-full bg-loop-500 shadow-[2px_0_10px_rgba(0,0,0,0.1)]" 
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-steel-500 dark:text-gray-400">
        <span className="flex items-center gap-2"><span className="h-2 w-2 bg-steel-300 dark:bg-steel-700" /> Surveyed</span>
        <span className="flex items-center gap-2"><span className="h-2 w-2 bg-loop-500" /> Verified</span>
      </div>
    </section>
  );
}

function PlannedActualChart({ dataset }: { dataset: GreenLoopDataset }) {
  const v = dataset.verifications[0];
  const planned = useCountUp(v?.plannedT ?? 0);
  const actual = useCountUp(v?.actualT ?? 0);
  const accepted = useCountUp(v?.acceptedT ?? 0);
  const rejected = useCountUp(v?.rejectedT ?? 0);
  if (!v) return null;
  const max = v.plannedT || 1;

  const rows = [
    { label: "Planned", value: planned, cls: "bg-steel-400 dark:bg-steel-600" },
    { label: "Actual", value: actual, cls: "bg-ink-900 dark:bg-white" },
    { label: "Accepted", value: accepted, cls: "bg-loop-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" },
    { label: "Rejected", value: rejected, cls: "bg-signal-500" },
  ];

  return (
    <section className="h-full rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
      <ChartHeader
        question="What actually arrived?"
        note={`${v.loadRef} at ${dataset.receivers.find((r) => r.id === v.receiverId)?.name}.`}
        figure={`${Math.round((v.acceptedT / v.plannedT) * 100)}% accepted`}
      />
      <div className="mt-8 space-y-5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-4">
            <span className="w-24 shrink-0 font-archivo text-sm font-bold uppercase tracking-wider text-ink-900 dark:text-gray-200">{r.label}</span>
            <div className="h-6 grow overflow-hidden rounded-r-sm bg-steel-100 dark:bg-steel-900">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.value / max) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
                className={cn("h-full", r.cls)} 
              />
            </div>
            <span className="ledger-numeral w-16 shrink-0 text-right text-lg font-bold text-ink-900 dark:text-white">
              {r.value.toFixed(1)} <span className="text-sm text-steel-400">t</span>
            </span>
          </div>
        ))}
      </div>
      {v.rejectReason && (
        <div className="mt-6 border-l-4 border-signal-500 bg-signal-50 p-4 dark:bg-signal-500/10">
          <p className="text-xs font-bold uppercase tracking-wider text-signal-900 dark:text-signal-100">Rejection Note</p>
          <p className="mt-1 text-sm text-signal-800 dark:text-signal-200">{v.rejectReason}</p>
        </div>
      )}
    </section>
  );
}

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
    <section className="h-full rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
      <ChartHeader
        question="How does the ledger resolve conflicts?"
        note={`Riverstone Aggregates ${capacity.toFixed(0)} t concrete slot — receiving capacity timeline.`}
        figure={`${steps[steps.length - 1].availableT.toFixed(1)} t final free`}
      />
      <div className="mt-8 space-y-6">
        {steps.map((s, i) => {
          const usedPct = ((capacity - s.availableT) / capacity) * 100;
          return (
            <div key={i} className="flex items-center gap-4">
              <span className="ledger-numeral w-12 shrink-0 text-sm font-bold text-steel-500 dark:text-gray-400">{s.time}</span>
              <div className="grow">
                <p className="text-sm font-medium text-ink-900 dark:text-gray-200">{s.label}</p>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-900">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${usedPct}%` }}
                    transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className={cn(
                      "h-full",
                      s.tone === "hold" ? "bg-signal-500" : s.tone === "released" ? "bg-steel-300 dark:bg-steel-600" : s.tone === "recheck" ? "bg-loop-500" : "bg-ink-900 dark:bg-white"
                    )}
                  />
                </div>
              </div>
              <span className="ledger-numeral w-16 shrink-0 text-right text-sm font-bold text-ink-900 dark:text-gray-200">
                {s.availableT.toFixed(1)} <span className="text-steel-400">t</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChartHeader({ question, note, figure }: { question: string; note: string; figure: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-steel-200 pb-5 dark:border-steel-800">
      <div>
        <h2 className="font-archivo text-xl font-bold tracking-tight text-ink-900 dark:text-white">{question}</h2>
        <p className="mt-1 text-sm text-steel-500 dark:text-gray-400">{note}</p>
      </div>
      <p className="ledger-numeral text-2xl font-bold text-ink-900 dark:text-white">{figure}</p>
    </div>
  );
}
