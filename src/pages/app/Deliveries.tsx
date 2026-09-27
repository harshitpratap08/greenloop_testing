/**
 * Deliveries — the physical-digital dispatch experience.
 *
 * LOAD-1001 story: planned → dispatched → verified, with route, receiver,
 * booking linkage and load evidence. All figures from the domain engine.
 */

import { useGreenLoopStore } from "@/store/GreenLoopStore";
import {
  EmptyState,
  FriendlyPageHeader,
  StatusChip,
} from "@/components/greenloop/AppExploration";
import type { Booking } from "@/domain/types";

export default function Deliveries() {
  const { dataset } = useGreenLoopStore();
  const dispatchable = dataset.bookings.filter(
    (b) => b.status === "confirmed",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <FriendlyPageHeader
        title="Deliveries"
        subtitle="Loads on the road — dispatch, route and receiving evidence."
      />

      {dispatchable.length === 0 ? (
        <EmptyState
          title="No confirmed bookings to dispatch"
          body="A load appears here once a booking is confirmed against receiver capacity."
          action={{ label: "Go to bookings", to: "/app/bookings" }}
        />
      ) : (
        <div className="space-y-4">
          {dispatchable.map((booking) => (
            <LoadCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadCard({ booking }: { booking: Booking }) {
  const { dataset } = useGreenLoopStore();
  const receiver = dataset.receivers.find((r) => r.id === booking.receiverId);
  const material = dataset.materials.find((m) => m.id === booking.materialId);
  const slot = dataset.slots.find((s) => s.id === booking.slotId);
  const verification = dataset.verifications.find((v) => v.bookingId === booking.id);
  const loadRef = verification?.loadRef ?? `LOAD-${booking.id.replace("BK-", "10")}`;
  const events = dataset.events.filter((e) =>
    e.subjectIds.some((id) => id === booking.id || id === booking.allocationId || id === verification?.id),
  );
  const project = dataset.projects.find((p) => p.id === material?.projectId);

  return (
    <section className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">{loadRef}</p>
          <h2 className="mt-1 font-archivo text-xl font-bold text-ink-900 dark:text-white">
            {booking.tonnesT.toFixed(1)} t {material?.type ?? "material"}
          </h2>
          <p className="mt-0.5 text-theme-sm text-gray-500 dark:text-gray-400">
            {project?.name} → {receiver?.name}
          </p>
        </div>
        <StatusChip status={verification ? "verified" : "confirmed"} />
      </div>

      {/* Route strip: project → receiver */}
      <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <div className="min-w-0">
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">From</p>
          <p className="truncate text-theme-sm font-semibold text-ink-900 dark:text-white">{project?.name}</p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{project?.location}</p>
        </div>
        <div className="grow border-t-2 border-dashed border-steel-300 dark:border-steel-700" aria-hidden="true" />
        <div className="shrink-0 text-center">
          <p className="ledger-numeral text-theme-sm font-bold text-ink-900 dark:text-white">
            {receiver?.distanceKm ?? 0} km
          </p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{booking.tonnesT.toFixed(1)} t</p>
        </div>
        <div className="grow border-t-2 border-dashed border-steel-300 dark:border-steel-700" aria-hidden="true" />
        <div className="min-w-0 text-end">
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">To</p>
          <p className="truncate text-theme-sm font-semibold text-ink-900 dark:text-white">{receiver?.name}</p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{receiver?.location}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Detail label="Slot date" value={slot?.date ?? "—"} />
        <Detail label="Planned" value={`${booking.tonnesT.toFixed(1)} t`} />
        <Detail label="Received" value={verification ? `${verification.actualT.toFixed(1)} t` : "awaiting"} />
        <Detail label="Accepted" value={verification ? `${verification.acceptedT.toFixed(1)} t` : "—"} />
      </dl>

      {/* Load evidence + activity timeline */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">Evidence</p>
          {verification && verification.evidence.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {verification.evidence.map((ev) => (
                <li key={ev.ref ?? ev.label} className="rounded border border-steel-200 bg-steel-50 px-2.5 py-1.5 text-theme-xs text-ink-800 dark:border-steel-800 dark:bg-white/5 dark:text-gray-300">
                  {ev.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
              Evidence attaches at verification — intake photos and weighbridge tickets.
            </p>
          )}
        </div>
        <div>
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">Activity</p>
          <ol className="mt-2 space-y-2">
            {events.slice(-5).map((e) => (
              <li key={e.id} className="flex items-baseline gap-2 text-theme-xs">
                <span className="ledger-numeral shrink-0 text-gray-400 dark:text-gray-500">
                  {e.at.slice(11, 16)}
                </span>
                <span className="text-ink-800 dark:text-gray-200">{e.summary}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className="ledger-numeral mt-1 text-theme-sm font-semibold text-ink-900 dark:text-white">{value}</dd>
    </div>
  );
}
