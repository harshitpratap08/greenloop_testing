import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { type MaterialTypeKey } from "@/domain/types";
import { slotMatchesDemandPeriod } from "@/domain/capacity";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { cn } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { materialMediaFor } from "@/config/appMedia";
import { materialMedia } from "@/components/greenloop/AppExploration";
import { CalenderIcon, MapIcon, FileIcon, ChevronDownIcon } from "@/icons";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function Demand() {
  const { dataset, addDemandAction, acceptOfferAction, declineOfferAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "R-001";

  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [type, setType] = useState<MaterialTypeKey>("concrete");
  const [requiredT, setRequiredT] = useState("");
  const [period, setPeriod] = useState("");
  const [error, setError] = useState("");
  const [location, setLocation] = useState("Riverstone Aggregates");
  const [notes, setNotes] = useState("");
  const [sentMessage, setSentMessage] = useState("");

  const receiverDemands = dataset.demands?.filter((d) => d.receiverId === receiverId) ?? [];

  const handleAddDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredT || !Number.isFinite(Number(requiredT)) || Number(requiredT) <= 0 || !period) {
      setError("Enter a positive quantity and needed-by date.");
      return;
    }
    setError("");
    addDemandAction({
      receiverId,
      materialType: type,
      requiredT: Number(requiredT),
      period: period || "Q4 2026",
      location: location || "Riverstone Aggregates",
      notes: notes,
    });

    setIsAdding(false);
    setSentMessage("Request sent. Providers near you are notified.");
    setRequiredT("");
    setPeriod("");
    setNotes("");
  };

  // Helper to calculate how much of a material type is covered by confirmed bookings
  const calculateCoveredT = (demandId: string) => {
    return dataset.bookings
      .filter((booking) => booking.demandId === demandId && booking.status === "confirmed")
      .reduce((sum, booking) => sum + booking.tonnesT, 0);
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Material Requests | GreenLoop" description="Tell providers what material your facility needs." />
      <WorkflowPageHeader
        title="Material Requests"
        description="Tell providers what you need. Offers come to you. A material request describes the type, amount, and date your facility needs."
        status={`${receiverDemands.length} request${receiverDemands.length === 1 ? "" : "s"} from this facility`}
        action={!isAdding ? { label: "Request material", onClick: () => { setIsAdding(true); setSentMessage(""); } } : undefined}
      />

      {sentMessage && <p role="status" className="mb-5 border-l-4 border-loop-500 bg-loop-50 px-4 py-3 text-sm font-medium text-loop-800 dark:bg-loop-500/10 dark:text-loop-200">{sentMessage}</p>}

      {/* Add Demand Form */}
      {isAdding && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-10 overflow-hidden"
        >
          <div id="request-form" className="border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
            <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">Tell providers what you need</h2>
            <form onSubmit={handleAddDemand} className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Material Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MaterialTypeKey)}
                  className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                >
                  {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Required Quantity (t)</label>
                <input
                  type="number"
                  value={requiredT}
                  onChange={(e) => setRequiredT(e.target.value)}
                  placeholder="e.g. 50"
                  required
                  min="0.1"
                  step="0.1"
                  className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Needed By</label>
                <input
                  type="date"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g. Q4 2026, Oct 2026"
                  required
                  className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Receiving Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Specific grade requirements"
                  className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                />
              </div>

              {error && <p role="alert" className="text-sm text-error-500 sm:col-span-2">{error}</p>}
              <div className="flex gap-4 sm:col-span-2">
                <Button size="md" type="submit">Send request</Button>
                <Button size="md" variant="outline" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Demand List */}
      {!isAdding && receiverDemands.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No active material demand</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            Publish a material request to tell GreenLoop what you need and start matching with recovery projects.
          </p>
          <div className="mt-6">
            <Button size="md" onClick={() => setIsAdding(true)}>Request Material</Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-8">
          {receiverDemands.map((demand, i) => {
            const coveredT = calculateCoveredT(demand.id);
            const heldT = dataset.bookings.filter((booking) => booking.demandId === demand.id && booking.status === "hold")
              .reduce((total, booking) => total + booking.tonnesT, 0);
            const remainingT = Math.max(0, demand.requiredT - coveredT - heldT);
            const percentCovered = Math.min(100, (coveredT / demand.requiredT) * 100);
            const media = materialMediaFor(demand.materialType);
            const typeLabel = TYPE_LABEL[demand.materialType] ?? demand.materialType;
            const isExpanded = expandedId === demand.id;

            return (
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={demand.id}
                className="overflow-hidden rounded-lg border border-steel-200 bg-white shadow-xs transition-colors hover:border-steel-400 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-steel-600"
              >
                {/* Hero material image — what this facility needs */}
                <figure className="relative h-40 w-full overflow-hidden sm:h-52">
                  <img src={media.src} alt={media.alt} loading="lazy" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/25 to-ink-950/10" aria-hidden="true" />
                  <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-4 sm:px-7 sm:pb-5">
                    <span className="font-archivo text-lg font-bold uppercase tracking-wide text-white sm:text-xl">{typeLabel}</span>
                    <span className="ledger-numeral text-base font-bold text-white/95 sm:text-lg">{demand.requiredT.toFixed(1)} t</span>
                  </figcaption>
                </figure>

                <div className="p-5 sm:p-7">
                  {/* Request identity + headline quantities */}
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material request</p>
                      <h3 className="mt-1.5 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-3xl">{typeLabel}</h3>
                      <p className="mt-1.5 text-sm text-steel-600 dark:text-gray-400">
                        <span className="font-semibold text-ink-900 dark:text-gray-200">{demand.period}</span> · {demand.location}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-start gap-x-12 gap-y-5">
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Required</p>
                        <p className="ledger-numeral mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                          {demand.requiredT.toFixed(1)} <span className="text-xl font-bold text-steel-400">t</span>
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Open</p>
                        <p className="ledger-numeral mt-2 text-3xl font-bold tracking-tight text-loop-600 dark:text-loop-400">
                          {remainingT.toFixed(1)} <span className="text-xl font-bold text-steel-400">t</span>
                        </p>
                        <p className="mt-1 text-xs text-steel-500 dark:text-gray-400">
                          {coveredT.toFixed(1)} t filled · {remainingT.toFixed(1)} t open
                          {heldT > 0 ? ` · ${heldT.toFixed(1)} t waiting on capacity` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end">
                      <StatusBadge status={demand.status} />
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId(isExpanded ? null : demand.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-600 transition-colors hover:text-ink-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        View details
                        <ChevronDownIcon className={cn("size-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {/* Coverage — engine output, never hardcoded */}
                  <div className="mt-7 border-t border-steel-100 pt-5 dark:border-steel-800/60">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-steel-700 dark:text-gray-300">Coverage from confirmed slots</span>
                      <span className="ledger-numeral font-bold text-ink-900 dark:text-white">{coveredT.toFixed(1)} t covered</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${percentCovered.toFixed(0)}% of the request covered`}>
                      <div
                        className={cn("h-full rounded-full transition-all", percentCovered === 100 ? "bg-loop-500" : "bg-loop-400 dark:bg-loop-500")}
                        style={{ width: `${percentCovered}%` }}
                      />
                    </div>
                  </div>

                  {/* Expandable request information */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 grid gap-5 border-t border-steel-100 pt-5 sm:grid-cols-3 sm:gap-0 dark:border-steel-800/60">
                          <div className="flex items-start gap-3 sm:pr-6">
                            <CalenderIcon className="mt-0.5 size-5 shrink-0 text-steel-500 dark:text-steel-400" />
                            <div>
                              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Required by</p>
                              <p className="mt-1.5 text-sm font-semibold text-ink-900 dark:text-white">{demand.period}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:border-l sm:border-steel-100 sm:px-6 dark:sm:border-steel-800/60">
                            <MapIcon className="mt-0.5 size-5 shrink-0 text-steel-500 dark:text-steel-400" />
                            <div>
                              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Receiving facility</p>
                              <p className="mt-1.5 text-sm font-semibold text-ink-900 dark:text-white">{demand.location}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 sm:border-l sm:border-steel-100 sm:pl-6 dark:sm:border-steel-800/60">
                            <FileIcon className="mt-0.5 size-5 shrink-0 text-steel-500 dark:text-steel-400" />
                            <div>
                              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material specification</p>
                              <p className="mt-1.5 text-sm font-semibold text-ink-900 dark:text-white">{typeLabel}</p>
                            </div>
                          </div>
                        </div>

                        {demand.notes && (
                          <div className="mt-5 border border-steel-200 bg-steel-50/70 p-4 dark:border-steel-800 dark:bg-white/[0.03]">
                            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Additional information</p>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-800 dark:text-gray-200">{demand.notes}</p>
                          </div>
                        )}

                        <p className="ledger-numeral mt-4 text-xs text-steel-500 dark:text-gray-400">Request ID: {demand.id}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Offers — real provider proposals on this request */}
                  {dataset.offers && dataset.offers.filter(o => o.demandId === demand.id && o.status === "pending").length > 0 && (
                    <div className="mt-6 rounded-lg border border-loop-200 bg-loop-50/50 p-4 dark:border-loop-900/30 dark:bg-loop-900/10">
                      <h4 className="mb-3 font-archivo text-sm font-bold text-ink-900 dark:text-white">Provider offers waiting for a decision</h4>
                      <div className="space-y-3">
                        {dataset.offers.filter(o => o.demandId === demand.id && o.status === "pending").map(offer => {
                          const passport = dataset.materials.find((material) => material.id === offer.passportId);
                          const committedT = dataset.bookings.filter((booking) => booking.materialId === offer.passportId && booking.status !== "cancelled")
                            .reduce((total, booking) => total + booking.tonnesT, 0);
                          const passportAvailableT = Math.max(0, (passport?.quantityT ?? 0) - committedT);
                          const committedDemandT = dataset.bookings.filter((booking) => booking.demandId === demand.id && booking.status !== "cancelled")
                            .reduce((total, booking) => total + booking.tonnesT, 0);
                          const offerRemainingT = Math.max(0, demand.requiredT - committedDemandT);
                          const eligibleSlots = dataset.slots.filter((slot) => slot.receiverId === demand.receiverId && slot.materialType === demand.materialType && slotMatchesDemandPeriod(slot, demand.period));
                          const hasCapacity = eligibleSlots.length > 0;
                          const photo = passport ? materialMedia(passport)[0] : undefined;
                          const receiverDistanceKm = dataset.receivers.find((item) => item.id === demand.receiverId)?.distanceKm;
                          return (
                            <div key={offer.id} className="flex flex-col gap-3 rounded-lg border border-steel-100 bg-white p-4 transition-colors hover:border-steel-400 dark:border-steel-800 dark:bg-gray-900 dark:hover:border-steel-600 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex min-w-0 gap-3">
                                {photo && <img src={photo.src} alt={photo.caption} className="size-20 shrink-0 rounded-md object-cover" />}
                                <div>
                                  <p className="text-sm font-semibold text-ink-900 dark:text-gray-100">Provider offer · {receiverDistanceKm ?? "—"} km away</p>
                                  <p className="mt-1 font-archivo text-lg font-bold text-ink-900 dark:text-white">{offer.offeredQuantityT.toFixed(1)} t {TYPE_LABEL[passport?.type ?? ""] ?? passport?.type ?? demand.materialType}</p>
                                  <p className="text-sm text-steel-600 dark:text-gray-400">{passport?.condition ?? "Details unavailable"} condition · Grade {passport?.grade ?? "—"} · {passport?.evidence.length ?? 0} Evidence items</p>
                                  <details className="mt-2 text-xs text-steel-500"><summary className="cursor-pointer">View details ▾</summary><span className="mt-1 block">Provider: {offer.providerId} · Material Passport: {offer.passportId} · Offer: {offer.id}</span>{passport?.evidence.map((item) => <span key={`${offer.id}-${item.label}`} className="mt-1 block">Evidence: {item.label}</span>)}</details>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 sm:flex-col">
                                <Button size="sm" className="min-h-11" disabled={!hasCapacity || offer.offeredQuantityT > passportAvailableT || offer.offeredQuantityT > offerRemainingT} onClick={() => acceptOfferAction(offer.id)}>Accept</Button>
                                <Button size="sm" className="min-h-11" variant="outline" onClick={() => declineOfferAction(offer.id)}>Decline</Button>
                              </div>
                              {!hasCapacity && <p className="text-xs text-warning-600 sm:basis-full">Add receiving capacity by the requested date before accepting this offer.</p>}
                              {hasCapacity && offer.offeredQuantityT > passportAvailableT && <p className="text-xs text-warning-600 sm:basis-full">Only {passportAvailableT.toFixed(1)} t remains on this passport.</p>}
                              {offer.offeredQuantityT > offerRemainingT && <p className="text-xs text-warning-600 sm:basis-full">Only {offerRemainingT.toFixed(1)} t remains available for an offer on this request.</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
