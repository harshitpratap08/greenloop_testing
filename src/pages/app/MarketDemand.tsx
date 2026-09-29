import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion } from "motion/react";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { useAuth } from "@/context/AuthContext";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function MarketDemand() {
  const { dataset, addOfferAction } = useGreenLoopStore();
  const { user } = useAuth();
  const providerId = user?.email ?? "P-001";
  const openDemands = dataset.demands?.filter(d => d.status === 'OPEN' || d.status === 'PARTIALLY_COVERED') ?? [];
  
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [selectedPassportId, setSelectedPassportId] = useState<string>("");
  const [offerQuantity, setOfferQuantity] = useState<string>("");
  const [offerError, setOfferError] = useState("");
  const myOffers = dataset.offers?.filter((offer) => offer.providerId === providerId) ?? [];

  const handleOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(offerQuantity);
    const passport = dataset.materials.find((item) => item.id === selectedPassportId);
    const demand = dataset.demands.find((item) => item.id === selectedDemandId);
    if (!passport || !demand || !Number.isFinite(quantity) || quantity <= 0 || quantity > passport.quantityT) {
      setOfferError("Choose a passport and offer a positive quantity within its available amount.");
      return;
    }
    setOfferError("");
    addOfferAction({
      demandId: selectedDemandId,
      providerId,
      passportId: selectedPassportId,
      offeredQuantityT: quantity,
    });
    
    setSelectedDemandId(null);
    setSelectedPassportId("");
    setOfferQuantity("");
  };

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Market Demand | GreenLoop" description="View material requests from receivers." />
      <PageBreadcrumb pageTitle="Market Demand" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <div>
          <p className="eyebrow-label text-loop-600 dark:text-loop-400">Provider Operations</p>
          <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Market Demand
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
            View live material requests from receivers. Offer your surveyed materials to fulfill demand directly.
          </p>
        </div>
      </motion.header>

      {/* Demand List */}
      {openDemands.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No active market demand</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            Receivers have not published any material requests matching your region.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {openDemands.map((demand, i) => {
            const receiver = dataset.receivers.find(r => r.id === demand.receiverId);
            const isOffering = selectedDemandId === demand.id;

            // Passports available to offer (must be same type and have surveyed status)
            const availablePassports = dataset.materials.filter(m => m.type === demand.materialType && (m.status === 'surveyed' || m.status === 'passport-ready'));
            
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
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Requested Material</p>
                      <h3 className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">{TYPE_LABEL[demand.materialType] ?? demand.materialType}</h3>
                      <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                        <span className="font-semibold text-ink-900 dark:text-gray-200">{demand.period}</span> · {demand.location}
                      </p>
                    </div>
                    
                    <div className="flex gap-12">
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Requested</p>
                        <p className="ledger-numeral mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
                          {demand.requiredT.toFixed(1)} <span className="text-xl text-steel-400">t</span>
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Receiver</p>
                        <p className="mt-2 text-sm font-medium text-ink-800 dark:text-gray-200">{receiver?.name || demand.receiverId}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-3">
                    <StatusBadge status={demand.status} />
                    <p className="ledger-numeral text-xs text-steel-500">ID: {demand.id}</p>
                    {!isOffering && (
                      <Button size="sm" onClick={() => setSelectedDemandId(demand.id)}>Offer Material</Button>
                    )}
                  </div>
                </div>

                {/* Offer form */}
                {isOffering && (
                  <div className="mt-6 border-t border-steel-100 pt-6 dark:border-steel-800/50">
                    <h4 className="font-archivo text-lg font-bold text-ink-900 dark:text-white mb-4">Offer Material Passport</h4>
                    
                    {availablePassports.length === 0 ? (
                      <div className="rounded bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                        You don't have any surveyed passports for {TYPE_LABEL[demand.materialType]}. <a href="/app/materials/new" className="text-loop-600 hover:underline dark:text-loop-400">Create a new survey</a> first.
                        <div className="mt-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedDemandId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleOffer} className="max-w-md space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Select Passport</label>
                          <select 
                            value={selectedPassportId}
                            onChange={(e) => setSelectedPassportId(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                          >
                            <option value="">-- Choose a passport --</option>
                            {availablePassports.map(mp => (
                              <option key={mp.id} value={mp.id}>{mp.id} - {mp.quantityT}t available</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Offer Quantity (t)</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={offerQuantity}
                            onChange={(e) => setOfferQuantity(e.target.value)}
                            required
                            max={availablePassports.find(p => p.id === selectedPassportId)?.quantityT || ""}
                            className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                          />
                        </div>
                        {offerError && <p role="alert" className="text-sm text-error-500">{offerError}</p>}
                        <div className="flex gap-3 pt-2">
                          <Button size="sm" type="submit">Submit Offer</Button>
                          <Button variant="outline" size="sm" type="button" onClick={() => setSelectedDemandId(null)}>Cancel</Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      )}

      <section className="mt-10 rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
        <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">Offers you have sent</h2>
        {myOffers.length === 0 ? <p className="mt-3 text-sm text-steel-500">Your submitted offers will appear here.</p> : (
          <div className="mt-4 space-y-3">
            {myOffers.map((offer) => {
              const demand = dataset.demands.find((item) => item.id === offer.demandId);
              const passport = dataset.materials.find((item) => item.id === offer.passportId);
              return <article key={offer.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-steel-100 pt-3 dark:border-steel-800">
                <div><p className="font-semibold text-ink-900 dark:text-white">{offer.offeredQuantityT} t · {TYPE_LABEL[passport?.type ?? ""] ?? passport?.type}</p><p className="text-xs text-steel-500">{demand?.location} · Demand {offer.demandId} · Passport {offer.passportId}</p></div>
                <StatusBadge status={offer.status} />
              </article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
