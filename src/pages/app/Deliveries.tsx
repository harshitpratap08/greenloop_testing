import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import type { Booking } from "@/domain/types";
import { cn, formatStamp, formatDate } from "@/utils";
import { motion, AnimatePresence } from "motion/react";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { materialMediaFor, ambientVideo } from "@/config/appMedia";

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
  const readyToSend = dispatchable.filter((booking) => booking.receiverAcceptedAt && !booking.loadRef);
  const onTheRoad = dispatchable.filter((booking) => booking.loadRef && !dataset.verifications.some((item) => item.bookingId === booking.id));

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Deliveries | GreenLoop"
        description="Track material loads from project dispatch through receiver delivery and evidence."
      />

      <WorkflowPageHeader
        title="Where is my load?"
        description="Track confirmed material bookings from your project to the receiver, then see what was received and accepted."
        status={`${readyToSend.length} ready to send · ${onTheRoad.length} on the road · ${dispatchable.filter((booking) => dataset.verifications.some((item) => item.bookingId === booking.id)).length} delivered`}
        action={readyToSend.length ? { label: "Send a load", to: "#delivery-loads" } : undefined}
      />

      {/* Ambient logistics banner — muted loading footage above the load list */}
      <div className="group mb-8 overflow-hidden border border-steel-200 dark:border-steel-800">
        <div className="relative h-32 w-full sm:h-40">
          <video
            className="size-full object-cover"
            src={ambientVideo.dispatch.src}
            poster={ambientVideo.dispatch.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
          />
          <div className="absolute inset-0 bg-ink-950/55" aria-hidden="true" />
          <p className="absolute bottom-4 left-5 font-archivo text-xl font-bold uppercase tracking-wide text-white">Booked → Dispatched → In transit → Received → Verified</p>
          <p className="absolute bottom-4 right-5 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 sm:block">Load operations</p>
        </div>
      </div>

      {dispatchable.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-steel-300 bg-white/50 p-16 text-center dark:border-steel-800 dark:bg-white/[0.02]">
          <div className="mb-4 rounded-full bg-steel-100 p-4 dark:bg-steel-900">
            <span className="text-4xl opacity-50">🚛</span>
          </div>
          <p className="eyebrow-label text-steel-500 dark:text-steel-400">No active shipments</p>
          <h2 className="mt-3 font-archivo text-2xl font-bold text-ink-900 dark:text-white">No confirmed bookings ready for delivery</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">A load enters the delivery record when receiver capacity has been confirmed.</p>
          <Link to="/app/bookings" className="mt-6 font-semibold text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-600 dark:text-white dark:hover:text-loop-400">Review bookings →</Link>
        </section>
      ) : (
        <div id="delivery-loads" className="space-y-6">
          {dispatchable.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <LoadCard booking={booking} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
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
    { label: "Project ready", detail: project?.name ?? "Origin", complete: true },
    { label: "Dispatched", detail: dispatchEvent ? formatStamp(dispatchEvent.at) : "Awaiting", complete: Boolean(dispatchEvent) },
    { label: "Arrival", detail: verification ? formatStamp(verification.verifiedAt ?? "") : "Awaiting", complete: Boolean(verification) },
    { label: "Checked", detail: verification ? `${verification.actualT.toFixed(1)} t weighed` : "Awaiting", complete: Boolean(verification) },
    { label: "Evidence", detail: verification?.evidence.length ? `${verification.evidence.length} records` : "Awaiting", complete: Boolean(verification?.evidence.length) },
  ];
  
  const isEnRoute = Boolean(dispatchEvent) && !verification;
  const progressPercent = verification ? 100 : dispatchEvent ? 50 : 10;

  return (
    <article className="flex flex-col lg:flex-row gap-6 border border-steel-200 bg-white p-6 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white">
      {/* Load thumbnail — the physical material on the road */}
      <img
        src={materialMediaFor(material?.type ?? "concrete").src}
        alt=""
        loading="lazy"
        className="hidden h-32 w-44 shrink-0 border border-steel-200 object-cover lg:block dark:border-steel-800"
      />
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400 mb-2">
              {currentStatus === "confirmed" ? booking.receiverAcceptedAt ? "Ready to send" : "Waiting for receiver" : currentStatus === "dispatched" ? "On the road" : "Delivered"}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white uppercase">{TYPE_LABEL[material?.type ?? ""] ?? material?.type}</h2>
              <StatusBadge status={currentStatus} size="sm" />
            </div>
          </div>
        </div>

        <p className="text-theme-sm text-steel-600 dark:text-gray-400 mb-4">
          <span className="font-semibold text-ink-900 dark:text-gray-200">{receiver?.name ?? "Receiver"}</span> · <span className="ledger-numeral">Ref: {loadRef}</span>
        </p>

        <details className="text-xs text-steel-500 dark:text-steel-400">
          <summary className="cursor-pointer font-medium hover:text-ink-900 dark:hover:text-white">View shipment details ▾</summary>
          <div className="mt-4 border-t border-steel-100 pt-4 dark:border-steel-800">
            {/* Animated Live Route Map */}
            <div className="relative mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 dark:text-white">{project?.name ?? "Origin"}</p>
                <p className="mt-1 text-steel-600 dark:text-gray-400">{project?.location ?? "—"}</p>
              </div>
              
              <div className="relative flex flex-1 items-center px-8 text-center sm:flex-col">
                <div className="absolute top-0 -translate-y-full pb-2">
                  <span className="ledger-numeral rounded-sm border border-steel-300 bg-white px-3 py-1 font-bold text-ink-900 dark:border-steel-700 dark:bg-ink-950 dark:text-white">
                    {receiver?.distanceKnown === false ? "\u2014" : `${receiver?.distanceKm ?? 0} km`}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-steel-200 dark:bg-steel-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${progressPercent}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={cn("h-full", isEnRoute ? "bg-loop-500" : verification ? "bg-ink-900 dark:bg-white" : "bg-steel-400 dark:bg-steel-600")}
                  />
                </div>
                <AnimatePresence>
                  {isEnRoute && (
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "10%" }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="absolute inset-x-8 top-1/2 -translate-y-1/2"
                    >
                      <div className="flex h-6 w-6 -translate-y-1 items-center justify-center rounded-full border-2 border-white bg-loop-500 text-xs dark:border-ink-950">
                        🚛
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="min-w-0 flex-1 sm:text-right">
                <p className="font-semibold text-ink-900 dark:text-white">{receiver?.name ?? "Destination"}</p>
                <p className="mt-1 text-steel-600 dark:text-gray-400">{receiver?.location ?? "—"}</p>
              </div>
            </div>

            {/* Shipment Stages Tracker */}
            <div className="mb-8 overflow-x-auto pb-4">
              <ol className="flex min-w-max gap-8">
                {stages.map((stage) => (
                  <li key={stage.label} className="relative flex flex-col items-start gap-2">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", stage.complete ? "border-loop-500 bg-loop-50 text-loop-600" : "border-steel-300 bg-white dark:border-steel-700 dark:bg-black")}>
                      {stage.complete && <div className="h-2 w-2 rounded-full bg-loop-500" />}
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wider text-steel-900 dark:text-gray-300">{stage.label}</p>
                      <p className="mt-1 text-steel-500">{stage.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-sm border border-steel-200 p-4 dark:border-steel-800">
                <p className="font-bold text-ink-900 dark:text-white mb-3">Delivery Evidence</p>
                {verification?.evidence.length ? (
                  <ul className="space-y-3">
                    {verification.evidence.map((evidence) => (
                      <li key={evidence.ref ?? evidence.label} className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 bg-steel-100 flex items-center justify-center dark:bg-steel-900">
                           {evidence.kind === "site-photo" && evidence.ref?.startsWith("/images/") ? <img src={evidence.ref} alt={evidence.label} className="size-full object-cover" /> : <span className="text-xs">🧾</span>}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-800 dark:text-gray-200 truncate">{evidence.label}</p>
                          <p className="ledger-numeral text-[10px] text-steel-500">{formatStamp(evidence.recordedAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-steel-500">Weighbridge tickets appear here upon verification.</p>
                )}
                {verification?.rejectReason && (
                  <div className="mt-3 border-l-2 border-signal-500 bg-signal-50 p-2 text-signal-900 dark:bg-signal-500/10 dark:text-signal-100">
                    <p className="font-bold">Note:</p>
                    <p>{verification.rejectReason}</p>
                  </div>
                )}
              </div>

              <div className="rounded-sm border border-steel-200 p-4 dark:border-steel-800">
                <p className="font-bold text-ink-900 dark:text-white mb-3">Shipment Events</p>
                {events.length > 0 ? (
                  <ol className="space-y-3 border-l border-steel-200 pl-3 dark:border-steel-800">
                    {events.slice(-4).map((event) => (
                      <li key={event.id} className="relative">
                        <span className="absolute -left-[15px] top-1 h-2 w-2 rounded-full border border-white bg-steel-400 dark:border-ink-950 dark:bg-steel-600" />
                        <p className="ledger-numeral text-[10px] text-steel-500">{formatStamp(event.at)}</p>
                        <p className="font-medium text-ink-800 dark:text-gray-200 truncate">{event.summary}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-steel-500">No events recorded.</p>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>

      <div className="flex flex-wrap lg:flex-col lg:items-end justify-center gap-4 lg:gap-2 border-t lg:border-t-0 border-steel-100 lg:border-l pt-4 lg:pt-0 lg:pl-6 dark:border-steel-800/50">
        <div className="text-left lg:text-right w-full lg:w-auto">
          <p className="eyebrow-label text-steel-500 mb-1 lg:hidden">Quantity</p>
          <div className="flex items-baseline gap-1 lg:justify-end">
            <p className="ledger-numeral text-3xl font-bold text-ink-900 dark:text-white">
              {booking.tonnesT.toFixed(1)}
            </p>
            <span className="font-medium text-steel-400">t</span>
          </div>
          <p className="text-sm font-medium text-steel-500 dark:text-gray-400 mt-1">
            {slot ? formatDate(slot.date) : "pending"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-2 lg:mt-6 w-full lg:w-auto lg:justify-end">
          {!dispatchEvent && !verification && !booking.receiverAcceptedAt ? (
            <span className="text-sm font-semibold text-warning-600">Waiting for approval</span>
          ) : !dispatchEvent && !verification ? (
            <Button size="md" className="w-full lg:w-auto bg-ink-900 font-bold uppercase tracking-widest text-white hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500" onClick={() => dispatchAction({ bookingId: booking.id })}>
              Send load
            </Button>
          ) : (
            <Link to="/app/verification" className="inline-flex min-h-11 w-full lg:w-auto items-center justify-center border border-steel-300 px-6 font-bold text-ink-900 hover:border-ink-900 hover:bg-gray-50 dark:border-steel-700 dark:text-white dark:hover:border-white dark:hover:bg-white/5 uppercase tracking-wide">
              View record
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
