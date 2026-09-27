import CapacityBar from "@/components/greenloop/CapacityBar";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import {
  ReceiverOptionCard,
  type ReceiverOption,
} from "@/components/greenloop/AppExploration";
import Badge from "@/components/ui/badge/Badge";
import { availableT, computeMatch, slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import type { ReceiverFacility } from "@/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function Receivers() {
  const { dataset } = useGreenLoopStore();

  // Humanized match for the scenario material (MP-101): decisions first,
  // composite scores remain on the Allocations (admin) page.
  const requestMaterial = dataset.materials.find((m) => m.id === STORY.materialAId);
  const candidates = computeMatch(dataset, STORY.materialAId);
  const matchOptions: ReceiverOption[] = candidates.map((c, i) => {
    const receiver = dataset.receivers.find((r) => r.id === c.receiverId);
    const slot = dataset.slots.find((s) => s.receiverId === c.receiverId && s.materialType === requestMaterial?.type);
    const ledger = slot ? slotLedger(dataset, slot.id) : undefined;
    const accepts = receiver?.acceptedTypes.includes(requestMaterial?.type ?? "concrete") ?? false;
    const reasons: string[] = [];
    if (accepts) reasons.push(`Accepts ${requestMaterial?.type ?? "material"}`);
    if (accepts && ledger) {
      reasons.push(`${ledger.slot.capacityT.toFixed(0)} t capacity · ${ledger.available.toFixed(1)} t available`);
      if (ledger.available >= (requestMaterial?.quantityT ?? 0)) reasons.push("Fits your full quantity");
      else reasons.push("Partial — a hold would be recorded for the balance");
    }
    reasons.push(`${c.distanceKm} km away`);
    reasons.push(`Suitable for your ${requestMaterial?.condition ?? "surveyed"} ${requestMaterial?.type ?? "material"} (Grade ${requestMaterial?.grade ?? "B"})`);
    return {
      receiverId: c.receiverId,
      name: receiver?.name ?? c.receiverId,
      location: receiver?.location ?? "—",
      distanceKm: c.distanceKm,
      acceptsMaterial: accepts,
      slotAvailableT: ledger?.available ?? c.availableT,
      slotCapacityT: ledger?.slot.capacityT ?? 0,
      slotDate: ledger?.slot.date ?? "—",
      recommended: i === 0,
      reasons,
    };
  });

  return (
    <>
      <PageMeta
        title="Receivers | GreenLoop"
        description="Receiver facilities with live intake capacity on the GreenLoop platform."
      />
      <PageBreadCrumb pageTitle="Find a receiver" />

      {/* Humanized matching (§16) — the story material, in plain language. */}
      {requestMaterial && (
        <section className="mb-6">
          <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white/90">
            We found a suitable receiver for your {requestMaterial.type}
          </h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
            {requestMaterial.quantityT.toFixed(1)} t surveyed · {requestMaterial.condition} condition · Grade {requestMaterial.grade}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {matchOptions.map((option) => (
              <ReceiverOptionCard key={option.receiverId} option={option} materialT={requestMaterial.quantityT} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
        {dataset.receivers.map((receiver: ReceiverFacility) => {
          const slots = dataset.slots
            .filter((s) => s.receiverId === receiver.id)
            .sort((a, b) => a.date.localeCompare(b.date));
          const isScenarioReceiver = receiver.id === STORY.receiverId;

          return (
            <article key={receiver.id} className="surface-card p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
                    {receiver.name}
                  </h3>
                  <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    {receiver.location} ·{" "}
                    <span className="ledger-numeral">{receiver.distanceKm} km</span> from project
                    cluster
                  </p>
                </div>
                {isScenarioReceiver && (
                  <Badge color="primary" size="sm">
                    Demo scenario
                  </Badge>
                )}
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <dt className="eyebrow-label text-steel-600 dark:text-steel-400">Daily intake</dt>
                  <dd className="ledger-numeral mt-1 text-theme-sm font-semibold text-ink-900 dark:text-white/90">
                    {receiver.dailyIntakeT} t
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow-label text-steel-600 dark:text-steel-400">Current stock</dt>
                  <dd className="ledger-numeral mt-1 text-theme-sm font-semibold text-ink-900 dark:text-white/90">
                    {receiver.currentStockT} t
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow-label text-steel-600 dark:text-steel-400">Accepts</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {receiver.acceptedTypes.map((type) => (
                      <span
                        key={type}
                        className="rounded border border-steel-200 bg-steel-50 px-1.5 py-0.5 text-theme-xs text-ink-800 dark:border-steel-800 dark:bg-white/5 dark:text-gray-300"
                      >
                        {TYPE_LABEL[type] ?? type}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              <div className="hairline-t mt-4 space-y-4 pt-4">
                <p className="eyebrow-label text-steel-600 dark:text-steel-400">
                  Intake slots — live ledger
                </p>
                {slots.map((slot) => {
                  const reserved = slot
                    ? availableT(slot, dataset.bookings)
                    : 0;
                  const reservedT = slot.capacityT - reserved;
                  const holds = dataset.bookings.filter(
                    (b) => b.slotId === slot.id && b.status === "hold",
                  );
                  return (
                    <div key={slot.id}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-theme-sm font-medium text-ink-900 dark:text-white/90">
                          {TYPE_LABEL[slot.materialType] ?? slot.materialType} ·{" "}
                          <span className="ledger-numeral">{slot.date}</span>
                        </p>
                        {holds.length > 0 && (
                          <Badge color="warning" size="sm">
                            {holds.length} on hold
                          </Badge>
                        )}
                      </div>
                      <CapacityBar
                        capacityT={slot.capacityT}
                        reservedT={reservedT}
                        heldT={holds.reduce((acc, h) => acc + h.tonnesT, 0)}
                      />
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
