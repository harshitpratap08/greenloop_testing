import PageMeta from "@/components/common/PageMeta";
import { materialMedia } from "@/components/greenloop/AppExploration.helpers";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { ambientMedia, materialMediaFor, receiverMediaFor } from "@/config/appMedia";
import { computeMatch, slotLedger } from "@shared/domain/capacity";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatDate } from "@/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link, useLocation } from "react-router";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

const WORKFLOW_STEPS = [
  "Choose material",
  "Compare receivers",
  "Check free capacity",
  "Request a slot",
];

export default function Receivers() {
  const { dataset, requestCapacityAction } = useGreenLoopStore();
  const location = useLocation();
  const [materialId, setMaterialId] = useState<string>(location.state?.materialId || dataset.materials.find(material => material.projectId === location.state?.projectId)?.id || dataset.materials[0]?.id || "");
  const [receiverId, setReceiverId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [holdState, setHoldState] = useState<{ requested: number; available: number; slotId: string; receiverId: string } | null>(null);
  const [chooseAnotherDate, setChooseAnotherDate] = useState(false);
  const [alternateSlotId, setAlternateSlotId] = useState("");

  const material = dataset.materials.find((item) => item.id === materialId);
  const allocatedT = material ? dataset.allocations
    .filter((allocation) => allocation.materialId === material.id && allocation.status !== "cancelled")
    .reduce((sum, allocation) => sum + allocation.requestedT, 0) : 0;
  const remainingT = material ? Math.max(0, material.quantityT - allocatedT) : 0;
  const project = material && dataset.projects.find((item) => item.id === material.projectId);
  const media = material ? materialMedia(material) : [];
  const materialImageFallback = material ? materialMediaFor(material.type) : ambientMedia.sortingFacility;
  const materialImage = media[0];
  const matches = material ? computeMatch(dataset, material.id, new Date().toISOString().slice(0, 10)) : [];
  const orderedMatches = [...matches].sort((a, b) => Number(b.recommended) - Number(a.recommended));
  const selectedMatch = orderedMatches.find((candidate) => candidate.receiverId === receiverId) ?? orderedMatches[0];
  const selectedReceiver = selectedMatch && dataset.receivers.find((receiver) => receiver.id === selectedMatch.receiverId);
  const receiverSlots = selectedMatch && material ? dataset.slots
    .filter((slot) => slot.receiverId === selectedMatch.receiverId && slot.materialType === material.type && slot.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date)) : [];
  const selectedSlot = receiverSlots.find((slot) => slot.id === selectedSlotId) ?? receiverSlots[0];
  const requestedT = requestQuantity ? Number(requestQuantity) : remainingT;
  const requestValid = Number.isFinite(requestedT) && requestedT > 0 && requestedT <= remainingT;
  const existingAllocation = selectedMatch && material
    ? dataset.allocations.find((allocation) => allocation.materialId === material.id && allocation.receiverId === selectedMatch.receiverId && allocation.status !== "cancelled")
    : undefined;
  const selectedLedger = selectedSlot ? slotLedger(dataset, selectedSlot.id) : undefined;
  const capacityFits = Boolean(material && selectedMatch && selectedLedger && selectedLedger.available >= requestedT);
  const activeStep = !material ? 0 : !receiverId ? 1 : !requestValid || !selectedSlot || !capacityFits ? 2 : 3;

  return (
    <div className="mx-auto max-w-app pb-16">
      <PageMeta title="Find a Receiver | GreenLoop" description="Find a suitable receiver and check real intake capacity for surveyed construction material." />

      <section className="relative mb-4 grid min-h-[172px] overflow-hidden border border-[#e5e1d8] bg-[#192c20] dark:border-steel-800 sm:min-h-[185px] lg:grid-cols-[1fr_230px] rounded-surface">
        <img src={ambientMedia.sortingFacility.src} alt={ambientMedia.sortingFacility.alt} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/72 to-[#17291e]/10" />
        <div className="relative z-10 flex flex-col justify-center px-5 py-6 sm:px-8 sm:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c7d5c8]">GreenLoop Operations</p>
          <h1 className="mt-1.5 font-archivo font-bold tracking-tight text-white gl-page-title">Find a receiver</h1>
          <p className="mt-2 max-w-xl text-sm leading-5 text-white/85 sm:text-base sm:leading-6">Compare facilities that accept your material, check their free receiving capacity, and request an intake slot.</p>
          <span className="mt-3 inline-flex w-fit items-center rounded-md border border-white/25 bg-[#102118]/45 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            {material ? `${remainingT.toFixed(1)} t of ${TYPE_LABEL[material.type] ?? material.type} available to match` : "Choose a Material Passport to get started"}
          </span>
        </div>
        <div className="relative z-10 hidden flex-col justify-center gap-2 border-s border-white/15 bg-[#12241a]/45 px-5 py-5 backdrop-blur-sm lg:flex">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-[#d5e2d6]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
          </span>
          <p className="max-w-[180px] text-sm font-semibold leading-5 text-white">Connect with local receivers and keep materials in use.</p>
        </div>
      </section>

      <nav aria-label="Receiver matching steps" className="mb-section overflow-hidden border border-[#e5e2da] bg-white dark:border-steel-800 dark:bg-[#17251d] rounded-surface">
        <ol className="grid grid-cols-2 divide-x divide-y divide-[#eeeae2] sm:grid-cols-4 sm:divide-y-0 dark:divide-steel-800">
          {WORKFLOW_STEPS.map((step, index) => {
            const complete = index < activeStep || Boolean(existingAllocation && index === 3);
            const active = index === activeStep && !existingAllocation;
            return (
              <li key={step} aria-current={active ? "step" : undefined} className="flex min-h-[58px] items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4">
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-[#dfece1] text-[#386343] dark:bg-[#31553b] dark:text-[#d1e4d5]" : active ? "bg-[#315f3d] text-white" : "bg-[#f0f0eb] text-[#8c948c] dark:bg-white/[0.07] dark:text-gray-400"}`}>
                  {complete ? "✓" : `0${index + 1}`}
                </span>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-semibold ${active || complete ? "text-[#2b3d30] dark:text-white" : "text-[#899189] dark:text-gray-400"}`}>{step}</p>
                  <p className="hidden truncate text-xs text-[#899189] dark:text-gray-500 sm:block">{index === 0 ? "Select from surveyed passports" : index === 1 ? "View facilities and capacity" : index === 2 ? "See available intake slots" : "Confirm and submit"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <section aria-labelledby="material-heading" className="mb-section">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4b7956] dark:text-[#b8d0bd]">01 · Material</p>
            <h2 id="material-heading" className="mt-1 font-archivo text-xl font-bold text-[#26362c] dark:text-white sm:text-2xl">Start with a surveyed passport</h2>
          </div>
          <label className="relative block w-full sm:w-auto">
            <span className="sr-only">Select material passport</span>
            <select value={materialId} onChange={(event) => {
              setMaterialId(event.target.value);
              setReceiverId("");
              setSelectedSlotId("");
              setRequestQuantity("");
              setHoldState(null);
            }} className="h-10 w-full appearance-none rounded-lg border border-[#dcded7] bg-white px-4 pr-10 text-xs font-semibold text-[#334439] outline-none focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white sm:min-w-[260px]">
              {dataset.materials.map((item) => {
                const itemAllocated = dataset.allocations.filter((allocation) => allocation.materialId === item.id && allocation.status !== "cancelled").reduce((sum, allocation) => sum + allocation.requestedT, 0);
                const itemRemaining = Math.max(0, item.quantityT - itemAllocated);
                return <option key={item.id} value={item.id}>{TYPE_LABEL[item.type] ?? item.type} · {itemRemaining.toFixed(1)} t available</option>;
              })}
            </select>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#7e887f]"><path d="m7 10 5 5 5-5" /></svg>
          </label>
        </div>

        {material ? (
          <AnimatePresence mode="wait">
            <motion.article key={material.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35, ease: "easeOut" }} className="grid overflow-hidden border border-[#e5e2da] bg-white shadow-[0_2px_10px_rgba(26,42,31,0.035)] dark:border-steel-800 dark:bg-[#17251d] md:grid-cols-[0.8fr_1.2fr] rounded-surface">
              <div className="relative min-h-[190px] overflow-hidden bg-[#ecebe5] sm:min-h-[225px] dark:bg-[#24372b]">
                <img src={materialImage?.src ?? materialImageFallback.src} alt={materialImage?.caption ?? materialImageFallback.alt} className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#142319]/85 via-[#142319]/15 to-transparent" />
                <div className="absolute bottom-4 left-5 text-white sm:bottom-5 sm:left-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/75">Surveyed Material</p>
                  <p className="mt-1 font-archivo text-2xl font-bold uppercase tracking-wide sm:text-3xl">{TYPE_LABEL[material.type] ?? material.type}</p>
                </div>
              </div>

              <div className="flex flex-col gl-card-pad">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eeeae2] pb-4 dark:border-steel-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#899189]">Material Passport · your material’s digital record</p>
                    <p className="mt-1.5 text-xs text-[#737d74] dark:text-gray-400">ID: <span className="font-semibold text-[#2f4034] dark:text-white">{material.id}</span> · surveyed {formatDate(material.surveyedAt)}</p>
                  </div>
                  <StatusBadge status={material.status} />
                </div>

                <dl className="grid grid-cols-2 gap-x-3 gap-y-4 py-4 sm:grid-cols-4">
                  <PassportMetric label="Surveyed quantity" value={`${material.quantityT.toFixed(1)} t`} highlight />
                  <PassportMetric label="Condition · grade" value={`${material.condition} · ${material.grade}`} />
                  <PassportMetric label="Estimate range" value={`${material.quantityRangeT[0]}–${material.quantityRangeT[1]} t`} />
                  <PassportMetric label="Survey evidence" value={`${material.evidence.length} records`} />
                </dl>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#f6f5f0] px-3.5 py-3 dark:bg-white/[0.04]">
                  <div className="min-w-0 text-xs">
                    <span className="text-[#7c857d] dark:text-gray-400">Project origin: </span>
                    <Link to={`/app/materials?project=${encodeURIComponent(material.projectId)}`} className="font-semibold text-[#34483a] underline decoration-[#bdc8bc] underline-offset-2 hover:text-[#315f3d] dark:text-white">{project?.name ?? material.projectId}</Link>
                    {project && <span className="text-[#7c857d] dark:text-gray-400"> · {project.location}</span>}
                  </div>
                  <Link to={`/app/materials/${material.id}`} className="shrink-0 text-xs font-semibold text-[#426b4c] hover:underline dark:text-[#b8d0bd]">View passport →</Link>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        ) : (
          <div className="border border-dashed border-[#d8ddd5] bg-white/60 px-6 py-10 text-center dark:border-steel-700 dark:bg-white/[0.02] rounded-surface">
            <p className="font-semibold text-[#526158] dark:text-gray-300">No surveyed material passports are available yet.</p>
            <Link to="/app/materials/new" className="mt-3 inline-flex text-sm font-semibold text-[#416d4b] underline underline-offset-4 dark:text-[#b8d0bd]">Add Material</Link>
          </div>
        )}
      </section>

      <section aria-labelledby="receivers-heading" className="mb-section">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4b7956] dark:text-[#b8d0bd]">02 · Suitable Receivers</p>
            <h2 id="receivers-heading" className="mt-1 font-archivo text-xl font-bold text-[#26362c] dark:text-white sm:text-2xl">Places equipped to take this material</h2>
          </div>
          <p className="text-xs text-[#7c857d] dark:text-gray-400">Ranked by fit, demand, capacity and distance</p>
        </div>

        {orderedMatches.length > 0 ? (
          <div className="grid gap-detail">
            {orderedMatches.map((candidate, index) => {
              const receiver = dataset.receivers.find((item) => item.id === candidate.receiverId);
              const slot = dataset.slots
                .filter((item) => item.receiverId === candidate.receiverId && item.materialType === material?.type)
                .sort((a, b) => a.date.localeCompare(b.date))[0];
              const ledger = slot ? slotLedger(dataset, slot.id) : undefined;
              const allocation = material && dataset.allocations.find((item) => item.materialId === material.id && item.receiverId === candidate.receiverId && item.status !== "cancelled");
              const fits = Boolean(material && candidate.availableT >= remainingT);
              const isSelected = selectedMatch?.receiverId === candidate.receiverId;
              const availableStatus = allocation?.status === "confirmed" ? "Booked" : allocation?.status === "hold" ? "Waiting on Capacity" : fits ? "Available" : candidate.availableT > 0 ? "Limited capacity" : "Full";
              const statusClass = allocation?.status === "confirmed" || (!allocation && fits)
                ? "border-[#b9d0bd] bg-[#edf4ed] text-[#416b4a] dark:border-loop-500/40 dark:bg-loop-500/10 dark:text-loop-300"
                : allocation?.status === "hold" || (!allocation && candidate.availableT > 0)
                  ? "border-signal-300 bg-signal-50 text-signal-700 dark:border-signal-500/40 dark:bg-signal-500/10 dark:text-signal-300"
                  : "border-[#d9dcd6] bg-[#f1f2ee] text-[#6c756d] dark:border-steel-700 dark:bg-white/5 dark:text-steel-300";
              const potential = allocation?.status === "confirmed" ? allocation.requestedT : Math.min(remainingT, candidate.availableT);
              const receiverImage = receiverMediaFor(candidate.receiverId);

              return (
                <motion.article key={candidate.receiverId} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.04, duration: 0.3 }} className={cn("grid overflow-hidden rounded-xl border bg-white transition-colors dark:bg-[#17251d] sm:grid-cols-[105px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_162px]", isSelected ? "border-[#81a688] ring-1 ring-[#81a688]/35 dark:border-[#6d9373]" : candidate.recommended ? "border-[#b9ceb9] dark:border-[#506957]" : "border-[#e5e2da] dark:border-steel-800")}>
                  <div className="relative min-h-[125px] overflow-hidden bg-[#ecebe5] sm:min-h-full dark:bg-[#24372b]">
                    <img src={receiverImage.src} alt={receiverImage.alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
                  </div>
                  <div className="min-w-0 p-3.5 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-archivo text-sm font-bold uppercase tracking-wide text-[#2b3c30] dark:text-white sm:text-base">{receiver?.name ?? candidate.receiverId}</h3>
                      {candidate.recommended && <span className="border border-[#c7d9c7] bg-[#eef4ed] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#416b4a] dark:border-loop-500/40 dark:bg-loop-500/10 dark:text-loop-300 rounded-surface">Best fit</span>}
                    </div>
                    <p className="mt-1 text-xs text-[#7d867e] dark:text-gray-400"><span className="font-semibold text-[#47594a] dark:text-gray-200">{candidate.distanceKnown === false ? "\u2014" : `${candidate.distanceKm} km`}</span> from project · {receiver?.location ?? "—"}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-y border-[#efede7] py-2.5 dark:border-white/[0.07]">
                      <PassportMetric label="Free capacity" value={`${candidate.availableT.toFixed(1)} t`} highlight={candidate.recommended} compact />
                      <PassportMetric label="Slot capacity" value={`${(ledger?.slot.capacityT ?? 0).toFixed(1)} t`} compact />
                      <PassportMetric label="Potential" value={`${potential.toFixed(1)} t`} compact />
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#69766c] dark:text-gray-400">
                      <span><span className="font-semibold text-[#38483e] dark:text-gray-200">{TYPE_LABEL[material?.type ?? ""] ?? material?.type}</span> accepted</span>
                      {slot ? <span>{formatDate(slot.date)} · {candidate.availableT.toFixed(1)} t free</span> : <span className="font-medium text-signal-600 dark:text-signal-400">No intake date listed</span>}
                      {material && candidate.availableT < remainingT && <span className="font-semibold text-signal-600 dark:text-signal-400">Shortfall: {(remainingT - candidate.availableT).toFixed(1)} t</span>}
                    </div>
                    <details className="mt-2 text-xs text-[#526b58] dark:text-[#b6cfbd]">
                      <summary className="w-fit cursor-pointer font-semibold">View details →</summary>
                      <div className="mt-1.5 grid gap-1 text-[#778078] dark:text-gray-400 sm:grid-cols-2">
                        <p>Daily intake: {receiver?.dailyIntakeT.toFixed(1) ?? "—"} t</p>
                        <p>Accepts: {receiver?.acceptedTypes.map((type) => TYPE_LABEL[type] ?? type).join(", ") ?? "—"}</p>
                        <p>Distance: {candidate.distanceKnown === false ? "\u2014" : `${candidate.distanceKm} km`}</p>
                        <p>Free of slot capacity: {candidate.availableT.toFixed(1)} / {(ledger?.slot.capacityT ?? 0).toFixed(1)} t</p>
                      </div>
                    </details>
                  </div>
                  <div className="flex flex-row items-center justify-between gap-3 border-t border-[#eeeae2] bg-[#f8f7f2] p-3 sm:col-span-2 sm:px-4 lg:col-span-1 lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0 dark:border-steel-800 dark:bg-[#1c2b22]">
                    <span className={cn("inline-flex w-fit shrink-0 rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-wide", statusClass)}>{availableStatus}</span>
                    <button type="button" aria-pressed={isSelected} onClick={() => {
                      setReceiverId(candidate.receiverId);
                      setSelectedSlotId("");
                      setHoldState(null);
                    }} className={cn("inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f3d] lg:flex-none", isSelected ? "bg-[#315f3d] text-white hover:bg-[#274d32]" : "border border-[#cbd4ca] bg-white text-[#3f5946] hover:bg-[#edf3ec] dark:border-steel-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/[0.05]")}>
                      {isSelected ? "Selected" : "Choose receiver"} <span aria-hidden="true">{isSelected ? "✓" : "→"}</span>
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-[#d8ddd5] bg-white/60 px-6 py-10 text-center dark:border-steel-700 dark:bg-white/[0.02] rounded-surface">
            <p className="font-semibold text-[#526158] dark:text-gray-300">No receiver currently accepts this material type.</p>
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedMatch && selectedReceiver && material && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden" aria-labelledby="capacity-heading">
            <div className="overflow-hidden border border-[#e5e2da] bg-white dark:border-steel-800 dark:bg-[#17251d] rounded-surface">
              <div className="border-b border-[#eeeae2] px-4 py-4 sm:px-5 dark:border-steel-800">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4b7956] dark:text-[#b8d0bd]">03 · Capacity</p>
                <h2 id="capacity-heading" className="mt-1 font-archivo text-xl font-bold text-[#26362c] dark:text-white sm:text-2xl">Check free capacity</h2>
                <p className="mt-1 text-xs text-[#778078] dark:text-gray-400">{selectedReceiver.name} · {requestedT.toFixed(1)} t of {TYPE_LABEL[material.type] ?? material.type} · {selectedMatch.distanceKnown === false ? "\u2014" : `${selectedMatch.distanceKm} km`} from project</p>
              </div>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="gl-card-pad">
                  <div className="grid gap-detail sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[#526158] dark:text-gray-300">Request quantity (t)
                      <input type="number" min="0.1" max={remainingT} step="0.1" value={requestQuantity || remainingT.toString()} onChange={(event) => setRequestQuantity(event.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-[#dcded7] bg-white px-3 text-sm text-[#26362c] outline-none focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                      {!requestValid && <span role="alert" className="mt-1 block text-xs text-error-500">Enter a quantity greater than zero and no more than {remainingT.toFixed(1)} t.</span>}
                    </label>
                    <label className="text-xs font-semibold text-[#526158] dark:text-gray-300">Intake date / slot
                      <select value={selectedSlot?.id ?? ""} onChange={(event) => setSelectedSlotId(event.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-[#dcded7] bg-white px-3 text-sm text-[#26362c] outline-none focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white">
                        {receiverSlots.map((slot) => {
                          const ledger = slotLedger(dataset, slot.id);
                          return <option key={slot.id} value={slot.id}>{formatDate(slot.date)} · {ledger?.available.toFixed(1)} t free</option>;
                        })}
                      </select>
                    </label>
                  </div>

                  {selectedLedger && (
                    <div className="mt-4 border border-[#e5e2da] bg-[#f8f7f2] p-4 dark:border-steel-800 dark:bg-[#1c2b22] rounded-surface">
                      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                        <p className="text-xs font-semibold text-[#69766c] dark:text-gray-400">Live slot capacity</p>
                        <p className={cn("font-archivo text-lg font-bold", capacityFits ? "text-[#416b4a] dark:text-loop-300" : "text-signal-600 dark:text-signal-400")}>
                          {selectedLedger.available.toFixed(1)} t free <span className="text-xs font-medium text-[#7d867e]">of {selectedLedger.slot.capacityT.toFixed(1)} t</span>
                        </p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e4e7e1] dark:bg-white/10" role="img" aria-label="Available slot capacity">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, (selectedLedger.available / Math.max(selectedLedger.slot.capacityT, 0.1)) * 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} viewport={{ once: true }} className={cn("h-full rounded-full", capacityFits ? "bg-[#5b8965]" : "bg-signal-500")} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-detail border-t border-[#e5e2da] pt-3 dark:border-steel-800">
                        <PassportMetric label="Requested quantity" value={`${requestedT.toFixed(1)} t`} highlight compact />
                        <PassportMetric label="Available for this slot" value={`${selectedLedger.available.toFixed(1)} t`} compact />
                      </div>
                      <p aria-live="polite" className={cn("mt-3 text-xs font-semibold", !requestValid ? "text-[#69766c] dark:text-gray-400" : capacityFits ? "text-[#416b4a] dark:text-loop-300" : "text-signal-700 dark:text-signal-300")}>
                        {!requestValid ? "Enter a valid quantity to compare available capacity." : capacityFits ? "Current capacity covers this request." : `Insufficient capacity for the full request · ${(requestedT - selectedLedger.available).toFixed(1)} t short.`}
                      </p>
                    </div>
                  )}

                  {existingAllocation && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <StatusBadge status={existingAllocation.status} />
                      <Link to="/app/bookings" className="text-xs font-semibold text-[#426b4c] underline underline-offset-4 dark:text-[#b8d0bd]">View capacity request →</Link>
                    </div>
                  )}
                  {existingAllocation?.status === "hold" && existingAllocation.holdReason && !holdState && (
                    <div className="mt-4 border border-signal-300 bg-signal-50 p-4 dark:border-signal-500/40 dark:bg-signal-500/10 rounded-surface">
                      <p className="text-xs font-semibold text-signal-900 dark:text-signal-100">Waiting on Capacity</p>
                      <p className="mt-1 text-xs text-signal-800 dark:text-signal-200">{existingAllocation.holdReason}</p>
                    </div>
                  )}
                  <p className="mt-4 text-xs leading-5 text-[#778078] dark:text-gray-400">If the selected intake cannot take the full load, GreenLoop records it as a HOLD rather than confirming unavailable capacity.</p>
                </div>

                <div className="border-t border-[#eeeae2] bg-[#f8f7f2] lg:border-l lg:border-t-0 dark:border-steel-800 dark:bg-[#1c2b22] gl-card-pad">
                  {holdState && holdState.receiverId === selectedReceiver.id ? (
                    <div className="border border-signal-300 bg-signal-50 p-4 dark:border-signal-500/40 dark:bg-signal-500/10 rounded-surface">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-signal-700 dark:text-signal-300">04 · Request a slot</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-signal-700 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white dark:bg-signal-500">Waiting on Capacity</span>
                        <h3 className="font-archivo text-sm font-bold text-signal-900 dark:text-signal-100">{holdState.available > 0 ? "Partially available" : "Capacity unavailable"}</h3>
                      </div>
                      <dl className="mt-3 space-y-2 text-xs text-signal-800 dark:text-signal-200">
                        <div className="flex justify-between gap-3"><dt>Requested</dt><dd className="font-bold">{holdState.requested.toFixed(1)} t</dd></div>
                        <div className="flex justify-between gap-3"><dt>Currently available</dt><dd className="font-bold">{holdState.available.toFixed(1)} t</dd></div>
                        <div className="flex justify-between gap-3 border-t border-signal-200 pt-2 dark:border-signal-700/50"><dt>Shortfall</dt><dd className="font-bold">{(holdState.requested - holdState.available).toFixed(1)} t</dd></div>
                      </dl>
                      <p className="mt-3 text-xs leading-5 text-signal-800 dark:text-signal-200">{holdState.available > 0 ? `${holdState.available.toFixed(1)} t can currently be received. ${(holdState.requested - holdState.available).toFixed(1)} t still needs another receiving option.` : "This receiver has no available capacity in this intake slot."}</p>
                      <div className="mt-4 grid gap-2">
                        {holdState.available > 0 && <button type="button" onClick={async () => {
                          if (!await requestCapacityAction({ materialId: material.id, receiverId: holdState.receiverId, slotId: holdState.slotId, tonnesT: holdState.available })) return;
                          setHoldState(null);
                        }} className="min-h-10 rounded-lg bg-[#315f3d] px-3 text-xs font-semibold text-white transition hover:bg-[#274d32]">Book {holdState.available.toFixed(1)} t</button>}
                        <button type="button" onClick={() => { setHoldState(null); setReceiverId(""); }} className="min-h-10 border border-[#cbd4ca] bg-white px-3 text-xs font-semibold text-[#3f5946] hover:bg-[#f0f4ef] dark:border-steel-700 dark:bg-transparent dark:text-gray-200 rounded-surface">Another receiver</button>
                        <button type="button" onClick={() => { setChooseAnotherDate((open) => !open); setAlternateSlotId(""); }} className="min-h-9 text-xs font-semibold text-[#526b58] hover:underline dark:text-[#b6cfbd]">Another date</button>
                      </div>
                      {chooseAnotherDate && material && (
                        <div className="mt-3 space-y-2 border-t border-signal-200 pt-3 dark:border-signal-700/50">
                          <label className="block text-xs font-semibold text-signal-900 dark:text-signal-100">Choose another date
                            <select value={alternateSlotId} onChange={(event) => setAlternateSlotId(event.target.value)} className="mt-1.5 block h-10 w-full rounded-lg border border-[#dcded7] bg-white px-3 text-xs text-[#26362c] dark:border-steel-700 dark:bg-[#17251d] dark:text-white">
                              <option value="">Select an intake slot</option>
                              {dataset.slots.filter((slot) => slot.receiverId === holdState.receiverId && slot.materialType === material.type && slot.id !== holdState.slotId).map((slot) => {
                                const ledger = slotLedger(dataset, slot.id);
                                return <option key={slot.id} value={slot.id}>{formatDate(slot.date)} · {ledger?.available.toFixed(1)} t free</option>;
                              })}
                            </select>
                          </label>
                          <button type="button" disabled={!alternateSlotId} onClick={async () => {
                            if (!await requestCapacityAction({ materialId: material.id, receiverId: holdState.receiverId, slotId: alternateSlotId, tonnesT: holdState.requested })) return;
                            setHoldState(null);
                            setChooseAnotherDate(false);
                          }} className="min-h-10 w-full rounded-lg bg-[#315f3d] px-3 text-xs font-semibold text-white disabled:opacity-50">Request slot</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#4b7956] dark:text-[#b8d0bd]">04 · Request a slot</p>
                      <h3 className="mt-1 font-archivo text-lg font-bold text-[#26362c] dark:text-white">Review your request</h3>
                      <dl className="mt-3 space-y-2 border-y border-[#e5e2da] py-3 text-xs dark:border-steel-800">
                        <div className="flex justify-between gap-2"><dt className="text-[#7c857d] dark:text-gray-400">Material</dt><dd className="text-right font-semibold text-[#34483a] dark:text-gray-200">{TYPE_LABEL[material.type] ?? material.type} · {material.id}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-[#7c857d] dark:text-gray-400">Quantity</dt><dd className="font-semibold text-[#34483a] dark:text-gray-200">{requestedT.toFixed(1)} t</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-[#7c857d] dark:text-gray-400">Receiver</dt><dd className="max-w-[165px] truncate text-right font-semibold text-[#34483a] dark:text-gray-200">{selectedReceiver.name}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-[#7c857d] dark:text-gray-400">Date</dt><dd className="font-semibold text-[#34483a] dark:text-gray-200">{selectedSlot?.date ? formatDate(selectedSlot.date) : "No intake date"}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-[#7c857d] dark:text-gray-400">Available capacity</dt><dd className="font-semibold text-[#34483a] dark:text-gray-200">{selectedLedger?.available.toFixed(1) ?? "0.0"} t</dd></div>
                      </dl>
                      {existingAllocation ? (
                        <p className="mt-3 text-xs leading-5 text-[#778078] dark:text-gray-400">A request already exists for this material and receiver. Use the capacity request above to review its status.</p>
                      ) : !selectedSlot || remainingT <= 0 ? (
                        <p className="mt-3 text-xs leading-5 text-[#778078] dark:text-gray-400">{remainingT <= 0 ? "No unallocated quantity remains for this passport." : "No intake slot is listed for this receiver."}</p>
                      ) : (
                        <button type="button" onClick={() => {
                          if (!requestValid) return;
                          if (requestedT > (selectedLedger?.available ?? 0)) {
                            setHoldState({ requested: requestedT, available: selectedLedger?.available ?? 0, slotId: selectedSlot.id, receiverId: selectedReceiver.id });
                          } else {
                            requestCapacityAction({ materialId: material.id, receiverId: selectedReceiver.id, slotId: selectedSlot.id, tonnesT: requestedT });
                          }
                        }} disabled={!requestValid} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-[#315f3d] px-4 text-sm font-semibold text-white transition hover:bg-[#274d32] disabled:cursor-not-allowed disabled:opacity-50">
                          Request slot <span aria-hidden="true">→</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="mt-6 text-center text-xs text-[#7c857d] dark:text-gray-500">
        Receiver match logic: suitability, available intake, daily demand and distance. Detailed matching scores remain in <Link to="/app/allocations" className="font-semibold text-[#425f49] underline underline-offset-4 hover:text-[#315f3d] dark:text-gray-300">Matches</Link>.
      </div>
    </div>
  );
}

function PassportMetric({ label, value, highlight = false, compact = false }: { label: string; value: string; highlight?: boolean; compact?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-[#899189]">{label}</dt>
      <dd className={cn("truncate font-archivo font-bold capitalize", compact ? "text-xs sm:text-sm" : "mt-0.5 text-base sm:text-lg", highlight ? "text-[#426b4c] dark:text-loop-300" : "text-[#2f4034] dark:text-white")}>{value}</dd>
    </div>
  );
}
