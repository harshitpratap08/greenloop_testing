import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { slotLedger } from "@/domain/capacity";
import type { ReceiverDaySlot } from "@/domain/types";
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
    <>
      <PageMeta
        title="Bookings | GreenLoop"
        description="Dated receiver intake slots, held requests, confirmed bookings, and available capacity."
      />
      <PageBreadCrumb pageTitle="Bookings" />

      <header className="mb-7 border-b border-steel-300 pb-6 dark:border-steel-700">
        <p className="eyebrow-label text-steel-600 dark:text-steel-400">Receiver intake ledger</p>
        <h1 className="mt-2 font-archivo text-title-sm font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">Limited receiving capacity</h1>
        <p className="mt-2 max-w-2xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">
          Every dated intake slot is a finite operational resource. See what is committed, what is waiting, and what remains available.
        </p>
      </header>

      <section className="mb-8 grid gap-0 border border-ink-900 bg-ink-900 text-white sm:grid-cols-[1.4fr_1fr] dark:border-steel-700" aria-label="Capacity rule">
        <div className="p-5 sm:p-6">
          <p className="eyebrow-label text-white/55">Capacity rule</p>
          <h2 className="mt-2 font-archivo text-xl font-semibold">Reserved tonnes cannot be double-booked.</h2>
          <p className="mt-2 max-w-xl text-theme-sm leading-6 text-white/65">
            A confirmed booking consumes slot capacity. A HOLD is a request waiting for enough free tonnes; it is not a confirmed reservation. Cancelling a confirmed booking releases those tonnes and rechecks waiting requests.
          </p>
        </div>
        <dl className="grid grid-cols-3 border-t border-white/15 sm:border-s sm:border-t-0">
          <CapacitySummary label="Available" value={`${totalAvailable.toFixed(1)} t`} tone="available" />
          <CapacitySummary label="Reserved" value={`${totalReserved.toFixed(1)} t`} tone="reserved" />
          <CapacitySummary label="Held" value={`${totalHeld.toFixed(1)} t`} tone="held" />
        </dl>
      </section>
      <p className="-mt-6 mb-8 text-end text-theme-xs text-gray-500 dark:text-gray-400">Capacity totals across all dated slots.</p>

      <section aria-labelledby="slots-heading" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">01 · Dated intake</p>
            <h2 id="slots-heading" className="mt-1 font-archivo text-xl font-semibold text-ink-900 dark:text-white">Receiving slots by date</h2>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-theme-xs text-gray-600 dark:text-gray-400" aria-label="Capacity legend">
            <Legend color="bg-loop-600" label="Reserved / confirmed" />
            <Legend color="bg-loop-200 dark:bg-loop-500/30" label="Available" />
            <Legend color="bg-signal-500" label="Held request" />
          </div>
        </div>

        <div className="relative space-y-3 before:absolute before:bottom-5 before:start-[1.02rem] before:top-5 before:w-px before:bg-steel-300 sm:before:start-[1.12rem] dark:before:bg-steel-700">
          {orderedSlots.map((slot) => (
            <SlotTimelineItem
              key={slot.id}
              slot={slot}
              receiverName={receiverName(slot.receiverId)}
              bookings={dataset.bookings.filter((booking) => booking.slotId === slot.id)}
              ledger={slotLedger(dataset, slot.id)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="bookings-heading" className="border-t border-steel-300 pt-6 dark:border-steel-700">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">02 · Reservation records</p>
            <h2 id="bookings-heading" className="mt-1 font-archivo text-xl font-semibold text-ink-900 dark:text-white">Booking and hold history</h2>
          </div>
          <Link to="/app/receivers" className="text-theme-xs font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">Find receiving capacity →</Link>
        </div>

        <div className="border-t border-steel-300 dark:border-steel-700">
          {dataset.bookings.map((booking) => {
            const slot = slotById(booking.slotId);
            const cancelled = booking.status === "cancelled";
            return (
              <article key={booking.id} className={cn("grid gap-4 border-b border-steel-200 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:border-steel-800", cancelled && "opacity-75")}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="ledger-numeral text-theme-xs font-semibold text-ink-900 dark:text-white">{booking.id}</span>
                    <StatusBadge status={booking.status} />
                    {booking.status === "confirmed" && <span className="text-theme-xs text-loop-700 dark:text-loop-300">Confirmed · capacity reserved</span>}
                  </div>
                  <h3 className="mt-1 text-theme-sm font-semibold text-ink-900 dark:text-white">{receiverName(booking.receiverId)}</h3>
                  <p className="mt-1 text-theme-xs text-gray-600 dark:text-gray-400">
                    {materialLabel(booking.materialId)} · {booking.tonnesT.toFixed(1)} t · {slot ? `${slot.date} · ${TYPE_LABEL[slot.materialType] ?? slot.materialType} intake` : booking.slotId}
                  </p>
                  <p className="mt-1 ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
                    {cancelled
                      ? `Released ${booking.tonnesT.toFixed(1)} t · ${booking.cancelledReason ?? "Booking cancelled"}`
                      : `${booking.capacityBeforeT.toFixed(1)} → ${booking.capacityAfterT.toFixed(1)} t free after request`}
                  </p>
                  {booking.holdReason && <p className="mt-2 border-s-2 border-signal-500 ps-3 text-theme-xs leading-5 text-signal-800 dark:text-signal-200">{booking.holdReason}</p>}
                </div>
                {booking.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelBookingAction({ bookingId: booking.id, reason: "Programme change — material retained on site" })}
                  >
                    Cancel booking
                  </Button>
                )}
              </article>
            );
          })}
          {dataset.bookings.length === 0 && (
            <p className="py-8 text-center text-theme-sm text-gray-500 dark:text-gray-400">No bookings or holds in the current ledger.</p>
          )}
        </div>
      </section>
    </>
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
    <article className="relative ms-0 grid gap-3 ps-10 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-5 sm:ps-12">
      <div className="absolute start-2 top-5 z-10 size-3 rounded-full border-2 border-gray-25 bg-steel-500 sm:start-2.5 dark:border-gray-dark" aria-hidden="true" />
      <div className="sm:pt-1">
        <p className="eyebrow-label text-steel-600 dark:text-steel-400">{weekday}</p>
        <p className="ledger-numeral mt-1 text-lg font-semibold text-ink-900 dark:text-white">{dateLabel}</p>
      </div>
      <div className="min-w-0 border border-steel-200 bg-gray-25 p-4 sm:p-5 dark:border-steel-800 dark:bg-gray-dark">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-archivo text-base font-semibold text-ink-900 dark:text-white">{receiverName}</h3>
            <p className="mt-1 text-theme-xs text-gray-600 dark:text-gray-400">{TYPE_LABEL[slot.materialType] ?? slot.materialType} intake · {slot.id}</p>
          </div>
          <span className={cn("border px-2 py-1 text-theme-xs font-medium", availableT > 0 ? "border-loop-300 bg-loop-50 text-loop-700 dark:border-loop-500/40 dark:bg-loop-500/10 dark:text-loop-300" : "border-steel-300 bg-steel-100 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300")}>
            {availableT > 0 ? `${availableT.toFixed(1)} t available` : "At capacity"}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-theme-xs">
              <span className="text-gray-500 dark:text-gray-400">Confirmed capacity use</span>
              <span className="ledger-numeral font-medium text-ink-900 dark:text-white">{reservedT.toFixed(1)} / {slot.capacityT.toFixed(1)} t reserved</span>
            </div>
            <div className="flex h-3 overflow-hidden bg-loop-100 dark:bg-loop-500/15" role="img" aria-label={`${reservedT.toFixed(1)} tonnes confirmed and reserved, ${availableT.toFixed(1)} tonnes available of ${slot.capacityT.toFixed(1)} tonnes`}>
              <div className="h-full bg-loop-600 transition-all" style={{ width: `${reservedPercent}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-theme-xs">
              <span className="text-loop-700 dark:text-loop-300">Reserved {reservedT.toFixed(1)} t</span>
              <span className="text-loop-700 dark:text-loop-300">Available {availableT.toFixed(1)} t</span>
            </div>
          </div>
          <div className="border-t border-steel-200 pt-3 text-start sm:min-w-32 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0 dark:border-steel-800">
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Daily slot limit</p>
            <p className="ledger-numeral mt-1 text-lg font-semibold text-ink-900 dark:text-white">{slot.capacityT.toFixed(1)} t</p>
          </div>
        </div>

        {held.length > 0 && (
          <div className="mt-4 border-s-2 border-signal-500 bg-signal-50 px-3 py-2.5 dark:bg-signal-500/10">
            <p className="text-theme-xs font-semibold text-signal-800 dark:text-signal-200">{held.length} request{held.length === 1 ? "" : "s"} on HOLD · {held.reduce((total, booking) => total + booking.tonnesT, 0).toFixed(1)} t waiting</p>
            <p className="mt-1 text-theme-xs leading-5 text-signal-800/80 dark:text-signal-200/80">Held tonnes are not confirmed capacity. This request needs additional free intake before it can be reserved.</p>
          </div>
        )}
        {confirmed.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {confirmed.map((booking) => (
              <span key={booking.id} className="inline-flex items-center gap-2 border border-loop-300 bg-loop-50 px-2.5 py-1 text-theme-xs text-loop-800 dark:border-loop-500/30 dark:bg-loop-500/10 dark:text-loop-200">
                <span className="size-1.5 rounded-full bg-loop-600" aria-hidden="true" />
                {booking.id} · {booking.tonnesT.toFixed(1)} t confirmed
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function CapacitySummary({ label, value, tone }: { label: string; value: string; tone: "available" | "reserved" | "held" }) {
  const toneClass = tone === "held" ? "text-signal-300" : "text-loop-300";
  return (
    <div className="border-s border-white/15 px-3 py-5 first:border-s-0 sm:px-4 sm:py-6">
      <dt className="eyebrow-label text-white/50">{label}</dt>
      <dd className={cn("ledger-numeral mt-2 text-base font-semibold sm:text-lg", toneClass)}>{value}</dd>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-2.5", color)} aria-hidden="true" />
      {label}
    </span>
  );
}
