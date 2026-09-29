import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import type { Booking } from "@/domain/types";
import { cn, formatStamp, formatDate } from "@/utils";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Deliveries | GreenLoop"
        description="Track material loads from project dispatch through receiver delivery and evidence."
      />
      <PageBreadCrumb pageTitle="Deliveries" />

      {/* Cinematic Delivery Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="group relative mb-12 overflow-hidden rounded-sm border border-steel-200 bg-ink-950 p-8 shadow-lg sm:p-12 dark:border-steel-800 dark:bg-black"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Animated Background */}
          <img
            src="/images/site/auth-yard.jpg"
            alt="Logistics Operations"
            className="h-full w-full animate-slow-mo object-cover opacity-40 dark:opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/80 to-transparent dark:from-black/95 dark:via-black/70" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow-label text-loop-400">Recovery Network · Load Tracking</p>
            <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
              Deliveries In Motion
            </h1>
            <p className="mt-4 text-lg text-white/80 drop-shadow-sm">
              Follow each confirmed load from its project origin, through dispatch, to receiver intake and proof of recovery.
            </p>
          </div>
          
          <div className="flex flex-col items-start gap-1 border-l-2 border-loop-500 pl-6 md:items-end md:border-l-0 md:border-r-2 md:pl-0 md:pr-6 md:text-right">
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="ledger-numeral text-5xl font-bold text-white"
            >
              {dispatchable.length}
            </motion.span>
            <span className="eyebrow-label text-white/60 uppercase tracking-widest">Active Loads</span>
          </div>
        </div>

        {/* Global Track Progress Bar across Header */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            className="h-full bg-loop-500"
          />
        </div>
      </motion.div>

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
        <div className="space-y-12">
          {dispatchable.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
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
    <article className="group overflow-hidden rounded-sm border border-steel-200 bg-white shadow-md transition-shadow hover:shadow-xl dark:border-steel-800 dark:bg-[#0f141a]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-steel-200 bg-gray-50 px-6 py-5 dark:border-steel-800 dark:bg-white/[0.02]">
        <div>
          <p className="eyebrow-label text-steel-500 dark:text-steel-400">Shipment Record · {booking.id}</p>
          <div className="mt-1 flex items-baseline gap-4">
            <h2 className="ledger-numeral text-2xl font-bold tracking-tight text-ink-900 dark:text-white">{loadRef}</h2>
            <p className="font-archivo text-lg font-semibold uppercase text-loop-600 dark:text-loop-400">
              {booking.tonnesT.toFixed(1)} t {TYPE_LABEL[material?.type ?? ""] ?? material?.type}
            </p>
          </div>
        </div>
        <StatusBadge status={currentStatus} size="md" />
      </div>

      <div className="p-6 sm:p-8">
        {/* Animated Live Route Map */}
        <div className="relative mb-10 overflow-hidden rounded-sm border border-steel-200 bg-steel-50 p-6 dark:border-steel-800 dark:bg-black/40">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <RouteStop label="Origin · Project" title={project?.name ?? "Unavailable"} detail={project?.location ?? "—"} />
            
            <div className="relative flex flex-1 items-center px-8 text-center sm:flex-col">
              {/* Distance label */}
              <div className="absolute top-0 -translate-y-full pb-2">
                <span className="ledger-numeral rounded-full border border-steel-300 bg-white px-3 py-1 text-sm font-bold text-ink-900 shadow-sm dark:border-steel-700 dark:bg-ink-950 dark:text-white">
                  {receiver?.distanceKm ?? 0} km
                </span>
              </div>
              
              {/* Route Track */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-steel-200 dark:bg-steel-800">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progressPercent}%` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className={cn("h-full", isEnRoute ? "bg-loop-500" : verification ? "bg-ink-900 dark:bg-white" : "bg-steel-400 dark:bg-steel-600")}
                />
              </div>
              
              {/* Animated Truck Icon if En Route */}
              <AnimatePresence>
                {isEnRoute && (
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "10%" }} // Parked in middle
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-x-8 top-1/2 -translate-y-1/2"
                  >
                    <div className="flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full border-4 border-white bg-loop-500 text-lg dark:border-ink-950">
                      🚛
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <RouteStop label="Destination · Receiver" title={receiver?.name ?? "Unavailable"} detail={receiver?.location ?? "—"} align="end" />
          </div>
        </div>

        {/* Shipment Details Grid */}
        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-steel-200 py-6 sm:grid-cols-4 dark:border-steel-800">
          <LoadMetric label="Material" value={TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "—"} />
          <LoadMetric label="Planned quantity" value={`${booking.tonnesT.toFixed(1)} t`} />
          <LoadMetric label="Intake slot" value={slot ? formatDate(slot.date) : "—"} />
          <LoadMetric label="Received / accepted" value={verification ? `${verification.actualT.toFixed(1)} / ${verification.acceptedT.toFixed(1)} t` : "Awaiting arrival"} highlight={Boolean(verification)} />
        </dl>

        {/* Animated Stages Tracker */}
        <section className="mt-8">
          <p className="eyebrow-label mb-4 text-steel-500 dark:text-steel-400">Shipment Progress</p>
          <div className="relative">
            <div className="absolute left-3 top-0 h-full w-[2px] bg-steel-200 dark:bg-steel-800 sm:left-0 sm:top-3 sm:h-[2px] sm:w-full" />
            <motion.div 
              initial={{ height: 0, width: 0 }}
              whileInView={{ height: "100%", width: "100%" }}
              transition={{ duration: 1.5 }}
              className="absolute left-3 top-0 w-[2px] bg-loop-500 sm:left-0 sm:top-3 sm:h-[2px]" 
              style={{ clipPath: `inset(0 ${100 - progressPercent}% 0 0)` }}
            />
            
            <ol className="relative z-10 grid gap-6 sm:grid-cols-5">
              {stages.map((stage, index) => (
                <li key={stage.label} className="relative flex items-start gap-4 pl-8 sm:flex-col sm:items-center sm:gap-3 sm:pl-0">
                  <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: index * 0.2, type: "spring" }}
                    viewport={{ once: true }}
                    className={cn(
                      "absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border-[3px] bg-white transition-colors duration-500 sm:relative dark:bg-ink-950",
                      stage.complete ? "border-loop-500" : "border-steel-300 dark:border-steel-700"
                    )}
                  >
                    {stage.complete && <div className="h-2.5 w-2.5 rounded-full bg-loop-500" />}
                  </motion.div>
                  <div className="sm:text-center">
                    <p className={cn("text-xs font-bold uppercase tracking-wider", stage.complete ? "text-ink-900 dark:text-white" : "text-steel-400 dark:text-gray-600")}>{stage.label}</p>
                    <p className="mt-1 text-xs text-steel-500 dark:text-gray-500">{stage.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Detailed Sections with 3D Card Hover */}
        <div className="mt-10 grid gap-8 border-t border-steel-200 pt-8 lg:grid-cols-2 dark:border-steel-800">
          <motion.section 
            whileHover={{ y: -5 }}
            className="rounded-sm border border-steel-200 bg-gray-50 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-steel-800 dark:bg-white/[0.02]"
          >
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Delivery Evidence</p>
            <h3 className="mt-1 font-archivo text-lg font-bold text-ink-900 dark:text-white">Receiver Record</h3>
            {verification?.evidence.length ? (
              <ul className="mt-4 divide-y divide-steel-200 dark:divide-steel-800">
                {verification.evidence.map((evidence) => (
                  <li key={evidence.ref ?? evidence.label} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-white dark:hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      {evidence.kind === "site-photo" && evidence.ref?.startsWith("/images/") && (
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-steel-100 dark:bg-steel-900">
                           <img src={evidence.ref} alt={evidence.label} className="size-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-ink-800 dark:text-gray-200">{evidence.label}</p>
                        <p className="ledger-numeral mt-0.5 text-xs text-steel-500 dark:text-gray-400">
                          {evidence.ref?.startsWith("/images/") ? evidence.kind : (evidence.ref ?? evidence.kind)}
                        </p>
                      </div>
                    </div>
                    <time className="ledger-numeral rounded bg-steel-200/50 px-2 py-1 text-xs font-medium text-steel-700 dark:bg-white/10 dark:text-gray-300" dateTime={evidence.recordedAt}>{formatStamp(evidence.recordedAt)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 flex flex-col items-center justify-center rounded border border-dashed border-steel-300 py-8 text-center dark:border-steel-700">
                <span className="text-2xl opacity-50">🧾</span>
                <p className="mt-2 max-w-[200px] text-xs text-steel-500 dark:text-gray-500">Weighbridge tickets appear here upon verification.</p>
              </div>
            )}
            {verification?.rejectReason && (
              <div className="mt-4 border-l-4 border-signal-500 bg-signal-50 p-3 dark:bg-signal-500/10">
                <p className="text-xs font-bold text-signal-900 dark:text-signal-100">Receiving Note</p>
                <p className="mt-1 text-xs text-signal-800 dark:text-signal-200">{verification.rejectReason}</p>
              </div>
            )}
          </motion.section>

          <section>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Operational Trail</p>
            <h3 className="mt-1 font-archivo text-lg font-bold text-ink-900 dark:text-white">Shipment Events</h3>
            {events.length > 0 ? (
              <ol className="mt-4 space-y-4 border-l-2 border-steel-200 pl-5 dark:border-steel-800">
                {events.slice(-6).map((event, i) => (
                  <motion.li 
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <span className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-steel-400 shadow-sm dark:border-ink-950 dark:bg-steel-600" aria-hidden="true" />
                    <p className="ledger-numeral text-xs text-steel-500 dark:text-gray-400">{formatStamp(event.at)} · {event.actor.name}</p>
                    <p className="mt-1 text-sm font-medium text-ink-800 dark:text-gray-200">{event.summary}</p>
                    {event.detail && <p className="mt-0.5 text-xs text-steel-500 dark:text-gray-500">{event.detail}</p>}
                  </motion.li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-steel-500 dark:text-gray-500">No shipment events recorded yet.</p>
            )}
          </section>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-steel-200 pt-6 dark:border-steel-800">
          <p className="text-sm font-medium text-steel-500 dark:text-gray-400">Booking {booking.id} · receiver intake {slot ? formatDate(slot.date) : "date pending"}</p>
          {!dispatchEvent && !verification && !booking.receiverAcceptedAt ? (
            <span className="text-sm font-semibold text-warning-600">Waiting for receiver request approval</span>
          ) : !dispatchEvent && !verification ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="md" className="bg-ink-900 uppercase tracking-widest hover:bg-loop-600 dark:bg-white dark:text-ink-900 dark:hover:bg-loop-500" onClick={() => dispatchAction({ bookingId: booking.id })}>
                Dispatch Load
              </Button>
            </motion.div>
          ) : (
            <Link to="/app/verification" className="group flex items-center gap-2 text-sm font-bold text-ink-900 transition-colors hover:text-loop-600 dark:text-white dark:hover:text-loop-400">
              Open Verification Record
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function RouteStop({ label, title, detail, align = "start" }: { label: string; title: string; detail: string; align?: "start" | "end" }) {
  return (
    <div className={cn("min-w-0 flex flex-col", align === "end" ? "items-end text-right" : "items-start text-left")}>
      <p className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</p>
      <p className="mt-2 font-archivo text-xl font-bold text-ink-900 dark:text-white">{title}</p>
      <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{detail}</p>
    </div>
  );
}

function LoadMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</dt>
      <dd className={cn(
        "ledger-numeral mt-1 text-xl font-bold capitalize",
        highlight ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-white"
      )}>
        {value}
      </dd>
    </div>
  );
}
