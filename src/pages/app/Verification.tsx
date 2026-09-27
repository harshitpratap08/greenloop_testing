import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import EventLog from "@/components/greenloop/EventLog";
import { eventsForSubjects } from "@/domain/events";
import type { VerificationRecord } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { cn } from "@/utils";
import { motion, AnimatePresence } from "motion/react";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function Verification() {
  const { dataset } = useGreenLoopStore();
  const totalAccepted = dataset.verifications.reduce((total, record) => total + record.acceptedT, 0);
  const totalRejected = dataset.verifications.reduce((total, record) => total + record.rejectedT, 0);

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Verification | GreenLoop"
        description="Evidence-backed reconciliation of planned, dispatched, received, and accepted recovery loads."
      />
      <PageBreadCrumb pageTitle="Verification" />

      {/* Cinematic Verification Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="group relative mb-12 overflow-hidden rounded-sm border border-steel-200 bg-ink-950 p-8 shadow-lg sm:p-12 dark:border-steel-800 dark:bg-black"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Animated Background Image - Weighbridge/Evidence context */}
          <img
            src="/images/site/verify-photo.jpg"
            alt="Verification Evidence"
            onError={(e) => { (e.target as HTMLImageElement).src = "/images/site/auth-concrete.jpg" }}
            className="h-full w-full animate-slow-mo object-cover opacity-30 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/80 to-transparent dark:from-black/95 dark:via-black/70" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow-label text-loop-400">Recovery Chain · Final Record</p>
            <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
              Every recovery claim<br />has evidence.
            </h1>
            <p className="mt-4 text-lg text-white/80 drop-shadow-sm">
              Reconcile what was planned and dispatched with what reached the receiver, what they accepted, and the records that prove it.
            </p>
          </div>
          
          {/* Active Evidence Counter */}
          {dataset.verifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-start gap-1 border-l-2 border-loop-500 pl-6 md:items-end md:border-l-0 md:border-r-2 md:pl-0 md:pr-6 md:text-right"
            >
              <span className="eyebrow-label text-white/60">Total Accepted Recovery</span>
              <span className="ledger-numeral text-5xl font-bold text-loop-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                {totalAccepted.toFixed(1)} <span className="text-3xl text-white/60">t</span>
              </span>
              <span className="mt-2 text-sm text-white/60">{dataset.verifications.length} verified loads</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Global Rejected/Discrepancy Banner */}
      <AnimatePresence>
        {totalRejected > 0 && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-12 overflow-hidden rounded-sm border-l-4 border-signal-500 bg-signal-50 p-6 shadow-sm dark:border-signal-500/50 dark:bg-signal-500/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-archivo text-lg font-bold text-signal-900 dark:text-signal-100">Intake Discrepancies</p>
                <p className="text-sm text-signal-800/80 dark:text-signal-200/80">Across all records, some material was rejected or differed from the dispatched plan.</p>
              </div>
              <div className="text-right">
                <span className="ledger-numeral text-3xl font-bold text-signal-700 dark:text-signal-400">{totalRejected.toFixed(1)} t</span>
                <span className="block text-xs font-medium uppercase tracking-wider text-signal-600 dark:text-signal-500">Rejected Total</span>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {dataset.verifications.map((verification, index) => (
          <motion.div
            key={verification.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.15, duration: 0.6 }}
          >
            <VerificationRecordCard verification={verification} />
          </motion.div>
        ))}

        {dataset.verifications.length === 0 && (
          <section className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-steel-300 bg-white/50 p-16 text-center dark:border-steel-800 dark:bg-white/[0.02]">
            <div className="mb-4 rounded-full bg-steel-100 p-4 dark:bg-steel-900">
              <span className="text-4xl opacity-50">📋</span>
            </div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">No records to reconcile</p>
            <h2 className="mt-3 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Verification evidence appears after receiver intake</h2>
            <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">Dispatch a confirmed load, then record actual and accepted tonnes with weighbridge and intake evidence.</p>
            <Link to="/app/deliveries" className="mt-6 font-semibold text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-600 dark:text-white dark:hover:text-loop-400">View deliveries →</Link>
          </section>
        )}
      </div>
    </div>
  );
}

