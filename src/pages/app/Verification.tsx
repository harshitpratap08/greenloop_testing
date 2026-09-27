import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import EventLog from "@/components/greenloop/EventLog";
import { eventsForSubjects } from "@/domain/events";
import type { VerificationRecord } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { cn } from "@/utils";

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
    <>
      <PageMeta
        title="Verification | GreenLoop"
        description="Evidence-backed reconciliation of planned, dispatched, received, and accepted recovery loads."
      />
      <PageBreadCrumb pageTitle="Verification" />

      <header className="mb-8 border-b border-steel-300 pb-6 dark:border-steel-700">
        <p className="eyebrow-label text-steel-600 dark:text-steel-400">Recovery chain · final record</p>
        <h1 className="mt-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">Every recovery claim has evidence.</h1>
        <p className="mt-2 max-w-2xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">
          Reconcile what was planned and dispatched with what reached the receiver, what they accepted, and the records that prove it.
        </p>
        <ol className="mt-6 grid grid-cols-2 border-y border-steel-200 sm:grid-cols-4 dark:border-steel-800" aria-label="Load reconciliation stages">
          {["Planned", "Dispatched", "Received", "Accepted"].map((stage, index) => (
            <li key={stage} className="flex items-center gap-2 border-b border-steel-200 py-3 pe-3 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0 dark:border-steel-800">
              <span className="ledger-numeral text-theme-xs text-steel-500 dark:text-steel-400">0{index + 1}</span>
              <span className="text-theme-xs font-medium text-ink-800 dark:text-gray-200">{stage}</span>
            </li>
          ))}
        </ol>
      </header>

      {dataset.verifications.length > 0 && (
        <section className="mb-8 grid gap-0 border border-loop-700 bg-loop-800 text-white sm:grid-cols-[1fr_auto] dark:border-loop-500/40 dark:bg-loop-950" aria-label="Verified recovery total">
          <div className="p-5 sm:p-6">
            <p className="eyebrow-label text-white/65">Evidence-backed recovery</p>
            <p className="ledger-numeral mt-2 text-4xl font-semibold tracking-tight">{totalAccepted.toFixed(1)} <span className="text-xl">t</span></p>
            <p className="mt-1 text-theme-sm text-white/75">accepted across {dataset.verifications.length} verified {dataset.verifications.length === 1 ? "load" : "loads"}</p>
          </div>
          <div className="flex items-center border-t border-white/15 px-5 py-4 sm:border-s sm:border-t-0 sm:px-6">
            <div>
              <p className="eyebrow-label text-white/55">Recorded differences</p>
              <p className="ledger-numeral mt-2 text-lg font-semibold text-white">{totalRejected.toFixed(1)} t <span className="text-theme-xs font-normal text-white/65">rejected at intake</span></p>
            </div>
          </div>
        </section>
      )}

      <div className="space-y-7">
        {dataset.verifications.map((verification) => (
          <VerificationRecordCard key={verification.id} verification={verification} />
        ))}

        {dataset.verifications.length === 0 && (
          <section className="border border-steel-200 bg-gray-25 p-6 dark:border-steel-800 dark:bg-gray-dark">
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">No records to reconcile</p>
            <h2 className="mt-2 font-archivo text-xl font-semibold text-ink-900 dark:text-white">Verification evidence appears after receiver intake</h2>
            <p className="mt-2 max-w-xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">Dispatch a confirmed load, then record actual and accepted tonnes with weighbridge and intake evidence.</p>
            <Link to="/app/deliveries" className="mt-4 inline-block text-theme-sm font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">View deliveries →</Link>
          </section>
        )}
      </div>
    </>
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
    { label: "Received", value: `${verification.actualT.toFixed(1)} t`, detail: verification.verifiedAt ? formatStamp(verification.verifiedAt) : "Weighbridge record", complete: true },
    { label: "Accepted", value: `${verification.acceptedT.toFixed(1)} t`, detail: verification.status === "verified" ? "Receiver confirmed" : "Not accepted", complete: verification.status === "verified" },
  ];

  return (
    <article className="overflow-hidden border border-steel-200 bg-gray-25 dark:border-steel-800 dark:bg-gray-dark">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-steel-200 bg-steel-50 px-5 py-4 sm:px-6 dark:border-steel-800 dark:bg-white/[0.03]">
        <div>
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">Receiver verification · {verification.id}</p>
          <h2 className="ledger-numeral mt-1 text-xl font-semibold tracking-tight text-ink-900 dark:text-white">{verification.loadRef}</h2>
          <p className="mt-1 font-archivo text-theme-sm font-semibold capitalize text-ink-800 dark:text-gray-200">{TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "Material"} · {receiver?.name ?? verification.receiverId}</p>
        </div>
        <StatusBadge status={verification.status} size="md" />
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Origin · project</p>
            <p className="mt-1 font-archivo text-base font-semibold text-ink-900 dark:text-white">{project?.name ?? "Project unavailable"}</p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{project?.location ?? "—"}</p>
          </div>
          <div className="flex items-center gap-3 text-center md:flex-col">
            <span className="h-px flex-1 border-t border-dashed border-steel-400 md:h-5 md:flex-none md:border-s md:border-t-0 dark:border-steel-600" aria-hidden="true" />
            <div>
              <p className="ledger-numeral text-theme-xs font-semibold text-ink-900 dark:text-white">{receiver?.distanceKm ?? 0} km</p>
              <p className="eyebrow-label mt-0.5 text-steel-500 dark:text-steel-400">Route</p>
            </div>
            <span className="h-px flex-1 border-t border-dashed border-steel-400 md:h-5 md:flex-none md:border-s md:border-t-0 dark:border-steel-600" aria-hidden="true" />
          </div>
          <div className="md:text-end">
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Destination · receiver</p>
            <p className="mt-1 font-archivo text-base font-semibold text-ink-900 dark:text-white">{receiver?.name ?? verification.receiverId}</p>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{receiver?.location ?? "—"}</p>
          </div>
        </div>

        <section className="mt-6" aria-label="Planned to accepted reconciliation">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Load reconciliation</p>
            {verification.verifiedAt && <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">Verified {formatStamp(verification.verifiedAt)}</p>}
          </div>
          <ol className="grid grid-cols-2 border-y border-steel-200 sm:grid-cols-4 dark:border-steel-800">
            {milestones.map((milestone, index) => (
              <li key={milestone.label} className={cn("relative border-b border-steel-200 p-3 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0 sm:p-4 dark:border-steel-800", index === 3 && "bg-loop-50/70 dark:bg-loop-500/5")}>
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 shrink-0 rounded-full", milestone.complete ? "bg-loop-600" : "bg-signal-500")} aria-hidden="true" />
                  <p className="eyebrow-label text-steel-600 dark:text-steel-400">{milestone.label}</p>
                </div>
                <p className={cn("ledger-numeral mt-2 text-xl font-semibold", index === 3 ? "text-loop-700 dark:text-loop-300" : "text-ink-900 dark:text-white")}>{milestone.value}</p>
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{milestone.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-5 grid gap-5 border-b border-steel-200 pb-5 lg:grid-cols-[0.9fr_1.1fr] dark:border-steel-800" aria-label="Accepted quantity reconciliation">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow-label text-steel-600 dark:text-steel-400">Accepted recovery</p>
                <p className="ledger-numeral mt-1 text-4xl font-semibold tracking-tight text-loop-700 dark:text-loop-300">{verification.acceptedT.toFixed(1)} <span className="text-xl">t</span></p>
              </div>
              <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">{acceptedVsPlan.toFixed(1)}% of planned load</p>
            </div>
            <div className="mt-3 h-3 overflow-hidden bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${verification.acceptedT.toFixed(1)} tonnes accepted of ${verification.plannedT.toFixed(1)} planned`}>
              <div className="h-full bg-loop-600 transition-all" style={{ width: `${acceptedVsPlan}%` }} />
            </div>
            <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">Accepted tonnes are the verified recovery figure.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Difference label="Weighbridge variance" value={`${variance > 0 ? "+" : ""}${variance.toFixed(1)} t`} detail="Received vs planned" />
            <Difference label="Not accepted" value={`${verification.rejectedT.toFixed(1)} t`} detail="Received vs accepted" />
          </div>
        </section>

        {(verification.rejectReason || variance !== 0 || verification.rejectedT > 0) && (
          <div className="mt-4 border-s-2 border-signal-400 bg-signal-50/80 px-4 py-3 dark:border-signal-500 dark:bg-signal-500/10">
            <p className="text-theme-xs font-semibold text-signal-800 dark:text-signal-200">Reconciliation note</p>
            <p className="mt-1 text-theme-xs leading-5 text-ink-800 dark:text-gray-200">
              {verification.rejectReason ?? "A difference is recorded between planned, received, and accepted quantities."}
              {variance !== 0 && <> Received quantity differs from plan by <span className="ledger-numeral font-semibold">{variance > 0 ? "+" : ""}{variance.toFixed(1)} t</span>.</>}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section aria-labelledby={`proof-${verification.id}`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow-label text-steel-600 dark:text-steel-400">Proof of recovery</p>
                <h3 id={`proof-${verification.id}`} className="mt-1 font-archivo text-lg font-semibold text-ink-900 dark:text-white">Evidence attached to this load</h3>
              </div>
              <span className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">{verification.evidence.length} records</span>
            </div>
            {verification.evidence.length > 0 ? (
              <ul className="mt-3 divide-y divide-steel-200 border-y border-steel-200 dark:divide-steel-800 dark:border-steel-800">
                {verification.evidence.map((evidence) => (
                  <li key={evidence.ref ?? evidence.label} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={cn("mt-1 size-2 shrink-0 rounded-full", evidence.kind === "weighbridge-ticket" ? "bg-loop-600" : "bg-steel-500")} aria-hidden="true" />
                      <div>
                        <p className="text-theme-sm font-medium text-ink-900 dark:text-white">{evidence.label}</p>
                        <p className="mt-1 text-theme-xs capitalize text-gray-500 dark:text-gray-400">{evidence.kind.replaceAll("-", " ")}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <time className="ledger-numeral block text-theme-xs text-gray-600 dark:text-gray-300" dateTime={evidence.recordedAt}>{formatStamp(evidence.recordedAt)}</time>
                      {evidence.ref && <span className="ledger-numeral mt-1 block text-theme-xs text-gray-500 dark:text-gray-400">{evidence.ref}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border border-steel-200 p-4 text-theme-sm text-gray-500 dark:border-steel-800 dark:text-gray-400">No evidence attached to this verification record.</p>
            )}
          </section>

          <section aria-labelledby={`events-${verification.id}`}>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Record history</p>
            <h3 id={`events-${verification.id}`} className="mt-1 font-archivo text-lg font-semibold text-ink-900 dark:text-white">Load event trail</h3>
            <EventLog events={events} limit={6} className="mt-3 border-s border-steel-300 ps-4 dark:border-steel-700" />
          </section>
        </div>
      </div>
    </article>
  );
}

function Difference({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-signal-200 bg-signal-50/70 p-3 dark:border-signal-500/20 dark:bg-signal-500/5">
      <p className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</p>
      <p className="ledger-numeral mt-1 text-lg font-semibold text-signal-800 dark:text-signal-200">{value}</p>
      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  );
}

function formatStamp(iso: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
