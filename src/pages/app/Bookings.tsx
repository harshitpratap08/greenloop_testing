import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { slotLedger } from "@/domain/capacity";
import type { ReceiverDaySlot } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { cn, formatDate } from "@/utils";
import { motion } from "motion/react";
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

export default function Bookings() {
  const { dataset, cancelBookingAction } = useGreenLoopStore();
  const materialLabel = (id: string) => {
    const material = dataset.materials.find((item) => item.id === id);
    return material ? `${TYPE_LABEL[material.type] ?? material.type} · ${id}` : id;
  };
  const receiverName = (id: string) => dataset.receivers.find((receiver) => receiver.id === id)?.name ?? id;
  const slotById = (slotId: string) => dataset.slots.find((slot) => slot.id === slotId);
  const orderedSlots = [...dataset.slots].sort((a, b) => a.date.localeCompare(b.date) || a.receiverId.localeCompare(b.receiverId));
  const totalCapacity = dataset.slots.reduce((total, slot) => total + slot.capacityT, 0);
  const totalReserved = dataset.slots.reduce((total, slot) => total + (slotLedger(dataset, slot.id)?.reserved ?? 0), 0);
  const totalHeld = dataset.slots.reduce((total, slot) => total + (slotLedger(dataset, slot.id)?.heldT ?? 0), 0);
  const totalAvailable = Math.max(0, totalCapacity - totalReserved);
  const activeBookings = dataset.bookings.filter((booking) => booking.status === "confirmed" || booking.status === "hold");

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Bookings | GreenLoop"
        description="Dated receiver intake slots, held requests, confirmed bookings, and available capacity."
      />
      <PageBreadCrumb pageTitle="Bookings" />

      <WorkflowPageHeader
        title="Bookings"
        description="See which receiver slots are confirmed, waiting on capacity, or ready for a load. A booking reserves receiving space on a date."
        status={`${activeBookings.length} active · ${totalAvailable.toFixed(1)} t free · ${totalReserved.toFixed(1)} t reserved`}
        action={activeBookings.length ? { label: "View active bookings", to: "#active-bookings" } : { label: "Find receiving capacity", to: "/app/receivers" }}
      />

      <section className="mb-10 border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-white/[0.02]" aria-label="Receiving capacity totals">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiving capacity · all dated slots</p>
            <h2 className="mt-1 font-archivo text-xl font-bold uppercase text-ink-900 dark:text-white">Capacity position</h2>
          </div>
          <p className="text-xs text-steel-600 dark:text-gray-400">Confirmed bookings consume capacity. Held requests are pending and do not reduce free tonnes.</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CapacitySummary label="Total receiving capacity" value={`${totalCapacity.toFixed(1)} t`} tone="reserved" />
          <CapacitySummary label="Available" value={`${totalAvailable.toFixed(1)} t`} tone="available" />
          <CapacitySummary label="Reserved · confirmed" value={`${totalReserved.toFixed(1)} t`} tone="reserved" />
          <CapacitySummary label="Held · awaiting capacity" value={`${totalHeld.toFixed(1)} t`} tone="held" />
        </dl>
        <div className="mt-5 h-3 overflow-hidden bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${totalReserved.toFixed(1)} tonnes reserved of ${totalCapacity.toFixed(1)} tonnes total capacity`}>
          <div className="h-full bg-loop-600 dark:bg-loop-500" style={{ width: `${totalCapacity > 0 ? Math.min(100, (totalReserved / totalCapacity) * 100) : 0}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-steel-600 dark:text-gray-400">
          <span>{totalReserved.toFixed(1)} t confirmed and reserved</span>
          <span>{totalAvailable.toFixed(1)} t still available</span>
        </div>
      </section>

      <section id="active-bookings" className="mb-10 space-y-4" aria-label="Active bookings">
        <h2 className="font-archivo text-2xl font-bold uppercase text-ink-900 dark:text-white mb-6">Active Bookings</h2>
        {activeBookings.length ? activeBookings.map((booking) => {
          const slot = slotById(booking.slotId);
          const receiver = receiverName(booking.receiverId);
          const dispatched = Boolean(booking.loadRef);
          const label = booking.status === "hold" ? "Waiting on Capacity" : dispatched ? "On the road" : booking.receiverAcceptedAt ? "Confirmed · Ready to send" : "Waiting for receiver approval";
          return (
            <article key={booking.id} className="flex flex-col lg:flex-row gap-6 border border-steel-200 bg-white p-6 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white">
              {/* Material thumbnail — the physical load this booking reserves space for */}
              <img
                src={materialMediaFor((dataset.materials.find((m) => m.id === booking.materialId)?.type) ?? "concrete").src}
                alt=""
                loading="lazy"
                className="hidden h-24 w-40 shrink-0 border border-steel-200 object-cover lg:block dark:border-steel-800"
              />
              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <StatusBadge status={booking.status} />
                  <p className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                    {materialLabel(booking.materialId)}
                  </h2>
                </div>
                <p className="text-theme-sm text-steel-600 dark:text-gray-400 mb-4">
                  {receiver} · {slot ? formatDate(slot.date) : "Date pending"}
                </p>
                <details className="text-xs text-steel-500 dark:text-steel-400">
                  <summary className="cursor-pointer font-medium hover:text-ink-900 dark:hover:text-white">View booking details ▾</summary>
                  <p className="mt-2">Booking ID: {booking.id} · Match ID: {booking.allocationId} · Receiving slot: {booking.slotId} · Capacity after booking: {booking.capacityAfterT.toFixed(1)} t free</p>
                  {booking.holdReason && <p className="mt-1">{booking.holdReason}</p>}
                </details>
              </div>

              <div className="flex flex-wrap lg:flex-col lg:items-end justify-center gap-4 lg:gap-2">
                <div className="text-left lg:text-right w-full lg:w-auto">
                  <p className="eyebrow-label text-steel-500 mb-1 lg:hidden">Quantity</p>
                  <p className="ledger-numeral text-2xl font-bold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 lg:mt-6">
                  {booking.status === "confirmed" && booking.receiverAcceptedAt && !dispatched && <Link to="/app/deliveries" className="inline-flex min-h-11 items-center bg-ink-900 px-6 text-sm font-bold text-white uppercase tracking-wider hover:bg-loop-600 dark:bg-white dark:text-ink-900">Send load</Link>}
                  {booking.status === "hold" && <Link to="/app/receivers" className="inline-flex min-h-11 items-center bg-ink-900 px-6 text-sm font-bold text-white uppercase tracking-wider hover:bg-loop-600 dark:bg-white dark:text-ink-900">Find another slot</Link>}
                  {booking.status === "confirmed" && !booking.receiverAcceptedAt && !dispatched && <span className="inline-flex min-h-11 items-center text-sm font-medium text-steel-600 dark:text-gray-400">Next: receiver approval</span>}
                  {dispatched && <Link to="/app/deliveries" className="inline-flex min-h-11 items-center bg-ink-900 px-6 text-sm font-bold text-white uppercase tracking-wider hover:bg-loop-600 dark:bg-white dark:text-ink-900">View load</Link>}
                </div>
              </div>
            </article>
          );
        }) : <p className="border border-steel-200 bg-white p-8 text-steel-600 dark:border-steel-800 dark:bg-white/[0.02] dark:text-gray-400">No active bookings. Find a receiver to request a slot for your material.</p>}
      </section>

      <section aria-labelledby="slots-heading" className="mb-10 border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-white/[0.02]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-label text-loop-600 dark:text-loop-400">01 · Dated intake</p>
            <h2 id="slots-heading" className="mt-2 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Receiving slots by date</h2>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-steel-600 dark:text-gray-400" aria-label="Capacity legend">
            <Legend color="bg-loop-500" label="Reserved / confirmed" />
            <Legend color="bg-steel-200 dark:bg-steel-800" label="Available" />
            <Legend color="bg-signal-500" label="Held request" />
          </div>
        </div>

        <div className="relative space-y-6 before:absolute before:bottom-5 before:start-[1.4rem] before:top-5 before:w-[2px] before:bg-steel-200 sm:before:start-[1.6rem] dark:before:bg-steel-800">
          {orderedSlots.map((slot, index) => (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <SlotTimelineItem
                slot={slot}
                receiverName={receiverName(slot.receiverId)}
                bookings={dataset.bookings.filter((booking) => booking.slotId === slot.id)}
                ledger={slotLedger(dataset, slot.id)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      <details className="rounded-sm border border-steel-200 bg-white dark:border-steel-800 dark:bg-white/[0.02]">
      <summary className="cursor-pointer px-5 py-4 font-semibold text-ink-900 dark:text-white">View booking history and capacity records ▾</summary>
      <section aria-labelledby="bookings-heading" className="border-t border-steel-300 p-5 pt-8 dark:border-steel-700">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-label text-loop-600 dark:text-loop-400">02 · Reservation records</p>
            <h2 id="bookings-heading" className="mt-2 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Booking and hold history</h2>
          </div>
          <Link to="/app/receivers" className="group flex items-center gap-2 text-sm font-bold text-ink-900 transition-colors hover:text-loop-600 dark:text-white dark:hover:text-loop-400">
            Find receiving capacity
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        <div className="rounded-sm border border-steel-200 bg-white dark:border-steel-800 dark:bg-white/[0.02]">
          {dataset.bookings.map((booking, i) => {
            const slot = slotById(booking.slotId);
            const cancelled = booking.status === "cancelled";
            const dispatched = Boolean(booking.loadRef) || dataset.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id));
            return (
              <motion.article 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                key={booking.id} 
                className={cn(
                  "border-b border-steel-200 p-5 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-steel-800 dark:hover:bg-white/[0.04]", 
                  cancelled && "opacity-60 grayscale"
                )}
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-8">
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{materialLabel(booking.materialId)}</p>
                    </div>
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Receiver</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{receiverName(booking.receiverId)}</p>
                    </div>
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Quantity</p>
                      <p className="mt-1 ledger-numeral text-sm font-semibold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t</p>
                    </div>
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Date / Slot</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">
                        {slot ? formatDate(slot.date) : booking.slotId}
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Status</p>
                      <div className="mt-1">
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  </div>
                  
                  {booking.status === "confirmed" && !dispatched && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-steel-300 dark:border-steel-700 dark:text-white dark:hover:border-white"
                      onClick={() => cancelBookingAction({ bookingId: booking.id, reason: "Programme change — material retained on site" })}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between border-t border-steel-100 pt-3 text-xs text-steel-600 dark:border-steel-800/50 dark:text-gray-400">
                  <span className="ledger-numeral text-steel-500">ID: {booking.id}</span>
                  <div className="flex items-center gap-3">
                    {cancelled ? (
                      <span>{booking.cancelledReason ?? "Booking cancelled"}</span>
                    ) : (
                      <>
                        <span className="font-semibold text-ink-900 dark:text-gray-300">{booking.capacityAfterT.toFixed(1)} t free</span>
                        <span>(was {booking.capacityBeforeT.toFixed(1)} t before request)</span>
                      </>
                    )}
                  </div>
                </div>
                
                {booking.holdReason && (
                  <div className="mt-3 border-l-2 border-signal-400 bg-signal-50 px-3 py-2 text-xs font-medium text-signal-900 dark:border-signal-500/50 dark:bg-signal-900/20 dark:text-signal-200">
                    {booking.holdReason}
                  </div>
                )}
              </motion.article>
            );
          })}
          {dataset.bookings.length === 0 && (
            <p className="py-12 text-center text-lg font-medium text-steel-500 dark:text-gray-500">No bookings or holds in the current ledger.</p>
          )}
        </div>
      </section>
      </details>
    </div>
  );
}

function SlotTimelineItem({
  slot,
  receiverName,
  bookings,
  ledger,
}: {
  slot: ReceiverDaySlot;
  receiverName: string;
  bookings: ReturnType<typeof useGreenLoopStore>["dataset"]["bookings"];
  ledger: ReturnType<typeof slotLedger>;
}) {
  const confirmed = bookings.filter((booking) => booking.status === "confirmed");
  const held = bookings.filter((booking) => booking.status === "hold");
  const reservedT = ledger?.reserved ?? 0;
  const availableT = ledger?.available ?? slot.capacityT;
  const reservedPercent = Math.min(100, (reservedT / Math.max(slot.capacityT, 0.1)) * 100);
  const date = new Date(`${slot.date}T12:00:00`);
  const dateLabel = formatDate(slot.date);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });

  return (
    <article className="relative ms-0 grid gap-4 ps-12 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6 sm:ps-16">
      <div className="absolute start-3 top-5 z-10 flex h-5 w-5 -translate-x-1 items-center justify-center rounded-full border-4 border-[#F6F6F3] bg-steel-400 sm:start-3.5 sm:-translate-x-0.5 dark:border-[#0B0F15] dark:bg-steel-600" aria-hidden="true" />
      <div className="sm:pt-3">
        <p className="eyebrow-label text-steel-500 dark:text-steel-400">{weekday}</p>
        <p className="ledger-numeral mt-1 text-xl font-bold tracking-tight text-ink-900 dark:text-white">{dateLabel}</p>
      </div>
      
      <div className="group min-w-0 rounded-sm border border-steel-200 bg-white p-5 shadow-sm transition-shadow hover:border-steel-300 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-steel-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{receiverName}</h3>
            <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
              <span className="font-semibold">{TYPE_LABEL[slot.materialType] ?? slot.materialType}</span> intake · {slot.id}
            </p>
          </div>
          
          <div className="text-left sm:text-right">
            <p className="ledger-numeral text-xl font-bold text-ink-900 dark:text-white">
              {slot.capacityT.toFixed(1)} <span className="text-sm font-medium text-steel-500">t limit</span>
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-steel-100 pt-4 dark:border-steel-800/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={cn(
              "rounded-sm border px-2 py-1 text-xs font-bold uppercase tracking-wider",
              availableT > 0 ? "border-steel-200 bg-steel-50 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300" : "border-signal-200 bg-signal-50 text-signal-700 dark:border-signal-800 dark:bg-signal-900/20 dark:text-signal-300"
            )}>
              {availableT > 0 ? `${availableT.toFixed(1)} t available` : "FULL · 0 t available"}
            </span>
            <p className="text-sm font-semibold text-ink-900 dark:text-white">{reservedT.toFixed(1)} t reserved <span className="font-normal text-steel-500">of {slot.capacityT.toFixed(1)} t capacity</span></p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${reservedT.toFixed(1)} tonnes reserved, ${availableT.toFixed(1)} tonnes available, ${held.reduce((total, booking) => total + booking.tonnesT, 0).toFixed(1)} tonnes held`}>
            <div className="h-full bg-loop-600 dark:bg-loop-500" style={{ width: `${reservedPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-steel-600 dark:text-gray-400">{availableT === slot.capacityT ? "No confirmed bookings" : `${reservedT.toFixed(1)} t confirmed`} · {availableT.toFixed(1)} t available</p>
        </div>

        {held.length > 0 && (
          <div className="mt-4 border-l-2 border-signal-400 bg-signal-50 px-4 py-2 dark:border-signal-500/50 dark:bg-signal-500/10">
            <p className="text-sm font-bold text-signal-900 dark:text-signal-100">
              {held.length} request{held.length === 1 ? "" : "s"} waiting on capacity
            </p>
            <p className="text-xs text-signal-800/90 dark:text-signal-200/90">
              {held.reduce((total, booking) => total + booking.tonnesT, 0).toFixed(1)} t waiting for free capacity.
            </p>
          </div>
        )}

        {confirmed.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-steel-100 pt-4 dark:border-steel-800/50">
            {confirmed.map((booking) => (
              <span key={booking.id} className="inline-flex items-center gap-1.5 rounded bg-steel-100 px-2 py-1 text-xs font-medium text-ink-900 dark:bg-white/10 dark:text-gray-200">
                <span className="h-1.5 w-1.5 rounded-full bg-loop-500" aria-hidden="true" />
                {booking.id} · {booking.tonnesT.toFixed(1)} t
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function CapacitySummary({ label, value, tone }: { label: string; value: string; tone: "available" | "reserved" | "held" }) {
  const toneClass = tone === "held" ? "text-signal-700 dark:text-signal-400" : tone === "available" ? "text-loop-700 dark:text-loop-400" : "text-ink-900 dark:text-white";
  return (
    <div className="border-s-2 border-steel-200 bg-steel-50 px-4 py-3 dark:border-steel-700 dark:bg-white/[0.03]">
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className={cn("ledger-numeral mt-1 text-xl font-bold", toneClass)}>{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-full border border-black/10 dark:border-white/10", color)} aria-hidden="true" />
      {label}
    </span>
  );
}
