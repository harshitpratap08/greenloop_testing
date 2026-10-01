import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import EventLog from "@/components/greenloop/EventLog";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { eventsForSubjects } from "@/domain/events";
import type { VerificationRecord } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { cn, formatStamp } from "@/utils";
import { motion, AnimatePresence } from "motion/react";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { materialMediaFor } from "@/config/appMedia";

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
        title="Proof of Recovery | GreenLoop"
        description="Evidence-backed records of loads received and accepted by material receivers."
      />
      <PageBreadCrumb pageTitle="Proof of Recovery" />

      <WorkflowPageHeader
        title="Proof of Recovery"
        description="See what the receiver accepted and the records that prove each load was recovered."
        status={`${dataset.verifications.length} records · ${totalAccepted.toFixed(1)} t accepted · ${totalRejected.toFixed(1)} t rejected`}
      />

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
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">No proof of recovery yet</p>
            <h2 className="mt-3 font-archivo text-2xl font-bold text-ink-900 dark:text-white">A recovery record appears after the receiver checks a load</h2>
            <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">Send an approved load. The receiver records what arrived and accepted tonnes, with Weighbridge Ticket evidence.</p>
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
    <article className="flex flex-col lg:flex-row gap-6 border border-steel-200 bg-white p-6 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white">
      {/* Verified material — the physical load this record closes out */}
      <img
        src={materialMediaFor(material?.type ?? "concrete").src}
        alt=""
        loading="lazy"
        className="hidden h-32 w-44 shrink-0 border border-steel-200 object-cover lg:block dark:border-steel-800"
      />
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400 mb-2">Proof of Recovery</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white uppercase">{TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "Material"}</h2>
            </div>
            <p className="mt-2 text-theme-sm text-steel-600 dark:text-gray-400">
              {receiver?.name ?? verification.receiverId} · <span className="ledger-numeral">Ref: {verification.loadRef}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={verification.status} size="md" />
            <span className="text-xs font-semibold text-steel-600 dark:text-steel-400">{verification.evidence.length} evidence record{verification.evidence.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          <ReconciliationMetric label="Expected" value={`${verification.plannedT.toFixed(1)} t`} detail="Dispatch plan" />
          <ReconciliationMetric label="Received" value={`${verification.actualT.toFixed(1)} t`} detail="Weighbridge" />
          <ReconciliationMetric label="Accepted" value={`${verification.acceptedT.toFixed(1)} t`} detail={`${acceptedVsPlan.toFixed(1)}% of expected`} tone="accepted" />
          <ReconciliationMetric label="Variance" value={`${variance > 0 ? "+" : ""}${variance.toFixed(1)} t`} detail="Received vs expected" tone={variance !== 0 ? "alert" : "normal"} />
          <ReconciliationMetric label="Rejected" value={`${verification.rejectedT.toFixed(1)} t`} detail="Not accepted" tone={verification.rejectedT > 0 ? "alert" : "normal"} />
        </dl>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-steel-600 dark:text-gray-400">
            <span>Accepted against expected</span>
            <span className="ledger-numeral font-semibold">{acceptedVsPlan.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${acceptedVsPlan.toFixed(1)} percent of expected quantity accepted`}>
            <div className="h-full bg-loop-600 dark:bg-loop-500" style={{ width: `${acceptedVsPlan}%` }} />
          </div>
        </div>

        <details className="mt-4 text-xs text-steel-500 dark:text-steel-400">
          <summary className="cursor-pointer font-medium hover:text-ink-900 dark:hover:text-white">View recovery details ▾</summary>
          <div className="mt-4 border-t border-steel-100 pt-4 dark:border-steel-800">
            {/* Animated Map Context */}
            <div className="relative mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 dark:text-white">{project?.name ?? "Unavailable"}</p>
                <p className="mt-1 text-steel-600 dark:text-gray-400">{project?.location ?? "—"}</p>
              </div>
              <div className="flex flex-1 items-center justify-center px-4">
                <span className="ledger-numeral rounded-sm border border-steel-200 px-3 py-1 font-bold text-ink-900 dark:border-steel-700 dark:text-white">
                  {receiver?.distanceKm ?? 0} km Route
                </span>
              </div>
              <div className="min-w-0 flex-1 md:text-right">
                <p className="font-semibold text-ink-900 dark:text-white">{receiver?.name ?? verification.receiverId}</p>
                <p className="mt-1 text-steel-600 dark:text-gray-400">{receiver?.location ?? "—"}</p>
              </div>
            </div>

            {/* Load Reconciliation Milestones */}
            <div className="mb-8 overflow-x-auto pb-4">
              <ol className="flex min-w-max gap-8">
                {milestones.map((milestone) => (
                  <li key={milestone.label} className="relative flex flex-col items-start gap-2">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", milestone.complete ? "border-loop-500 bg-loop-50 text-loop-600" : "border-steel-300 bg-white")}>
                      {milestone.complete && <div className="h-2 w-2 rounded-full bg-loop-500" />}
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wider text-steel-900 dark:text-gray-300">{milestone.label}</p>
                      <p className="ledger-numeral mt-1 text-lg font-bold text-ink-900 dark:text-white">{milestone.value}</p>
                      <p className="mt-1 text-steel-500">{milestone.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Discrepancies */}
            {(verification.rejectReason || variance !== 0 || verification.rejectedT > 0) && (
              <div className="mb-8 border-l-2 border-signal-500 bg-signal-50 p-4 dark:bg-signal-500/10">
                <p className="font-bold text-signal-900 dark:text-signal-100">Reconciliation Note</p>
                <p className="mt-2 leading-relaxed text-signal-800 dark:text-signal-200">
                  {verification.rejectReason ?? "A difference is recorded between planned, received, and accepted quantities."}
                  {variance !== 0 && <> Received quantity differs from plan by <span className="ledger-numeral font-bold">{variance > 0 ? "+" : ""}{variance.toFixed(1)} t</span>.</>}
                </p>
              </div>
            )}

            {/* Evidence */}
            <div>
              <p className="font-bold text-ink-900 dark:text-white mb-3">Attached Evidence ({verification.evidence.length})</p>
              {verification.evidence.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {verification.evidence.map((evidence) => (
                    <li key={evidence.ref ?? evidence.label} className="flex items-center gap-4 rounded-sm border border-steel-200 p-3 dark:border-steel-800">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-steel-100 dark:bg-steel-900">
                        {evidence.kind === "site-photo" && evidence.ref?.startsWith("/images/") ? (
                          <img src={evidence.ref} alt={evidence.label} className="size-full object-cover" />
                        ) : (
                          <span className="text-lg">{evidence.kind === "weighbridge-ticket" ? "🧾" : "📸"}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-ink-900 dark:text-white">{evidence.label}</p>
                        <p className="mt-0.5 text-xs uppercase text-steel-500 dark:text-gray-400">{evidence.kind.replaceAll("-", " ")}</p>
                        <time className="ledger-numeral block text-steel-500" dateTime={evidence.recordedAt}>{formatStamp(evidence.recordedAt)}</time>
                        {evidence.ref && !evidence.ref.startsWith("/images/") && <span className="ledger-numeral mt-1 block text-xs text-steel-500 dark:text-gray-400">Ref: {evidence.ref}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-steel-500">No evidence attached to this verification record.</p>
              )}
            </div>

            <section className="mt-8 border-t border-steel-200 pt-6 dark:border-steel-800">
              <h3 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">Load event trail</h3>
              <div className="mt-4 border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-white/[0.02]">
                <EventLog events={events} limit={6} />
              </div>
            </section>
          </div>
        </details>
      </div>
    </article>
  );
}

function ReconciliationMetric({
  label,
  value,
  detail,
  tone = "normal",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "normal" | "accepted" | "alert";
}) {
  const valueClass = tone === "accepted"
    ? "text-loop-700 dark:text-loop-400"
    : tone === "alert"
      ? "text-signal-700 dark:text-signal-400"
      : "text-ink-900 dark:text-white";

  return (
    <div className="min-w-0 border-s-2 border-steel-200 bg-steel-50 px-3 py-3 dark:border-steel-700 dark:bg-white/[0.03]">
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className={cn("ledger-numeral mt-1 text-xl font-bold", valueClass)}>{value}</dd>
      <p className="mt-1 text-xs text-steel-600 dark:text-gray-400">{detail}</p>
    </div>
  );
}
