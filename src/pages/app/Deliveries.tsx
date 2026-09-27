import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import type { Booking } from "@/domain/types";
import { cn } from "@/utils";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function Deliveries() {
  const { dataset } = useGreenLoopStore();
  const dispatchable = dataset.bookings.filter((booking) => booking.status === "confirmed");

  return (
    <>
      <PageMeta
        title="Deliveries | GreenLoop"
        description="Track material loads from project dispatch through receiver delivery and evidence."
      />
      <PageBreadCrumb pageTitle="Deliveries" />

      <header className="mb-8 border-b border-steel-300 pb-6 dark:border-steel-700">
        <p className="eyebrow-label text-steel-600 dark:text-steel-400">Recovery network · load tracking</p>
        <h1 className="mt-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">Deliveries in motion</h1>
        <p className="mt-2 max-w-2xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">
          Follow each confirmed load from its project origin, through dispatch, to receiver intake and proof of recovery.
        </p>
        <ol className="mt-6 grid grid-cols-2 border-y border-steel-200 sm:grid-cols-5 dark:border-steel-800" aria-label="Shipment stages">
          {["Project", "Truck / load", "Receiver", "Delivery", "Evidence"].map((step, index) => (
            <li key={step} className="flex items-center gap-2 border-b border-steel-200 py-3 pe-2 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0 dark:border-steel-800">
              <span className="ledger-numeral text-theme-xs text-steel-500 dark:text-steel-400">0{index + 1}</span>
              <span className="text-theme-xs font-medium text-ink-800 dark:text-gray-200">{step}</span>
            </li>
          ))}
        </ol>
      </header>

      {dispatchable.length === 0 ? (
        <section className="border border-steel-200 bg-gray-25 p-6 dark:border-steel-800 dark:bg-gray-dark">
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">No active shipments</p>
          <h2 className="mt-2 font-archivo text-xl font-semibold text-ink-900 dark:text-white">No confirmed bookings ready for delivery</h2>
          <p className="mt-2 max-w-xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">A load enters the delivery record when receiver capacity has been confirmed.</p>
          <Link to="/app/bookings" className="mt-4 inline-block text-theme-sm font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">Review bookings →</Link>
        </section>
      ) : (
        <div className="space-y-8">
          {dispatchable.map((booking) => <LoadCard key={booking.id} booking={booking} />)}
        </div>
      )}
    </>
  );
}

