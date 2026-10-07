import { slotLedger } from "@shared/domain/capacity";
import type { GreenLoopDataset } from "@shared/domain/types";
import { cn } from "@/utils";

/**
 * Compact capacity ledger as product UI — the exact component-shaped truth
 * from the platform, in miniature, for the hero and workflow sections.
 */
export default function MiniLedger({
  dataset,
  slotId,
  className,
}: {
  dataset: GreenLoopDataset;
  slotId: string;
  className?: string;
}) {
  const ledger = slotLedger(dataset, slotId);
  if (!ledger) return null;

  const receiver = dataset.receivers.find((r) => r.id === ledger.slot.receiverId);
  const confirmed = dataset.bookings.filter(
    (b) => b.slotId === slotId && b.status === "confirmed",
  );
  const holds = dataset.bookings.filter((b) => b.slotId === slotId && b.status === "hold");
  const total = ledger.slot.capacityT;
  const reservedPct = (ledger.reserved / total) * 100;
  const heldPct = (ledger.heldT / total) * 100;

  return (
    <div
      className={cn(
        "w-full rounded-sm border border-steel-200 bg-gray-25 p-4 text-start dark:border-steel-700 dark:bg-gray-dark",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow-label text-steel-600 dark:text-steel-400">Receiver capacity</p>
        <span className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
          {ledger.slot.date}
        </span>
      </div>
      <p className="mt-1.5 text-theme-sm font-semibold text-ink-900 dark:text-white/90">
        {receiver?.name ?? "Receiver"} — concrete
      </p>

      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-sm bg-steel-100 dark:bg-steel-900">
        <div className="bg-loop-600 dark:bg-loop-500" style={{ width: `${reservedPct}%` }} />
        <div className="bg-signal-500" style={{ width: `${heldPct}%` }} />
      </div>

      <dl className="mt-3 space-y-1.5">
        {confirmed.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between">
            <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
              {booking.materialId === "MP-101" ? "Harrow Road" : "Kings Cross"} · confirmed
            </dt>
            <dd className="ledger-numeral text-theme-xs font-medium text-loop-700 dark:text-loop-300">
              {booking.tonnesT.toFixed(1)} t
            </dd>
          </div>
        ))}
        {holds.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between">
            <dt className="text-theme-xs text-signal-700 dark:text-signal-300">
              {booking.materialId === "MP-102" ? "Kings Cross" : "Project"} · hold
            </dt>
            <dd className="ledger-numeral text-theme-xs font-medium text-signal-700 dark:text-signal-300">
              {booking.tonnesT.toFixed(1)} t
            </dd>
          </div>
        ))}
        <div className="hairline-t flex items-center justify-between pt-1.5">
          <dt className="text-theme-xs text-gray-500 dark:text-gray-400">Available</dt>
          <dd className="ledger-numeral text-theme-xs font-semibold text-loop-600 dark:text-loop-400">
            {ledger.available.toFixed(1)} t / {total.toFixed(1)} t
          </dd>
        </div>
      </dl>
    </div>
  );
}
