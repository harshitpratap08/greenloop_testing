import { useState } from "react";
import { Link, useLocation } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { materialMedia } from "@/components/greenloop/AppExploration";
import { computeMatch, slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { cn, formatDate } from "@/utils";
import { motion, AnimatePresence } from "motion/react";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { receiverMediaFor } from "@/config/appMedia";

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
  const location = useLocation();
  const [materialId, setMaterialId] = useState<string>(location.state?.materialId || STORY.materialAId);
  const [receiverId, setReceiverId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [holdState, setHoldState] = useState<{ requested: number, available: number, slotId: string, receiverId: string } | null>(null);
  const [chooseAnotherDate, setChooseAnotherDate] = useState(false);
  const [alternateSlotId, setAlternateSlotId] = useState("");
  
  const material = dataset.materials.find((item) => item.id === materialId);
  const allocatedT = material ? dataset.allocations
    .filter((a) => a.materialId === material.id && a.status !== "cancelled")
    .reduce((sum, a) => sum + a.requestedT, 0) : 0;
  const remainingT = material ? Math.max(0, material.quantityT - allocatedT) : 0;
  const project = material && dataset.projects.find((item) => item.id === material.projectId);
  const media = material ? materialMedia(material) : [];
  const matches = material ? computeMatch(dataset, material.id) : [];
  const orderedMatches = [...matches].sort((a, b) => Number(b.recommended) - Number(a.recommended));
  const selectedMatch = orderedMatches.find((candidate) => candidate.receiverId === receiverId) ?? orderedMatches[0];
  const selectedReceiver = selectedMatch && dataset.receivers.find((receiver) => receiver.id === selectedMatch.receiverId);
  const receiverSlots = selectedMatch && material ? dataset.slots
    .filter((slot) => slot.receiverId === selectedMatch.receiverId && slot.materialType === material.type)
    .sort((a, b) => a.date.localeCompare(b.date)) : [];
  const selectedSlot = receiverSlots.find((slot) => slot.id === selectedSlotId) ?? receiverSlots[0];
  const requestedT = requestQuantity ? Number(requestQuantity) : remainingT;
  const requestValid = Number.isFinite(requestedT) && requestedT > 0 && requestedT <= remainingT;
  const existingAllocation = selectedMatch && material
    ? dataset.allocations.find((allocation) => allocation.materialId === material.id && allocation.receiverId === selectedMatch.receiverId && allocation.status !== "cancelled")
    : undefined;
  const selectedLedger = selectedSlot ? slotLedger(dataset, selectedSlot.id) : undefined;
  const capacityFits = Boolean(material && selectedMatch && selectedLedger && selectedLedger.available >= requestedT);

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Find a Receiver | GreenLoop"
        description="Find a suitable receiver and check real intake capacity for surveyed construction material."
      />

      <WorkflowPageHeader
        title="Find a receiver"
        description="Compare facilities that accept your material, check their free receiving capacity, and request an intake slot."
        status={material ? `${remainingT.toFixed(1)} t ${TYPE_LABEL[material.type] ?? material.type} available to match` : "Choose a Material Passport to get started"}
      />
      <div className="mb-8 border-y border-steel-200 dark:border-steel-800">
        <ol className="grid grid-cols-2 divide-x divide-y divide-steel-200 sm:grid-cols-4 sm:divide-y-0 dark:divide-steel-800" aria-label="Receiver matching steps">
          {["Material", "Suitable receivers", "Capacity", "Action"].map((step, index) => <li key={step} className="flex items-center gap-3 px-3 py-4 sm:px-4"><span className="ledger-numeral text-lg font-bold text-loop-600 dark:text-loop-400">0{index + 1}</span><span className="font-archivo text-xs font-bold uppercase tracking-wide text-ink-800 dark:text-gray-200">{step}</span></li>)}
        </ol>
      </div>

      {/* Step 1: Material Selection */}
      <section aria-labelledby="material-heading" className="mb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-label text-loop-600 dark:text-loop-400">01 · Material</p>
            <h2 id="material-heading" className="mt-2 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Material to place</h2>
          </div>
          <div className="group relative">
            <label className="sr-only">Select material passport</label>
            <select
              value={materialId}
              onChange={(event) => {
                setMaterialId(event.target.value);
                setReceiverId("");
                setSelectedSlotId("");
                setRequestQuantity("");
                setHoldState(null);
              }}
              className="peer min-w-72 cursor-pointer appearance-none rounded-sm border-2 border-steel-300 bg-white px-5 py-3 pr-10 font-medium text-ink-900 outline-none transition-all focus:border-loop-500 focus:ring-4 focus:ring-loop-500/20 dark:border-steel-700 dark:bg-black dark:text-white dark:focus:border-loop-500"
            >
              {dataset.materials.map((item) => {
                const itemAllocated = dataset.allocations.filter(a => a.materialId === item.id && a.status !== "cancelled").reduce((s, a) => s + a.requestedT, 0);
                const itemRemaining = Math.max(0, item.quantityT - itemAllocated);
                return (
                  <option key={item.id} value={item.id}>{TYPE_LABEL[item.type] ?? item.type} · {itemRemaining.toFixed(1)} t available</option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-steel-500 peer-focus:text-loop-500">
              ▼
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {material && (
            <motion.article 
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="group grid overflow-hidden rounded-sm border border-steel-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-steel-800 dark:bg-white/[0.02] md:grid-cols-[0.8fr_1.2fr]"
            >
              <div className="relative min-h-64 overflow-hidden bg-steel-100 dark:bg-black md:min-h-full">
                {media[0] && (
                  <img 
                    src={media[0].src} 
                    alt={media[0].caption} 
                    className="absolute inset-0 size-full animate-slow-mo object-cover opacity-80 transition-all duration-500 group-hover:opacity-100" 
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent p-6 pt-16 text-white">
                  <p className="eyebrow-label text-loop-400">Physical Material</p>
                  <p className="mt-2 font-archivo text-3xl font-bold uppercase drop-shadow-md">{TYPE_LABEL[material.type] ?? material.type}</p>
                </div>
              </div>
              
              <div className="flex flex-col p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-steel-200 pb-5 dark:border-steel-800">
                  <div>
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material Passport · your material’s digital record</p>
                    <p className="ledger-numeral mt-1 text-sm text-ink-600 dark:text-gray-400">
                      ID: <span className="font-semibold text-ink-900 dark:text-white">{material.id}</span> · surveyed {formatDate(material.surveyedAt)}
                    </p>
                  </div>
                  <StatusBadge status={material.status} />
                </div>
                
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <PassportMetric label="Surveyed quantity" value={`${material.quantityT.toFixed(1)} t`} highlight />
                  <PassportMetric label="Condition · grade" value={`${material.condition} · ${material.grade}`} />
                  <PassportMetric label="Estimate range" value={`${material.quantityRangeT[0]}–${material.quantityRangeT[1]} t`} />
                  <PassportMetric label="Survey evidence" value={`${material.evidence.length} records`} />
                </div>
                
                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm bg-gray-50 p-4 dark:bg-white/[0.02]">
                    <div className="text-sm">
                      <span className="text-steel-500 dark:text-gray-400">Project origin: </span>
                      <Link to="/app/explore" state={{ projectId: material.projectId }} className="font-bold text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-600 dark:text-white dark:hover:text-loop-400">{project?.name ?? material.projectId}</Link>
                      {project && <span className="text-steel-500 dark:text-gray-400"> · {project.location}</span>}
                      <span className="mx-2 text-steel-300">|</span>
                      <Link to={`/app/materials/${material.id}`} className="font-bold text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-600 dark:text-white dark:hover:text-loop-400">View passport</Link>
                    </div>
                    <p className="text-xs text-steel-500 dark:text-gray-500">{media[0]?.caption ?? "No photo evidence available"}</p>
                  </div>
                </div>
              </div>
            </motion.article>
          )}
        </AnimatePresence>
      </section>

      {/* Step 2: Suitable Receivers */}
      <section aria-labelledby="receivers-heading" className="mb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-loop-600 dark:text-loop-400">02 · Suitable receivers</p>
            <h2 id="receivers-heading" className="mt-2 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Places equipped to take this material</h2>
          </div>
          <p className="text-sm font-medium text-steel-500 dark:text-gray-400">Ranked by fit, demand, capacity and distance</p>
        </div>

        {orderedMatches.length > 0 ? (
          <div className="grid gap-6">
            {orderedMatches.map((candidate, i) => {
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
                ? "border-loop-300 bg-loop-50 text-loop-700 dark:border-loop-500/40 dark:bg-loop-500/10 dark:text-loop-300"
                : allocation?.status === "hold" || (!allocation && candidate.availableT > 0)
                  ? "border-signal-300 bg-signal-50 text-signal-700 dark:border-signal-500/40 dark:bg-signal-500/10 dark:text-signal-300"
                  : "border-steel-300 bg-steel-50 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300";
              const potential = allocation?.status === "confirmed"
                ? allocation.requestedT
                : Math.min(remainingT, candidate.availableT);

              return (
                <motion.article 
                  key={candidate.receiverId} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={cn(
                    "group relative flex flex-col lg:flex-row gap-6 border bg-white p-6 transition-colors dark:bg-white/[0.02]", 
                    isSelected ? "border-ink-900 dark:border-white ring-1 ring-ink-900 dark:ring-white" : candidate.recommended ? "border-loop-500 dark:border-loop-400" : "border-steel-200 dark:border-steel-800",
                    "hover:border-ink-900 dark:hover:border-white"
                  )}
                >
                  {/* Subtle highlight if selected */}
                  {isSelected && (
                    <div className="absolute inset-0 -z-10 bg-gray-50 dark:bg-white/[0.01]" />
                  )}

                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-4">
                        <img
                          src={receiverMediaFor(candidate.receiverId).src}
                          alt={receiverMediaFor(candidate.receiverId).alt}
                          loading="lazy"
                          className="hidden size-16 border border-steel-200 object-cover sm:block dark:border-steel-800"
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white uppercase">{receiver?.name ?? candidate.receiverId}</h3>
                            {candidate.recommended && <span className="bg-loop-100 text-loop-800 border border-loop-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wider dark:bg-loop-900 dark:border-loop-800 dark:text-loop-100">Best fit</span>}
                          </div>
                          <p className="mt-1 text-theme-sm text-steel-600 dark:text-gray-400"><span className="ledger-numeral font-bold text-ink-900 dark:text-gray-200">{candidate.distanceKm} km</span> from project · {receiver?.location ?? "—"}</p>
                        </div>
                      </div>
                      <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider", statusClass)}>{availableStatus}</span>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-x-12 gap-y-6">
                      <PassportMetric label="Free capacity" value={`${candidate.availableT.toFixed(1)} t`} highlight={candidate.recommended} />
                      <PassportMetric label="Slot capacity" value={`${(ledger?.slot.capacityT ?? 0).toFixed(1)} t`} />
                      <PassportMetric label="Potential" value={`${potential.toFixed(1)} t`} />
                    </div>
                    
                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-steel-600 dark:text-gray-400">
                      <span><span className="font-semibold text-ink-900 dark:text-white">{TYPE_LABEL[material?.type ?? ""] ?? material?.type}</span> accepted</span>
                      {slot ? <span>{candidate.availableT.toFixed(1)} t free · {formatDate(slot.date)}</span> : <span className="font-medium text-signal-600 dark:text-signal-400">No intake date listed.</span>}
                      {material && candidate.availableT < remainingT && <span className="font-medium text-signal-600 dark:text-signal-400">Shortfall: {(remainingT - candidate.availableT).toFixed(1)} t.</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap lg:flex-col lg:items-end justify-center gap-4 lg:gap-2 border-t lg:border-t-0 border-steel-100 lg:border-l pt-4 lg:pt-0 lg:pl-6 dark:border-steel-800/50">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setReceiverId(candidate.receiverId);
                        setSelectedSlotId("");
                        setHoldState(null);
                      }}
                      className={cn(
                        "w-full lg:w-auto min-w-[200px] border px-6 py-4 font-bold uppercase tracking-wide transition-all", 
                        isSelected 
                          ? "bg-ink-900 text-white border-ink-900 dark:bg-white dark:text-ink-900 dark:border-white" 
                          : "bg-white text-ink-900 border-steel-300 hover:border-ink-900 hover:bg-gray-50 dark:bg-transparent dark:text-white dark:border-steel-700 dark:hover:border-white dark:hover:bg-white/5"
                      )}
                    >
                      {isSelected ? "Selected" : "Choose Receiver"}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center border-2 border-dashed border-steel-300 p-12 dark:border-steel-700">
            <p className="text-lg font-medium text-steel-500 dark:text-gray-400">No receiver currently accepts this material type.</p>
          </div>
        )}
      </section>

      {/* Steps 3 & 4: Capacity & Request */}
      <AnimatePresence>
        {selectedMatch && selectedReceiver && material && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-16 rounded-sm border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-black sm:p-8">
              <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="eyebrow-label text-loop-600 dark:text-loop-400">03 · Capacity</p>
                  <h2 id="capacity-heading" className="mt-3 font-archivo text-3xl font-bold uppercase text-ink-900 dark:text-white">Intake capacity</h2>
                  <p className="mt-2 text-base text-steel-600 dark:text-gray-300">
                    <span className="font-semibold text-ink-900 dark:text-white">{selectedReceiver.name}</span> · {requestedT.toFixed(1)} t of {TYPE_LABEL[material.type] ?? material.type} · {selectedMatch.distanceKm} km · {selectedSlot?.date ? formatDate(selectedSlot.date) : "No intake date"}
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-ink-900 dark:text-white">Request quantity (t)
                      <input type="number" min="0.1" max={remainingT} step="0.1" value={requestQuantity || remainingT.toString()} onChange={(event) => setRequestQuantity(event.target.value)} className="mt-1 block w-full rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white" />
                      {!requestValid && <span role="alert" className="mt-1 block text-xs text-error-500">Enter a quantity greater than zero and no more than {remainingT.toFixed(1)} t.</span>}
                    </label>
                    <label className="text-sm font-semibold text-ink-900 dark:text-white">Intake date / slot
                      <select value={selectedSlot?.id ?? ""} onChange={(event) => setSelectedSlotId(event.target.value)} className="mt-1 block w-full rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white">
                        {receiverSlots.map((slot) => {
                          const ledger = slotLedger(dataset, slot.id);
                          return <option key={slot.id} value={slot.id}>{slot.date} · {ledger?.available.toFixed(1)} t free</option>;
                        })}
                      </select>
                    </label>
                  </div>
                  
                  {selectedLedger && (
                    <div className="mt-8 max-w-2xl rounded-sm border border-steel-200 bg-gray-50 p-6 dark:border-steel-800 dark:bg-white/[0.02]">
                      <div className="mb-4 flex items-end justify-between gap-3 text-sm">
                        <span className="font-medium text-steel-600 dark:text-gray-400">Live slot capacity</span>
                        <span className={cn("ledger-numeral text-lg font-bold", capacityFits ? "text-loop-600 dark:text-loop-400" : "text-signal-600 dark:text-signal-400")}>
                          {selectedLedger.available.toFixed(1)} t free <span className="text-steel-400 text-sm">of {selectedLedger.slot.capacityT.toFixed(1)} t</span>
                        </span>
                      </div>
                      
                      {/* Animated Capacity Bar */}
                      <div className="relative h-4 overflow-hidden rounded-full bg-steel-200 shadow-inner dark:bg-steel-900" role="img" aria-label="Capacity">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min(100, (selectedLedger.available / Math.max(selectedLedger.slot.capacityT, 0.1)) * 100)}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className={cn("absolute inset-y-0 shadow-[0_0_10px_rgba(0,0,0,0.2)]", capacityFits ? "bg-loop-500" : "bg-signal-500")} 
                        />
                      </div>
                      <div className="mt-5 grid gap-4 border-t border-steel-200 pt-4 sm:grid-cols-2 dark:border-steel-800">
                        <PassportMetric label="Requested quantity" value={`${requestedT.toFixed(1)} t`} highlight />
                        <PassportMetric label="Available for this slot" value={`${selectedLedger.available.toFixed(1)} t`} />
                      </div>
                      <p aria-live="polite" className={cn("mt-4 text-sm font-semibold", !requestValid ? "text-steel-600 dark:text-gray-400" : capacityFits ? "text-loop-700 dark:text-loop-300" : "text-signal-700 dark:text-signal-300")}>
                        {!requestValid
                          ? "Enter a valid quantity to compare available capacity."
                          : capacityFits
                            ? "Current capacity covers this request."
                            : `Insufficient capacity for the full request · ${(requestedT - selectedLedger.available).toFixed(1)} t short.`}
                      </p>
                    </div>
                  )}

                  {existingAllocation && (
                    <div className="mt-6 flex items-center gap-4">
                      <StatusBadge status={existingAllocation.status} />
                      <Link to="/app/bookings" className="text-sm font-bold text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-600 dark:text-white dark:hover:text-loop-400">View capacity request →</Link>
                    </div>
                  )}
                  
                  <p className="mt-6 max-w-2xl text-sm leading-relaxed text-steel-500 dark:text-gray-400">
                    A request uses the remaining quantity. If the selected intake cannot take the full load, GreenLoop records it as a HOLD rather than confirming unavailable capacity.
                  </p>
                </div>

                {holdState && holdState.receiverId === selectedReceiver.id ? (
                  <div className="mt-8 rounded-sm border border-signal-300 bg-signal-50 p-6 shadow-sm dark:border-signal-500/40 dark:bg-signal-500/10 col-span-full">
                    <p className="eyebrow-label mb-3 text-signal-700 dark:text-signal-300">04 · Action</p>
                    <div className="flex items-center gap-3">
                      <span className="rounded-sm bg-signal-700 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white dark:bg-signal-500">Waiting on Capacity</span>
                      <h3 className="font-archivo text-xl font-bold text-signal-900 dark:text-signal-100">
                        {holdState.available > 0 ? "Receiving Capacity — Partially Available" : "Receiving Capacity — Unavailable"}
                      </h3>
                    </div>
                    
                    <div className="mt-6 flex flex-col gap-2 border-l-2 border-signal-200 pl-4 dark:border-signal-700/50">
                      <div className="flex justify-between max-w-sm">
                        <span className="text-signal-800 dark:text-signal-200">Requested:</span>
                        <span className="font-bold text-signal-900 dark:text-signal-100">{holdState.requested.toFixed(1)} t</span>
                      </div>
                      <div className="flex justify-between max-w-sm">
                        <span className="text-signal-800 dark:text-signal-200">Currently available:</span>
                        <span className="font-bold text-signal-900 dark:text-signal-100">{holdState.available.toFixed(1)} t</span>
                      </div>
                      <div className="flex justify-between border-t border-signal-200 pt-2 mt-2 max-w-sm dark:border-signal-700/50">
                        <span className="text-signal-800 dark:text-signal-200">Shortfall:</span>
                        <span className="font-bold text-signal-900 dark:text-signal-100">{(holdState.requested - holdState.available).toFixed(1)} t</span>
                      </div>
                    </div>

                    <p className="mt-6 text-signal-800 dark:text-signal-200 max-w-2xl">
                      {holdState.available > 0
                        ? `${holdState.available.toFixed(1)} t can currently be received. ${(holdState.requested - holdState.available).toFixed(1)} t still needs another receiving option.`
                        : `This receiver has no available capacity in this intake slot.`}
                    </p>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                      {holdState.available > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            requestCapacityAction({ materialId: material.id, receiverId: holdState.receiverId, slotId: holdState.slotId, tonnesT: holdState.available });
                            setHoldState(null);
                          }}
                          className="bg-signal-600 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-signal-700 dark:bg-signal-500 dark:hover:bg-signal-600"
                        >
                          Book {holdState.available.toFixed(1)} t
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setHoldState(null);
                          setReceiverId("");
                        }}
                        className="border border-signal-300 bg-white px-6 py-3 font-bold text-signal-900 shadow-sm transition-colors hover:bg-signal-50 dark:border-signal-600 dark:bg-transparent dark:text-signal-100 dark:hover:bg-signal-900/30"
                      >
                        Another receiver
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChooseAnotherDate((open) => !open);
                          setAlternateSlotId("");
                        }}
                        className="px-6 py-3 font-bold text-signal-700 transition-colors hover:text-signal-900 dark:text-signal-300 dark:hover:text-signal-100"
                      >
                        Another date
                      </button>
                      {chooseAnotherDate && material && (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <label className="text-sm font-semibold text-signal-900 dark:text-signal-100">Choose another date
                            <select value={alternateSlotId} onChange={(event) => setAlternateSlotId(event.target.value)} className="ms-3 rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white">
                              <option value="">Select an intake slot</option>
                              {dataset.slots.filter((slot) => slot.receiverId === holdState.receiverId && slot.materialType === material.type && slot.id !== holdState.slotId).map((slot) => {
                                const ledger = slotLedger(dataset, slot.id);
                                return <option key={slot.id} value={slot.id}>{slot.date} · {ledger?.available.toFixed(1)} t free</option>;
                              })}
                            </select>
                          </label>
                          <button type="button" disabled={!alternateSlotId} onClick={() => {
                            requestCapacityAction({ materialId: material.id, receiverId: holdState.receiverId, slotId: alternateSlotId, tonnesT: holdState.requested });
                            setHoldState(null);
                            setChooseAnotherDate(false);
                          }} className="bg-ink-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-ink-900">Request slot</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !existingAllocation && selectedSlot && remainingT > 0 && (
                  <div className="flex flex-col gap-3 lg:min-w-56">
                    <p className="eyebrow-label text-loop-600 dark:text-loop-400">04 · Action</p>
                    <motion.button
                    type="button"
                    onClick={() => {
                      if (!requestValid) return;
                      if (requestedT > (selectedLedger?.available ?? 0)) {
                        setHoldState({
                          requested: requestedT,
                          available: selectedLedger?.available ?? 0,
                          slotId: selectedSlot.id,
                          receiverId: selectedReceiver.id
                        });
                      } else {
                        requestCapacityAction({ materialId: material.id, receiverId: selectedReceiver.id, slotId: selectedSlot.id, tonnesT: requestedT });
                      }
                    }}
                    disabled={!requestValid}
                    className="inline-flex min-h-12 items-center justify-center border border-loop-600 bg-loop-600 px-6 py-4 font-archivo text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-loop-500 dark:bg-loop-500 dark:hover:bg-loop-600"
                  >
                    Request slot
                    </motion.button>
                  </div>
                )}
              </div>
              
              {existingAllocation?.status === "hold" && existingAllocation.holdReason && !holdState && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 border-l-4 border-signal-500 bg-signal-50 p-6 dark:bg-signal-500/10"
                >
                  <p className="font-semibold text-signal-900 dark:text-signal-100">Waiting on Capacity:</p>
                  <p className="mt-1 text-signal-800 dark:text-signal-200">{existingAllocation.holdReason}</p>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center text-sm font-medium text-steel-500 dark:text-gray-500">
        Receiver match logic: suitability, available intake, daily demand and distance.<br />Detailed matching scores remain in <Link to="/app/allocations" className="text-ink-900 underline decoration-steel-300 underline-offset-4 hover:text-loop-600 dark:text-gray-300 dark:hover:text-white">Matches</Link>.
      </div>
    </div>
  );
}

function PassportMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</dt>
      <dd className={cn(
        "ledger-numeral mt-1 text-2xl font-bold capitalize",
        highlight ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-white"
      )}>{value}</dd>
    </div>
  );
}
