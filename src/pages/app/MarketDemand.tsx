import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion } from "motion/react";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { materialMedia } from "@/components/greenloop/AppExploration";
import { materialMediaFor } from "@/config/appMedia";
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
    const committedT = dataset.bookings.filter((booking) => booking.materialId === selectedPassportId && booking.status !== "cancelled")
      .reduce((total, booking) => total + booking.tonnesT, 0);
    const availableT = Math.max(0, (passport?.quantityT ?? 0) - committedT);
    if (!passport || !demand || !Number.isFinite(quantity) || quantity <= 0 || quantity > availableT) {
      setOfferError("Choose a passport and offer a positive quantity within its available amount.");
      return;
    }
    setOfferError("");
    addOfferAction({
      demandId: demand.id,
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
      <PageMeta title="Who Needs Material | GreenLoop" description="See material requests from receivers and offer your material." />
      <WorkflowPageHeader
        title="Who Needs Material"
        description="Receivers are asking for material. Offer yours directly using a Material Passport, your material’s digital record."
        status={`${openDemands.length} request${openDemands.length === 1 ? "" : "s"} currently open`}
      />

      {/* Demand List */}
      {openDemands.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No open material requests</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            New requests from receivers will appear here when they need material.
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
                className="border border-steel-200 bg-white transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white"
              >
                {/* Demand media banner — the physical material being requested */}
                <div className="relative h-24 w-full overflow-hidden sm:h-28">
                  <img
                    src={materialMediaFor(demand.materialType).src}
                    alt={materialMediaFor(demand.materialType).alt}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-ink-950/45" aria-hidden="true" />
                  <p className="absolute bottom-3 left-5 font-archivo text-lg font-bold uppercase tracking-wide text-white">
                    {TYPE_LABEL[demand.materialType] ?? demand.materialType}
                  </p>
                  <p className="ledger-numeral absolute bottom-3 right-5 text-sm font-bold text-white/90">{demand.requiredT.toFixed(1)} t needed</p>
                </div>
                <div className="p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-wrap items-start gap-x-12 gap-y-6">
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Receiver request</p>
                      <h3 className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">{TYPE_LABEL[demand.materialType] ?? demand.materialType}</h3>
                      <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                        <span className="font-semibold text-ink-900 dark:text-gray-200">{demand.requiredT.toFixed(1)} t {TYPE_LABEL[demand.materialType] ?? demand.materialType}</span> · {demand.period} · {demand.location}
                      </p>
                    </div>
                    
                    <div className="flex gap-12">
                      <div>
                        <p className="eyebrow-label text-steel-500 dark:text-steel-400">Needs</p>
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
                    <details className="text-left sm:text-right">
                      <summary className="cursor-pointer text-xs font-medium text-steel-500">View details ▾</summary>
                      <p className="mt-2 ledger-numeral text-xs text-steel-500">Request ID: {demand.id}</p>
                    </details>
                    {!isOffering && (
                      <Button size="sm" onClick={() => setSelectedDemandId(demand.id)}>Offer material</Button>
                    )}
                  </div>
                </div>

                {/* Offer form */}
                {isOffering && (
                  <div className="mt-6 border-t border-steel-100 pt-6 dark:border-steel-800/50">
                    <h4 className="font-archivo text-lg font-bold text-ink-900 dark:text-white mb-1">Choose a Material Passport</h4>
                    <p className="mb-4 text-sm text-steel-600 dark:text-gray-400">A Material Passport is your material’s digital record, including its quantity and evidence.</p>
                    
                    {availablePassports.length === 0 ? (
                      <div className="rounded bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                        You don't have any surveyed passports for {TYPE_LABEL[demand.materialType]}. <a href="/app/materials/new" className="text-loop-600 hover:underline dark:text-loop-400">Add Material</a> first.
                        <div className="mt-4">
                          <Button variant="outline" size="sm" onClick={() => setSelectedDemandId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleOffer} className="max-w-md space-y-4">
                        <fieldset>
                          <legend className="mb-2 text-sm font-medium text-steel-700 dark:text-gray-300">Choose the material to offer</legend>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {availablePassports.map((passport) => {
                              const committedT = dataset.bookings.filter((booking) => booking.materialId === passport.id && booking.status !== "cancelled").reduce((total, booking) => total + booking.tonnesT, 0);
                              const availableT = Math.max(0, passport.quantityT - committedT);
                              const photo = materialMedia(passport)[0];
                              return <label key={passport.id} className={`flex cursor-pointer gap-3 rounded-sm border p-3 ${selectedPassportId === passport.id ? "border-loop-500 bg-loop-50 dark:bg-loop-500/10" : "border-steel-200 dark:border-steel-800"}`}>
                                <input type="radio" name="passport" value={passport.id} checked={selectedPassportId === passport.id} onChange={() => setSelectedPassportId(passport.id)} required />
                                {photo && <img src={photo.src} alt={photo.caption} className="size-16 shrink-0 object-cover" />}
                                <span className="min-w-0 text-sm">
                                  <span className="block font-semibold text-ink-900 dark:text-white">{TYPE_LABEL[passport.type] ?? passport.type} · {availableT.toFixed(1)} t available</span>
                                  <span className="mt-1 block text-steel-600 dark:text-gray-400">{passport.condition} condition · Grade {passport.grade} · {passport.evidence.length} evidence items</span>
                                  <details className="mt-1 text-xs text-steel-500"><summary className="cursor-pointer">View details ▾</summary><span className="block pt-1">Passport ID: {passport.id} · Est. range {passport.quantityRangeT[0]}–{passport.quantityRangeT[1]} t</span></details>
                                </span>
                              </label>;
                            })}
                          </div>
                        </fieldset>
                        <div>
                          <label className="block text-sm font-medium text-steel-700 dark:text-gray-300">Offer Quantity (t)</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={offerQuantity}
                            onChange={(e) => setOfferQuantity(e.target.value)}
                            required
                            max={(() => {
                              const passport = availablePassports.find((item) => item.id === selectedPassportId);
                              const committedT = dataset.bookings.filter((booking) => booking.materialId === selectedPassportId && booking.status !== "cancelled")
                                .reduce((total, booking) => total + booking.tonnesT, 0);
                              return passport ? Math.max(0, passport.quantityT - committedT) : "";
                            })()}
                            className="mt-1 block w-full rounded-sm border-steel-300 shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:text-sm dark:border-steel-700 dark:bg-black dark:text-white"
                          />
                        </div>
                        {offerError && <p role="alert" className="text-sm text-error-500">{offerError}</p>}
                        <div className="flex gap-3 pt-2">
                          <Button size="sm" type="submit">Send offer</Button>
                          <Button variant="outline" size="sm" type="button" onClick={() => setSelectedDemandId(null)}>Cancel</Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <section className="mt-10 border border-steel-200 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
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
