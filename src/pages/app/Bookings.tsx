import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { slotLedger } from "@/domain/capacity";
import type { ReceiverDaySlot } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { cn } from "@/utils";
import { motion } from "motion/react";

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

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Bookings | GreenLoop"
        description="Dated receiver intake slots, held requests, confirmed bookings, and available capacity."
      />
      <PageBreadCrumb pageTitle="Bookings" />

      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 border-b border-steel-300 pb-8 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Intake Ledger</p>
        <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          Limited receiving capacity
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Every dated intake slot is a finite operational resource. See what is committed, what is waiting, and what remains available.
        </p>
      </motion.header>

      {/* 3D Capacity Rule Box */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="group relative mb-12 grid overflow-hidden rounded-sm border border-transparent bg-ink-950 text-white shadow-xl transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] sm:grid-cols-[1.4fr_1fr] dark:border-steel-700 dark:bg-black" 
        aria-label="Capacity rule"
      >
        <div className="p-8 sm:p-10">
          <p className="eyebrow-label text-white/50">Capacity Rule</p>
          <h2 className="mt-3 font-archivo text-2xl font-bold tracking-tight text-white sm:text-3xl">Reserved tonnes cannot be double-booked.</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
            A confirmed booking consumes slot capacity. A HOLD is a request waiting for enough free tonnes; it is not a confirmed reservation. Cancelling a confirmed booking releases those tonnes and rechecks waiting requests.
          </p>
        </div>
        <dl className="grid grid-cols-3 border-t border-white/10 bg-black/20 sm:border-l sm:border-t-0">
          <CapacitySummary label="Available" value={`${totalAvailable.toFixed(1)} t`} tone="available" />
          <CapacitySummary label="Reserved" value={`${totalReserved.toFixed(1)} t`} tone="reserved" />
          <CapacitySummary label="Held" value={`${totalHeld.toFixed(1)} t`} tone="held" />
        </dl>
      </motion.section>
      <p className="-mt-8 mb-12 text-right text-xs font-medium text-steel-500 dark:text-gray-500">Capacity totals across all dated slots.</p>

      {/* Slot Timeline */}
      <section aria-labelledby="slots-heading" className="mb-16">
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

      {/* Booking History */}
      <section aria-labelledby="bookings-heading" className="border-t border-steel-300 pt-10 dark:border-steel-700">
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
            return (
              <motion.article 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                key={booking.id} 
                className={cn(
                  "grid gap-4 border-b border-steel-200 p-6 transition-colors last:border-b-0 hover:bg-gray-50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:border-steel-800 dark:hover:bg-white/[0.04]", 
                  cancelled && "opacity-70 grayscale"
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="ledger-numeral text-sm font-bold text-ink-900 dark:text-white">{booking.id}</span>
                    <StatusBadge status={booking.status} />
                    {booking.status === "confirmed" && <span className="text-xs font-bold uppercase tracking-wider text-loop-600 dark:text-loop-400">Confirmed · capacity reserved</span>}
                  </div>
                  <h3 className="mt-2 font-archivo text-lg font-bold text-ink-900 dark:text-white">{receiverName(booking.receiverId)}</h3>
                  <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                    <span className="font-semibold text-ink-900 dark:text-gray-200">{booking.tonnesT.toFixed(1)} t</span> · {materialLabel(booking.materialId)} · {slot ? `${slot.date} · ${TYPE_LABEL[slot.materialType] ?? slot.materialType} intake` : booking.slotId}
                  </p>
                  <p className="mt-2 ledger-numeral text-xs text-steel-500 dark:text-gray-500">
                    {cancelled
                      ? `Released ${booking.tonnesT.toFixed(1)} t · ${booking.cancelledReason ?? "Booking cancelled"}`
                      : `${booking.capacityBeforeT.toFixed(1)} → ${booking.capacityAfterT.toFixed(1)} t free after request`}
                  </p>
                  {booking.holdReason && (
                    <div className="mt-3 border-l-2 border-signal-500 bg-signal-50 px-4 py-2 dark:bg-signal-500/10">
                      <p className="text-sm font-medium text-signal-900 dark:text-signal-100">{booking.holdReason}</p>
                    </div>
                  )}
                </div>
                {booking.status === "confirmed" && (
                  <Button
                    size="md"
                    variant="outline"
                    className="border-steel-300 dark:border-steel-700 dark:text-white dark:hover:border-white"
                    onClick={() => cancelBookingAction({ bookingId: booking.id, reason: "Programme change — material retained on site" })}
                  >
                    Cancel Booking
                  </Button>
                )}
              </motion.article>
            );
          })}
          {dataset.bookings.length === 0 && (
            <p className="py-12 text-center text-lg font-medium text-steel-500 dark:text-gray-500">No bookings or holds in the current ledger.</p>
          )}
        </div>
      </section>
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
  const dateLabel = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });

  return (
    <article className="relative ms-0 grid gap-4 ps-12 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6 sm:ps-16">
      <div className="absolute start-3 top-5 z-10 flex h-5 w-5 -translate-x-1 items-center justify-center rounded-full border-4 border-[#F6F6F3] bg-steel-400 sm:start-3.5 sm:-translate-x-0.5 dark:border-[#0B0F15] dark:bg-steel-600" aria-hidden="true" />
      <div className="sm:pt-3">
        <p className="eyebrow-label text-steel-500 dark:text-steel-400">{weekday}</p>
        <p className="ledger-numeral mt-1 text-xl font-bold tracking-tight text-ink-900 dark:text-white">{dateLabel}</p>
      </div>
      
      <div className="group min-w-0 rounded-sm border border-steel-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-steel-800 dark:bg-white/[0.02]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{receiverName}</h3>
            <p className="mt-1 text-sm text-steel-600 dark:text-gray-400"><span className="font-semibold">{TYPE_LABEL[slot.materialType] ?? slot.materialType}</span> intake · {slot.id}</p>
          </div>
          <span className={cn(
            "rounded-sm border px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm", 
            availableT > 0 ? "border-loop-300 bg-loop-50 text-loop-700 dark:border-loop-500/40 dark:bg-loop-500/10 dark:text-loop-300" : "border-steel-300 bg-steel-100 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300"
          )}>
            {availableT > 0 ? `${availableT.toFixed(1)} t available` : "At capacity"}
          </span>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-medium text-steel-600 dark:text-gray-400">Confirmed capacity use</span>
              <span className="ledger-numeral font-bold text-ink-900 dark:text-white">{reservedT.toFixed(1)} <span className="text-steel-400">/ {slot.capacityT.toFixed(1)} t reserved</span></span>
            </div>
            
            {/* Animated Capacity Bar */}
            <div className="relative h-4 overflow-hidden rounded-full bg-steel-100 shadow-inner dark:bg-steel-900" role="img" aria-label="Capacity">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${reservedPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute inset-y-0 bg-loop-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
              />
            </div>
            
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="text-loop-600 dark:text-loop-400">Reserved {reservedT.toFixed(1)} t</span>
              <span className="text-loop-600 dark:text-loop-400">Available {availableT.toFixed(1)} t</span>
            </div>
          </div>
          <div className="border-t border-steel-200 pt-4 text-start sm:min-w-40 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0 dark:border-steel-800">
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Daily slot limit</p>
            <p className="ledger-numeral mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">{slot.capacityT.toFixed(1)} <span className="text-xl text-steel-400">t</span></p>
          </div>
        </div>

        {held.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mt-6 border-l-4 border-signal-500 bg-signal-50 px-5 py-4 dark:bg-signal-500/10"
          >
            <p className="text-sm font-bold text-signal-900 dark:text-signal-100">{held.length} request{held.length === 1 ? "" : "s"} on HOLD · {held.reduce((total, booking) => total + booking.tonnesT, 0).toFixed(1)} t waiting</p>
            <p className="mt-1 text-sm text-signal-800/90 dark:text-signal-200/90">Held tonnes are not confirmed capacity. This request needs additional free intake before it can be reserved.</p>
          </motion.div>
        )}
        {confirmed.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-steel-100 pt-4 dark:border-steel-800">
            {confirmed.map((booking) => (
              <span key={booking.id} className="inline-flex items-center gap-2 rounded bg-steel-100 px-3 py-1.5 text-xs font-bold text-ink-900 transition-colors hover:bg-loop-100 dark:bg-white/10 dark:text-white dark:hover:bg-loop-500/20">
                <span className="h-2 w-2 rounded-full bg-loop-500 shadow-sm" aria-hidden="true" />
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
  const toneClass = tone === "held" ? "text-signal-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" : "text-loop-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]";
  return (
    <div className="flex flex-col justify-center border-l border-white/10 px-6 py-8 first:border-l-0">
      <dt className="eyebrow-label text-white/50">{label}</dt>
      <dd className={cn("ledger-numeral mt-2 text-3xl font-bold tracking-tight", toneClass)}>{value}</dd>
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
