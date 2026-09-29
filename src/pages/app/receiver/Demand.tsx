import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { type MaterialTypeKey } from "@/domain/types";
import { motion } from "motion/react";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { cn } from "@/utils";
import { useAuth } from "@/context/AuthContext";

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
  const [type, setType] = useState<MaterialTypeKey>("concrete");
  const [requiredT, setRequiredT] = useState("");
  const [period, setPeriod] = useState("");
  const [error, setError] = useState("");
  const [location, setLocation] = useState("Riverstone Aggregates");
  const [notes, setNotes] = useState("");

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
      <PageMeta title="Material Demand | GreenLoop" description="Manage material demand." />
      <PageBreadcrumb pageTitle="Demand" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <div>
          <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
          <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Material Demand
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
            Define the required construction materials you are looking to source. GreenLoop uses this to match suitable recovery projects to your capacity.
          </p>
        </div>
        {!isAdding && receiverDemands.length > 0 && (
          <Button size="md" onClick={() => setIsAdding(true)}>
            Request Material
          </Button>
        )}
      </motion.header>

      {/* Add Demand Form */}
      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-10 overflow-hidden"
        >
          <div className="rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
            <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">Add material requirement</h2>
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
                <Button size="md" type="submit">Publish Request</Button>
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
        <div className="grid gap-6">
          {receiverDemands.map((demand, i) => {
            const coveredT = calculateCoveredT(demand.id);
            const remainingT = Math.max(0, demand.requiredT - coveredT);
            const percentCovered = Math.min(100, (coveredT / demand.requiredT) * 100);
            
            return (
              <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={demand.id}
                className="rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material Requirement</p>
                      <h3 className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">{TYPE_LABEL[demand.materialType] ?? demand.materialType}</h3>
                      <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                        <span className="font-semibold text-ink-900 dark:text-gray-200">{demand.period}</span> · {demand.location}
                      </p>
                    </div>
                    
                    <div className="flex gap-12">
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Required</p>
                        <p className="ledger-numeral mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                          {demand.requiredT.toFixed(1)} <span className="text-xl text-steel-400">t</span>
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Remaining</p>
                        <p className="ledger-numeral mt-2 text-3xl font-bold tracking-tight text-loop-600 dark:text-loop-400">
                          {remainingT.toFixed(1)} <span className="text-xl text-steel-400">t</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right">
                    <StatusBadge status={demand.status} />
                    <p className="mt-3 ledger-numeral text-xs text-steel-500">ID: {demand.id}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-8 border-t border-steel-100 pt-6 dark:border-steel-800/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-steel-700 dark:text-gray-300">Coverage from confirmed slots</span>
                    <span className="ledger-numeral font-bold text-ink-900 dark:text-white">{coveredT.toFixed(1)} t covered</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-800">
                    <div 
                      className={cn("h-full", percentCovered === 100 ? "bg-loop-500" : "bg-loop-400 dark:bg-loop-500")} 
                      style={{ width: `${percentCovered}%` }} 
                    />
                  </div>
                  {demand.notes && (
                    <p className="mt-4 text-sm text-steel-600 dark:text-gray-400"><span className="font-medium text-ink-800 dark:text-gray-200">Notes:</span> {demand.notes}</p>
                  )}
                </div>

                {/* Offers */}
                {dataset.offers && dataset.offers.filter(o => o.demandId === demand.id && o.status === "pending").length > 0 && (
                  <div className="mt-6 rounded-sm border border-loop-200 bg-loop-50/50 p-4 dark:border-loop-900/30 dark:bg-loop-900/10">
                    <h4 className="font-archivo text-sm font-bold text-ink-900 dark:text-white mb-3">Pending Provider Offers</h4>
                    <div className="space-y-3">
                      {dataset.offers.filter(o => o.demandId === demand.id && o.status === "pending").map(offer => {
                        const passport = dataset.materials.find((material) => material.id === offer.passportId);
                        const committedT = dataset.bookings.filter((booking) => booking.materialId === offer.passportId && booking.status !== "cancelled")
                          .reduce((total, booking) => total + booking.tonnesT, 0);
                        const passportAvailableT = Math.max(0, (passport?.quantityT ?? 0) - committedT);
                        const hasCapacity = dataset.slots.some((slot) => slot.receiverId === demand.receiverId && slot.materialType === demand.materialType);
                        return (
                          <div key={offer.id} className="flex flex-col gap-3 bg-white p-3 shadow-sm rounded-sm dark:bg-gray-900 border border-steel-100 dark:border-steel-800 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-ink-900 dark:text-gray-100">Provider: {offer.providerId}</p>
                              <p className="text-xs text-steel-500">{TYPE_LABEL[passport?.type ?? ""] ?? passport?.type ?? demand.materialType} · {offer.offeredQuantityT} t · Passport {offer.passportId}</p>
                              <p className="text-xs text-steel-500">{passport?.condition ?? "Details unavailable"} condition · Grade {passport?.grade ?? "—"} · {passport?.evidence.length ?? 0} evidence records</p>
                              {passport?.evidence.map((item) => <span key={`${offer.id}-${item.label}`} className="me-2 text-xs text-loop-600 dark:text-loop-400">{item.label}</span>)}
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" disabled={!hasCapacity || offer.offeredQuantityT > passportAvailableT || offer.offeredQuantityT > remainingT} onClick={() => acceptOfferAction(offer.id)}>Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => declineOfferAction(offer.id)}>Decline</Button>
                            </div>
                            {!hasCapacity && <p className="text-xs text-warning-600 sm:basis-full">Add a capacity slot before accepting this offer.</p>}
                            {hasCapacity && offer.offeredQuantityT > passportAvailableT && <p className="text-xs text-warning-600 sm:basis-full">Only {passportAvailableT.toFixed(1)} t remains on this passport.</p>}
                            {offer.offeredQuantityT > remainingT && <p className="text-xs text-warning-600 sm:basis-full">This offer exceeds the {remainingT.toFixed(1)} t remaining for this demand.</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
