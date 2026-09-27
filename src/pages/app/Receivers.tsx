import { useState } from "react";
import { Link } from "react-router";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { materialMedia } from "@/components/greenloop/AppExploration";
import { computeMatch, slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
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

export default function Receivers() {
  const { dataset, requestCapacityAction } = useGreenLoopStore();
  const [materialId, setMaterialId] = useState<string>(STORY.materialAId);
  const [receiverId, setReceiverId] = useState<string>("");
  const material = dataset.materials.find((item) => item.id === materialId);
  const project = material && dataset.projects.find((item) => item.id === material.projectId);
  const media = material ? materialMedia(material) : [];
  const matches = material ? computeMatch(dataset, material.id) : [];
  const orderedMatches = [...matches].sort((a, b) => Number(b.recommended) - Number(a.recommended));
  const selectedMatch = orderedMatches.find((candidate) => candidate.receiverId === receiverId) ?? orderedMatches[0];
  const selectedReceiver = selectedMatch && dataset.receivers.find((receiver) => receiver.id === selectedMatch.receiverId);
  const selectedSlot = selectedMatch && dataset.slots
    .filter((slot) => slot.receiverId === selectedMatch.receiverId && slot.materialType === material?.type)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const existingAllocation = selectedMatch && material
    ? dataset.allocations.find((allocation) => allocation.materialId === material.id && allocation.receiverId === selectedMatch.receiverId && allocation.status !== "cancelled")
    : undefined;
  const selectedLedger = selectedSlot ? slotLedger(dataset, selectedSlot.id) : undefined;
  const capacityFits = Boolean(material && selectedMatch && selectedMatch.availableT >= material.quantityT);

  return (
    <>
      <PageMeta
        title="Find a Receiver | GreenLoop"
        description="Find a suitable receiver and check real intake capacity for surveyed construction material."
      />
      <PageBreadCrumb pageTitle="Find a receiver" />

      <header className="mb-8 border-b border-steel-300 pb-6 dark:border-steel-700">
        <p className="eyebrow-label text-steel-600 dark:text-steel-400">Material destination planning</p>
        <h1 className="mt-2 max-w-3xl font-archivo text-title-sm font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">
          Where can this material realistically go?
        </h1>
        <p className="mt-2 max-w-2xl text-theme-sm leading-6 text-gray-600 dark:text-gray-400">
          Compare suitable local receivers against their live intake capacity, then choose where to request a reservation.
        </p>
        <ol className="mt-6 grid grid-cols-2 border-y border-steel-200 sm:grid-cols-4 dark:border-steel-800" aria-label="Receiver matching steps">
          {["Material", "Suitable receivers", "Capacity", "Select receiver"].map((step, index) => (
            <li key={step} className="flex items-center gap-2 border-b border-steel-200 py-3 pe-3 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0 dark:border-steel-800">
              <span className={cn("ledger-numeral text-theme-xs", index < 2 ? "text-loop-700 dark:text-loop-300" : "text-steel-500 dark:text-steel-400")}>0{index + 1}</span>
              <span className={cn("text-theme-xs font-medium", index === 0 ? "text-ink-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>{step}</span>
            </li>
          ))}
        </ol>
      </header>

      <section aria-labelledby="material-heading" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">01 · Material</p>
            <h2 id="material-heading" className="mt-1 font-archivo text-xl font-semibold text-ink-900 dark:text-white">Start with a surveyed passport</h2>
          </div>
          <label className="flex flex-col gap-1 text-theme-xs text-gray-600 dark:text-gray-400">
            Select material passport
            <select
              value={materialId}
              onChange={(event) => {
                setMaterialId(event.target.value);
                setReceiverId("");
              }}
              className="min-w-64 border border-steel-300 bg-gray-25 px-3 py-2 text-theme-sm text-ink-900 outline-none focus:border-loop-600 dark:border-steel-700 dark:bg-gray-dark dark:text-white"
            >
              {dataset.materials.map((item) => (
                <option key={item.id} value={item.id}>{item.id} · {TYPE_LABEL[item.type] ?? item.type} · {item.quantityT.toFixed(1)} t</option>
              ))}
            </select>
          </label>
        </div>

        {material && (
          <article className="grid overflow-hidden border border-steel-200 bg-gray-25 dark:border-steel-800 dark:bg-gray-dark md:grid-cols-[0.7fr_1.3fr]">
            <div className="relative min-h-52 bg-steel-100 dark:bg-steel-900 md:min-h-64">
              {media[0] && <img src={media[0].src} alt={media[0].caption} className="absolute inset-0 size-full object-cover" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-4 pt-12 text-white">
                <p className="eyebrow-label text-white/65">Physical material</p>
                <p className="mt-1 font-archivo text-2xl font-semibold">{TYPE_LABEL[material.type] ?? material.type}</p>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-steel-200 pb-4 dark:border-steel-800">
                <div>
                  <p className="eyebrow-label text-steel-600 dark:text-steel-400">Digital material passport</p>
                  <p className="ledger-numeral mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{material.id} · surveyed {material.surveyedAt.slice(0, 10)}</p>
                </div>
                <StatusBadge status={material.status} />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <PassportMetric label="Surveyed quantity" value={`${material.quantityT.toFixed(1)} t`} />
                <PassportMetric label="Condition · grade" value={`${material.condition} · ${material.grade}`} />
                <PassportMetric label="Estimate range" value={`${material.quantityRangeT[0]}–${material.quantityRangeT[1]} t`} />
                <PassportMetric label="Survey evidence" value={`${material.evidence.length} records`} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-steel-200 pt-3 text-theme-xs dark:border-steel-800">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Project origin · </span>
                  <Link to="/app/explore" state={{ projectId: material.projectId }} className="font-medium text-ink-900 underline decoration-steel-300 underline-offset-4 dark:text-white">{project?.name ?? material.projectId}</Link>
                  {project && <span className="text-gray-500 dark:text-gray-400"> · {project.location}</span>}
                </div>
                <p className="text-gray-500 dark:text-gray-400">{media[0]?.caption ?? "No photo evidence available"}</p>
              </div>
            </div>
          </article>
        )}
      </section>

      <section aria-labelledby="receivers-heading" className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">02 · Suitable receivers</p>
            <h2 id="receivers-heading" className="mt-1 font-archivo text-xl font-semibold text-ink-900 dark:text-white">Places equipped to take this material</h2>
          </div>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">Ranked by fit, demand, capacity and distance</p>
        </div>

        {orderedMatches.length > 0 ? (
          <div className="space-y-3">
            {orderedMatches.map((candidate) => {
              const receiver = dataset.receivers.find((item) => item.id === candidate.receiverId);
              const slot = dataset.slots
                .filter((item) => item.receiverId === candidate.receiverId && item.materialType === material?.type)
                .sort((a, b) => a.date.localeCompare(b.date))[0];
              const ledger = slot ? slotLedger(dataset, slot.id) : undefined;
              const allocation = material && dataset.allocations.find((item) => item.materialId === material.id && item.receiverId === candidate.receiverId && item.status !== "cancelled");
              const fits = Boolean(material && candidate.availableT >= material.quantityT);
              const isSelected = selectedMatch?.receiverId === candidate.receiverId;
              const availableStatus = allocation?.status === "confirmed" ? "Confirmed" : allocation?.status === "hold" ? "HOLD" : fits ? "Available" : candidate.availableT > 0 ? "Limited capacity" : "Full";
              const statusClass = allocation?.status === "confirmed" || (!allocation && fits)
                ? "border-loop-300 bg-loop-50 text-loop-700 dark:border-loop-500/40 dark:bg-loop-500/10 dark:text-loop-300"
                : allocation?.status === "hold" || (!allocation && candidate.availableT > 0)
                  ? "border-signal-300 bg-signal-50 text-signal-700 dark:border-signal-500/40 dark:bg-signal-500/10 dark:text-signal-300"
                  : "border-steel-300 bg-steel-50 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300";
              const potential = allocation?.status === "confirmed"
                ? allocation.requestedT
                : Math.min(material?.quantityT ?? 0, candidate.availableT);

              return (
                <article key={candidate.receiverId} className={cn("grid border bg-gray-25 dark:bg-gray-dark lg:grid-cols-[1fr_auto]", candidate.recommended ? "border-loop-600 ring-1 ring-loop-600/20 dark:border-loop-500" : "border-steel-200 dark:border-steel-800")}>
                  <div className="min-w-0 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-archivo text-lg font-semibold text-ink-900 dark:text-white">{receiver?.name ?? candidate.receiverId}</h3>
                          {candidate.recommended && <span className="border border-loop-500 bg-loop-500 px-2 py-0.5 text-theme-xs font-semibold text-white">Strongest fit</span>}
                        </div>
                        <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{receiver?.location ?? "—"} · {candidate.distanceKm} km from project cluster</p>
                      </div>
                      <span className={cn("border px-2 py-1 text-theme-xs font-medium", statusClass)}>{availableStatus}</span>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-steel-200 py-4 sm:grid-cols-4 dark:border-steel-800">
                      <PassportMetric label="Suitability" value={`${Math.round(candidate.suitability * 100)}%`} />
                      <PassportMetric label="Available capacity" value={`${candidate.availableT.toFixed(1)} / ${(ledger?.slot.capacityT ?? 0).toFixed(1)} t`} />
                      <PassportMetric label="Daily intake" value={`${receiver?.dailyIntakeT ?? 0} t`} />
                      <PassportMetric label="Potential recovery" value={`${potential.toFixed(1)} t`} />
                    </dl>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-theme-xs">
                      <span className="font-medium text-ink-800 dark:text-gray-200">Accepts {TYPE_LABEL[material?.type ?? ""] ?? material?.type}</span>
                      {slot && <span className="text-gray-500 dark:text-gray-400">Next listed intake · {slot.date}</span>}
                      {material && candidate.availableT < material.quantityT && <span className="text-signal-700 dark:text-signal-300">{(material.quantityT - candidate.availableT).toFixed(1)} t short of the full surveyed quantity</span>}
                    </div>
                  </div>
                  <div className="flex items-center border-t border-steel-200 p-5 lg:w-52 lg:border-s lg:border-t-0 dark:border-steel-800">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setReceiverId(candidate.receiverId)}
                      className={cn("w-full border px-4 py-2.5 text-theme-sm font-semibold transition-colors", isSelected ? "border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900" : "border-steel-400 text-ink-900 hover:border-ink-900 dark:border-steel-600 dark:text-white dark:hover:border-white")}
                    >
                      {isSelected ? "Receiver selected" : "Select receiver"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="border border-steel-200 p-5 text-theme-sm text-gray-600 dark:border-steel-800 dark:text-gray-400">No receiver currently accepts this material type.</p>
        )}
      </section>

      {selectedMatch && selectedReceiver && material && (
        <section aria-labelledby="capacity-heading" className="border-t-2 border-ink-900 pt-6 dark:border-white">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">03 · Capacity → 04 · Select receiver</p>
              <h2 id="capacity-heading" className="mt-1 font-archivo text-xl font-semibold text-ink-900 dark:text-white">{selectedReceiver.name}</h2>
              <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">
                {material.quantityT.toFixed(1)} t of {TYPE_LABEL[material.type] ?? material.type} · {selectedMatch.distanceKm} km · {selectedSlot?.date ?? "No intake date"}
              </p>
              {selectedLedger && (
                <div className="mt-4 max-w-2xl">
                  <div className="mb-2 flex justify-between gap-3 text-theme-xs">
                    <span className="text-gray-500 dark:text-gray-400">Live slot capacity</span>
                    <span className={cn("ledger-numeral font-medium", capacityFits ? "text-loop-700 dark:text-loop-300" : "text-signal-700 dark:text-signal-300")}>{selectedMatch.availableT.toFixed(1)} t free of {selectedLedger.slot.capacityT.toFixed(1)} t</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${selectedMatch.availableT.toFixed(1)} tonnes available of ${selectedLedger.slot.capacityT.toFixed(1)} tonnes`}>
                    <div className={cn("h-full", capacityFits ? "bg-loop-600" : "bg-signal-500")} style={{ width: `${Math.min(100, (selectedMatch.availableT / Math.max(selectedLedger.slot.capacityT, 0.1)) * 100)}%` }} />
                  </div>
                </div>
              )}
              {existingAllocation && <div className="mt-3 flex items-center gap-2"><StatusBadge status={existingAllocation.status} /><Link to="/app/bookings" className="text-theme-xs font-medium text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">View capacity request</Link></div>}
              <p className="mt-3 max-w-2xl text-theme-xs leading-5 text-gray-500 dark:text-gray-400">A request uses the surveyed quantity. If the selected intake cannot take the full load, GreenLoop records it as a HOLD rather than confirming unavailable capacity.</p>
            </div>
            {!existingAllocation && selectedSlot && (
              <button
                type="button"
                onClick={() => requestCapacityAction({ materialId: material.id, receiverId: selectedReceiver.id, slotId: selectedSlot.id, tonnesT: material.quantityT })}
                className="border border-ink-900 bg-ink-900 px-5 py-3 text-theme-sm font-semibold text-white transition-colors hover:bg-ink-800 dark:border-white dark:bg-white dark:text-ink-900 dark:hover:bg-gray-200"
              >
                Request capacity
              </button>
            )}
          </div>
          {existingAllocation?.status === "hold" && existingAllocation.holdReason && <p className="mt-4 border-s-2 border-signal-500 bg-signal-50 px-4 py-3 text-theme-sm text-signal-800 dark:bg-signal-500/10 dark:text-signal-200">{existingAllocation.holdReason}</p>}
        </section>
      )}

      <p className="mt-8 border-t border-steel-200 pt-4 text-theme-xs text-gray-500 dark:border-steel-800 dark:text-gray-400">
        Receiver match: suitability, available intake, daily demand and distance. Detailed optimization figures remain in <Link to="/app/allocations" className="font-medium text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">Allocations</Link> for operational review.
      </p>
    </>
  );
}

function PassportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className="ledger-numeral mt-1 text-theme-sm font-semibold capitalize text-ink-900 dark:text-white">{value}</dd>
    </div>
  );
}