function LoadCard({ booking }: { booking: Booking }) {
  const { dataset, dispatchAction } = useGreenLoopStore();
  const receiver = dataset.receivers.find((item) => item.id === booking.receiverId);
  const material = dataset.materials.find((item) => item.id === booking.materialId);
  const slot = dataset.slots.find((item) => item.id === booking.slotId);
  const verification = dataset.verifications.find((item) => item.bookingId === booking.id);
  const project = material && dataset.projects.find((item) => item.id === material.projectId);
  const events = dataset.events
    .filter((event) => event.subjectIds.includes(booking.id) || event.subjectIds.includes(booking.allocationId) || event.subjectIds.includes(verification?.id ?? ""))
    .sort((a, b) => a.at.localeCompare(b.at));
  const dispatchEvent = events.find((event) => event.kind === "load.dispatched");
  const loadRef = verification?.loadRef ?? dispatchEvent?.summary.split(" ")[0] ?? `LOAD-${booking.id.replace("BK-", "10")}`;
  const currentStatus = verification?.status ?? (dispatchEvent ? "dispatched" : "confirmed");
  const stages = [
    { label: "Project ready", detail: project?.name ?? "Project origin", complete: true },
    { label: "Load dispatched", detail: dispatchEvent ? formatStamp(dispatchEvent.at) : "Awaiting dispatch", complete: Boolean(dispatchEvent) },
    { label: "Receiver arrival", detail: verification ? formatStamp(verification.verifiedAt ?? "") : receiver?.name ?? "Awaiting arrival", complete: Boolean(verification) },
    { label: "Delivery checked", detail: verification ? `${verification.actualT.toFixed(1)} t weighed` : "Awaiting weighbridge", complete: Boolean(verification) },
    { label: "Evidence recorded", detail: verification?.evidence.length ? `${verification.evidence.length} records attached` : "Awaiting intake evidence", complete: Boolean(verification?.evidence.length) },
  ];

  return (
    <article className="overflow-hidden border border-steel-200 bg-gray-25 dark:border-steel-800 dark:bg-gray-dark">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-steel-200 bg-steel-50 px-5 py-4 sm:px-6 dark:border-steel-800 dark:bg-white/[0.03]">
        <div>
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">Shipment record · {booking.id}</p>
          <h2 className="ledger-numeral mt-1 text-xl font-semibold tracking-tight text-ink-900 dark:text-white">{loadRef}</h2>
          <p className="mt-1 font-archivo text-base font-semibold capitalize text-ink-800 dark:text-gray-200">{booking.tonnesT.toFixed(1)} t {TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "material"}</p>
        </div>
        <StatusBadge status={currentStatus} size="md" />
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center" aria-label="Shipment route">
          <RouteStop label="Origin · project" title={project?.name ?? "Project unavailable"} detail={project?.location ?? "—"} />
          <div className="flex items-center gap-2 text-center sm:flex-col">
            <div className="h-px flex-1 border-t border-dashed border-steel-400 sm:h-8 sm:flex-none sm:border-s sm:border-t-0 dark:border-steel-600" aria-hidden="true" />
            <div className="shrink-0">
              <p className="ledger-numeral text-theme-sm font-semibold text-ink-900 dark:text-white">{receiver?.distanceKm ?? 0} km</p>
              <p className="eyebrow-label mt-0.5 text-steel-500 dark:text-steel-400">Route</p>
            </div>
            <div className="h-px flex-1 border-t border-dashed border-steel-400 sm:h-8 sm:flex-none sm:border-s sm:border-t-0 dark:border-steel-600" aria-hidden="true" />
          </div>
          <RouteStop label="Destination · receiver" title={receiver?.name ?? "Receiver unavailable"} detail={receiver?.location ?? "—"} align="end" />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-steel-200 py-4 sm:grid-cols-4 dark:border-steel-800">
          <LoadMetric label="Material" value={TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "—"} />
          <LoadMetric label="Planned quantity" value={`${booking.tonnesT.toFixed(1)} t`} />
          <LoadMetric label="Intake slot" value={slot?.date ?? "—"} />
          <LoadMetric label="Received / accepted" value={verification ? `${verification.actualT.toFixed(1)} / ${verification.acceptedT.toFixed(1)} t` : "Awaiting arrival"} />
        </dl>

        <section className="mt-5" aria-label="Load progress">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Shipment progress</p>
            {verification && <p className="ledger-numeral text-theme-xs text-loop-700 dark:text-loop-300">{verification.acceptedT.toFixed(1)} t accepted at receiver</p>}
          </div>
          <ol className="grid gap-0 sm:grid-cols-5">
            {stages.map((stage, index) => (
              <li key={stage.label} className="relative flex gap-3 border-s border-steel-300 pb-4 ps-4 last:border-s-0 last:pb-0 sm:block sm:border-s-0 sm:border-t sm:pb-0 sm:ps-0 sm:pe-3 dark:border-steel-700">
                <span className={cn("absolute -start-[0.32rem] top-0.5 size-2.5 border sm:-top-[0.32rem] sm:start-0", stage.complete ? "border-loop-600 bg-loop-600" : "border-steel-400 bg-gray-25 dark:border-steel-600 dark:bg-gray-dark")} aria-hidden="true" />
                <span className="block sm:pt-3">
                  <span className={cn("block text-theme-xs font-semibold", stage.complete ? "text-ink-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>{stage.label}</span>
                  <span className="mt-1 block text-theme-xs leading-5 text-gray-500 dark:text-gray-400">{stage.detail}</span>
                </span>
                {index < stages.length - 1 && <span className="sr-only">then</span>}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 grid gap-6 border-t border-steel-200 pt-5 lg:grid-cols-[0.9fr_1.1fr] dark:border-steel-800">
          <section aria-labelledby={`evidence-${booking.id}`}>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Delivery evidence</p>
            <h3 id={`evidence-${booking.id}`} className="mt-1 font-archivo text-base font-semibold text-ink-900 dark:text-white">Receiver record</h3>
            {verification?.evidence.length ? (
              <ul className="mt-3 divide-y divide-steel-200 border-y border-steel-200 dark:divide-steel-800 dark:border-steel-800">
                {verification.evidence.map((evidence) => (
                  <li key={evidence.ref ?? evidence.label} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-theme-xs font-medium text-ink-800 dark:text-gray-200">{evidence.label}</p>
                      <p className="ledger-numeral mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{evidence.ref ?? evidence.kind}</p>
                    </div>
                    <time className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400" dateTime={evidence.recordedAt}>{formatStamp(evidence.recordedAt)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 max-w-sm text-theme-xs leading-5 text-gray-500 dark:text-gray-400">Weighbridge tickets and intake photos appear here when the receiver verifies the delivery.</p>
            )}
            {verification?.rejectReason && <p className="mt-3 border-s-2 border-signal-500 bg-signal-50 px-3 py-2 text-theme-xs text-signal-800 dark:bg-signal-500/10 dark:text-signal-200">Receiving note · {verification.rejectReason}</p>}
          </section>

          <section aria-labelledby={`trail-${booking.id}`}>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Operational trail</p>
            <h3 id={`trail-${booking.id}`} className="mt-1 font-archivo text-base font-semibold text-ink-900 dark:text-white">Recorded shipment events</h3>
            {events.length > 0 ? (
              <ol className="mt-3 space-y-3 border-s border-steel-300 ps-4 dark:border-steel-700">
                {events.slice(-6).map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -start-[1.3rem] top-1.5 size-2 rounded-full bg-steel-400 dark:bg-steel-600" aria-hidden="true" />
                    <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">{formatStamp(event.at)} · {event.actor.name}</p>
                    <p className="mt-0.5 text-theme-xs leading-5 text-ink-800 dark:text-gray-200">{event.summary}</p>
                    {event.detail && <p className="mt-0.5 text-theme-xs leading-5 text-gray-500 dark:text-gray-400">{event.detail}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">No shipment events recorded yet.</p>
            )}
          </section>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-steel-200 pt-4 dark:border-steel-800">
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">Booking {booking.id} · receiver intake {slot?.date ?? "date pending"}</p>
          {!dispatchEvent && !verification ? (
            <Button size="sm" onClick={() => dispatchAction({ bookingId: booking.id })}>Dispatch load</Button>
          ) : (
            <Link to="/app/verification" className="text-theme-xs font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">Open verification record →</Link>
          )}
        </div>
      </div>
    </article>
  );
}

function RouteStop({ label, title, detail, align = "start" }: { label: string; title: string; detail: string; align?: "start" | "end" }) {
  return (
    <div className={cn("min-w-0", align === "end" && "sm:text-end")}>
      <p className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</p>
      <p className="mt-1 truncate font-archivo text-base font-semibold text-ink-900 dark:text-white">{title}</p>
      <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  );
}

function LoadMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className="ledger-numeral mt-1 text-theme-sm font-semibold capitalize text-ink-900 dark:text-white">{value}</dd>
    </div>
  );
}

function formatStamp(iso: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
