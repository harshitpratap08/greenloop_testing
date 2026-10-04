import { slotLedger, STORY } from "@/domain";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate } from "@/utils";

/**
 * Sidebar capacity snapshot — LIVE view of the store's Riverstone
 * Aggregates concrete intake (the locked 15-tonne scenario slot).
 * Every figure is computed by the pure capacity engine from the current
 * dataset, so bookings/cancellations update the sidebar in real time.
 */
export default function CapacitySnapshot() {
  const { dataset } = useGreenLoopStore();
  const { receiverName, slotDate, ledger } = (() => {
    const l = slotLedger(dataset, STORY.concreteSlotSept24);
    const receiver = dataset.receivers.find((r) => r.id === STORY.receiverId);
    return {
      receiverName: receiver?.name ?? "Receiver",
      slotDate: l?.slot.date ? formatDate(l.slot.date) : "",
      ledger: l,
    };
  })();

  if (!ledger) return null;

  const total = ledger.slot.capacityT;
  const reservedPct = Math.min(100, (ledger.reserved / total) * 100);
  const heldPct = Math.min(100 - reservedPct, (ledger.heldT / total) * 100);

  return (
    <div className="rounded-lg border border-steel-200 bg-steel-50 p-4 dark:border-white/5 dark:bg-white/5">
      <p className="eyebrow-label text-steel-600 dark:text-steel-400">
        Receiver capacity
      </p>
      <p className="mt-2 text-theme-sm font-semibold text-ink-900 dark:text-white/90">
        {receiverName}
      </p>
      <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
        Concrete intake · {slotDate}
      </p>

      {/* Capacity bar — reserved / held / free */}
      <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-sm bg-gray-200 dark:bg-white/10">
        <div
          className="bg-ink-900 transition-all duration-500 dark:bg-white/80"
          style={{ width: `${reservedPct}%` }}
          aria-label={`${ledger.reserved} tonnes reserved`}
        />
        <div
          className="bg-signal-500 transition-all duration-500"
          style={{ width: `${heldPct}%` }}
          aria-label={`${ledger.heldT} tonnes on hold`}
        />
      </div>

      <dl className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
            Reserved
          </dt>
          <dd className="ledger-numeral text-theme-xs font-medium text-ink-900 dark:text-white/90">
            {ledger.reserved.toFixed(1)} t
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
            On hold
          </dt>
          <dd className="ledger-numeral text-theme-xs font-medium text-signal-600 dark:text-signal-400">
            {ledger.heldT.toFixed(1)} t
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
            Available
          </dt>
          <dd className="ledger-numeral text-theme-xs font-semibold text-loop-600 dark:text-loop-400">
            {ledger.available.toFixed(1)} t
          </dd>
        </div>
        <div className="hairline-t flex items-center justify-between pt-1.5">
          <dt className="text-theme-xs text-gray-500 dark:text-gray-400">
            Total
          </dt>
          <dd className="ledger-numeral text-theme-xs font-semibold text-ink-900 dark:text-white/90">
            {total.toFixed(1)} t
          </dd>
        </div>
      </dl>
    </div>
  );
}