function VerificationRecordCard({ verification }: { verification: VerificationRecord }) {
  const { dataset } = useGreenLoopStore();
  const material = dataset.materials.find((item) => item.id === verification.materialId);
  const project = material && dataset.projects.find((item) => item.id === material.projectId);
  const receiver = dataset.receivers.find((item) => item.id === verification.receiverId);
  const booking = dataset.bookings.find((item) => item.id === verification.bookingId);
  const events = eventsForSubjects(dataset, [verification.bookingId, verification.id]);
  const dispatchEvent = events.find((event) => event.kind === "load.dispatched");
  const variance = verification.actualT - verification.plannedT;
  const acceptedVsPlan = verification.plannedT > 0
    ? Math.min(100, Math.max(0, (verification.acceptedT / verification.plannedT) * 100))
    : 0;
  
  const milestones = [
    { label: "Planned", value: `${verification.plannedT.toFixed(1)} t`, detail: booking ? formatStamp(booking.createdAt) : "Dispatch plan", complete: true },
    { label: "Dispatched", value: `${verification.plannedT.toFixed(1)} t`, detail: dispatchEvent ? formatStamp(dispatchEvent.at) : "Load dispatched", complete: true },
    { label: "Received", value: `${verification.actualT.toFixed(1)} t`, detail: verification.verifiedAt ? formatStamp(verification.verifiedAt) : "Weighbridge", complete: true },
    { label: "Accepted", value: `${verification.acceptedT.toFixed(1)} t`, detail: verification.status === "verified" ? "Confirmed" : "Not accepted", complete: verification.status === "verified" },
  ];

  return (
    <article className="group overflow-hidden rounded-sm border border-steel-200 bg-white shadow-md transition-shadow hover:shadow-xl dark:border-steel-800 dark:bg-[#0f141a]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-steel-200 bg-gray-50 px-6 py-5 dark:border-steel-800 dark:bg-white/[0.02]">
        <div>
          <p className="eyebrow-label text-steel-500 dark:text-steel-400">Receiver Verification · {verification.id}</p>
          <div className="mt-1 flex items-baseline gap-4">
            <h2 className="ledger-numeral text-2xl font-bold tracking-tight text-ink-900 dark:text-white">{verification.loadRef}</h2>
            <p className="font-archivo text-lg font-semibold uppercase text-loop-600 dark:text-loop-400">
              {TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "Material"} · {receiver?.name ?? verification.receiverId}
            </p>
          </div>
        </div>
        <StatusBadge status={verification.status} size="lg" />
      </div>

      <div className="p-6 sm:p-8">
        {/* Animated Map Context */}
        <div className="relative mb-10 overflow-hidden rounded-sm border border-steel-200 bg-steel-50 p-6 dark:border-steel-800 dark:bg-black/40">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Origin · Project</p>
              <p className="mt-2 font-archivo text-xl font-bold text-ink-900 dark:text-white">{project?.name ?? "Unavailable"}</p>
              <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{project?.location ?? "—"}</p>
            </div>
            
            <div className="flex flex-1 items-center justify-center px-4 md:flex-col">
              <div className="h-px w-full border-t border-dashed border-steel-400 md:h-8 md:w-px md:border-l md:border-t-0 dark:border-steel-600" aria-hidden="true" />
              <div className="shrink-0 px-4 py-2">
                <span className="ledger-numeral rounded-full border border-steel-300 bg-white px-3 py-1 text-sm font-bold text-ink-900 shadow-sm dark:border-steel-700 dark:bg-ink-950 dark:text-white">
                  {receiver?.distanceKm ?? 0} km Route
                </span>
              </div>
              <div className="h-px w-full border-t border-dashed border-steel-400 md:h-8 md:w-px md:border-l md:border-t-0 dark:border-steel-600" aria-hidden="true" />
            </div>
            
            <div className="min-w-0 flex-1 md:text-right">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Destination · Receiver</p>
              <p className="mt-2 font-archivo text-xl font-bold text-ink-900 dark:text-white">{receiver?.name ?? verification.receiverId}</p>
              <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{receiver?.location ?? "—"}</p>
            </div>
          </div>
        </div>

        {/* Load Reconciliation Milestones */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Load Reconciliation Tracker</p>
            {verification.verifiedAt && <p className="ledger-numeral text-sm font-semibold text-loop-600 dark:text-loop-400">Verified {formatStamp(verification.verifiedAt)}</p>}
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-0 h-full w-[2px] bg-steel-200 dark:bg-steel-800 sm:left-0 sm:top-[22px] sm:h-[2px] sm:w-full" />
            <motion.div 
              initial={{ height: 0, width: 0 }}
              whileInView={{ height: "100%", width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-3 top-0 w-[2px] bg-loop-500 sm:left-0 sm:top-[22px] sm:h-[2px]" 
            />
            
            <ol className="relative z-10 grid gap-6 sm:grid-cols-4">
              {milestones.map((milestone, index) => (
                <li key={milestone.label} className="relative flex items-start gap-4 pl-8 sm:flex-col sm:items-start sm:gap-4 sm:pl-0">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: index * 0.2, type: "spring" }}
                    viewport={{ once: true }}
                    className={cn(
                      "absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-[3px] bg-white transition-colors duration-500 sm:relative dark:bg-ink-950",
                      milestone.complete ? "border-loop-500" : "border-steel-300 dark:border-steel-700"
                    )}
                  >
                    {milestone.complete && <div className="h-2.5 w-2.5 rounded-full bg-loop-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                  </motion.div>
                  <div className="sm:pr-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-steel-500 dark:text-gray-500">{milestone.label}</p>
                    <p className={cn("ledger-numeral mt-1 text-2xl font-bold tracking-tight", index === 3 ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-white")}>{milestone.value}</p>
                    <p className="mt-1 text-xs text-steel-500 dark:text-gray-500">{milestone.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Accepted Quantity & Discrepancies */}
        <section className="mt-10 grid gap-8 border-t border-steel-200 pt-10 lg:grid-cols-[1fr_auto] dark:border-steel-800">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Final Accepted Recovery</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="ledger-numeral text-6xl font-bold tracking-tight text-loop-600 dark:text-loop-400">{verification.acceptedT.toFixed(1)}</p>
                  <span className="text-3xl font-medium text-steel-400">t</span>
                </div>
              </div>
              <p className="ledger-numeral rounded-full border border-steel-200 bg-gray-50 px-3 py-1.5 text-sm font-bold text-ink-900 shadow-sm dark:border-steel-700 dark:bg-white/5 dark:text-white">
                {acceptedVsPlan.toFixed(1)}% of planned load
              </p>
            </div>
            
            <div className="relative mt-6 h-5 overflow-hidden rounded-full bg-steel-100 shadow-inner dark:bg-steel-900" role="img" aria-label="Accepted vs planned">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${acceptedVsPlan}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute inset-y-0 bg-loop-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" 
              />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-steel-500 dark:text-gray-500">Accepted tonnes are the final verified recovery figure.</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:w-64">
            <Difference label="Weighbridge Variance" value={`${variance > 0 ? "+" : ""}${variance.toFixed(1)} t`} detail="Received vs planned" isAlert={variance !== 0} />
            <Difference label="Rejected Intake" value={`${verification.rejectedT.toFixed(1)} t`} detail="Received vs accepted" isAlert={verification.rejectedT > 0} />
          </div>
        </section>

        {(verification.rejectReason || variance !== 0 || verification.rejectedT > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 border-l-4 border-signal-500 bg-signal-50 p-5 dark:bg-signal-500/10"
          >
            <p className="text-sm font-bold text-signal-900 dark:text-signal-100">Reconciliation Note</p>
            <p className="mt-2 text-sm leading-relaxed text-signal-800 dark:text-signal-200">
              {verification.rejectReason ?? "A difference is recorded between planned, received, and accepted quantities."}
              {variance !== 0 && <> Received quantity differs from plan by <span className="ledger-numeral font-bold">{variance > 0 ? "+" : ""}{variance.toFixed(1)} t</span>.</>}
            </p>
          </motion.div>
        )}

        {/* Evidence & Logs */}
        <div className="mt-12 grid gap-8 border-t border-steel-200 pt-8 lg:grid-cols-[1.1fr_0.9fr] dark:border-steel-800">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Proof of Recovery</p>
                <h3 className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Attached Evidence</h3>
              </div>
              <span className="ledger-numeral rounded bg-steel-100 px-3 py-1 text-xs font-bold text-steel-600 dark:bg-white/10 dark:text-gray-300">{verification.evidence.length} records</span>
            </div>
            
            {verification.evidence.length > 0 ? (
              <ul className="mt-6 grid gap-4">
                {verification.evidence.map((evidence, i) => (
                  <motion.li 
                    key={evidence.ref ?? evidence.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-steel-200 bg-gray-50 p-4 transition-colors hover:border-loop-400 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-loop-500"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white shadow-sm dark:bg-black">
                        <span className="text-lg">{evidence.kind === "weighbridge-ticket" ? "🧾" : "📸"}</span>
                      </div>
                      <div>
                        <p className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{evidence.label}</p>
                        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-steel-500 dark:text-gray-400">{evidence.kind.replaceAll("-", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <time className="ledger-numeral block text-sm font-semibold text-ink-800 dark:text-gray-200" dateTime={evidence.recordedAt}>{formatStamp(evidence.recordedAt)}</time>
                      {evidence.ref && <span className="ledger-numeral mt-1 block text-xs text-steel-500 dark:text-gray-400">Ref: {evidence.ref}</span>}
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 rounded-sm border-2 border-dashed border-steel-300 bg-white/50 p-8 text-center dark:border-steel-700 dark:bg-white/[0.01]">
                <p className="text-sm font-medium text-steel-500 dark:text-gray-400">No evidence attached to this verification record.</p>
              </div>
            )}
          </section>

          <section>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Record History</p>
            <h3 className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Load Event Trail</h3>
            <div className="mt-6 rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
              <EventLog events={events} limit={6} />
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}

function Difference({ label, value, detail, isAlert = false }: { label: string; value: string; detail: string; isAlert?: boolean }) {
  return (
    <div className={cn(
      "rounded-sm border p-4 shadow-sm",
      isAlert ? "border-signal-200 bg-signal-50 dark:border-signal-500/30 dark:bg-signal-500/10" : "border-steel-200 bg-white dark:border-steel-800 dark:bg-white/[0.02]"
    )}>
      <p className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</p>
      <p className={cn("ledger-numeral mt-2 text-2xl font-bold", isAlert ? "text-signal-700 dark:text-signal-400" : "text-ink-900 dark:text-white")}>{value}</p>
      <p className="mt-1 text-xs text-steel-500 dark:text-gray-500">{detail}</p>
    </div>
  );
}

function formatStamp(iso: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
