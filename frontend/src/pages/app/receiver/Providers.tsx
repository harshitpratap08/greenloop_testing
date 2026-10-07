import PageMeta from "@/components/common/PageMeta";
import MatchDetailsPanel from "@/components/greenloop/MatchDetailsPanel";
import SearchFilterBar from "@/components/greenloop/SearchFilterBar";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { materialMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { contextualMatch } from "@shared/domain/capacity";
import type { MaterialCondition, MaterialTypeKey } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate, formatINRPerT, materialTypeLabel } from "@/utils";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const types: MaterialTypeKey[] = ["concrete", "brick", "steel", "timber", "plasterboard", "glass"];
const conditions: MaterialCondition[] = ["good", "fair", "poor"];

export default function Providers() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "";
  const [activeTab, setActiveTab] = useState<"providers" | "sent" | "received">("providers");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [availableBy, setAvailableBy] = useState("");
  const [condition, setCondition] = useState("");
  const listings = useMemo(() => dataset.providerListings ?? [], [dataset.providerListings]);
  const providers = useMemo(() => [...new Set(listings.map((listing) => listing.organization))], [listings]);
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const locationQuery = location.trim().toLowerCase();
    return (!type || listing.materialType === type)
      && (!locationQuery || `${listing.location} ${listing.projectLocation} ${listing.organization}`.toLowerCase().includes(locationQuery))
      && (!minimumQuantity || listing.availableT >= Number(minimumQuantity))
      && (!maximumPrice || listing.pricePerT !== undefined && listing.pricePerT <= Number(maximumPrice))
      && (!availableBy || !listing.availableFrom || listing.availableFrom <= availableBy)
      && (!condition || listing.condition === condition);
  }), [listings, type, location, minimumQuantity, maximumPrice, availableBy, condition]);

  const typeOptions = [...new Set(listings.map((listing) => listing.materialType))]
    .filter((item) => !types.includes(item as MaterialTypeKey));
  const activeFilterCount = [type, location, minimumQuantity, maximumPrice, availableBy, condition].filter(Boolean).length;

  const myRequests = useMemo(() => dataset.demands?.filter((d) => d.receiverId === receiverId && d.targetProviderId) ?? [], [dataset.demands, receiverId]);
  const filteredMyRequests = useMemo(() => myRequests.filter((d) => {
    const locationQuery = location.trim().toLowerCase();
    const provider = dataset.providerListings?.find(l => l.materialId === d.targetMaterialId);
    return (!type || d.materialType === type)
      && (!locationQuery || `${d.location} ${provider?.organization}`.toLowerCase().includes(locationQuery))
      && (!minimumQuantity || d.requiredT >= Number(minimumQuantity))
      && (!maximumPrice || (d.budgetPerT !== undefined && d.budgetPerT <= Number(maximumPrice)))
      && (!availableBy || !d.period || d.period <= availableBy);
  }), [myRequests, type, location, minimumQuantity, maximumPrice, availableBy, dataset.providerListings]);

  const myOffers = useMemo(() => dataset.offers?.filter((o) => {
    const demand = dataset.demands?.find((d) => d.id === o.demandId);
    return demand?.receiverId === receiverId;
  }) ?? [], [dataset.offers, dataset.demands, receiverId]);
  const filteredMyOffers = useMemo(() => myOffers.filter((o) => {
    const demand = dataset.demands?.find((d) => d.id === o.demandId);
    if (!demand) return false;
    const locationQuery = location.trim().toLowerCase();
    const provider = dataset.providerListings?.find(l => l.providerId === o.providerId);
    return (!type || demand.materialType === type)
      && (!locationQuery || `${demand.location} ${provider?.organization}`.toLowerCase().includes(locationQuery))
      && (!minimumQuantity || o.offeredQuantityT >= Number(minimumQuantity))
      && (!maximumPrice || (o.pricePerT !== undefined && o.pricePerT <= Number(maximumPrice)));
  }), [myOffers, dataset.demands, dataset.providerListings, type, location, minimumQuantity, maximumPrice]);

  return (
    <main className="mx-auto max-w-app pb-16">
      <PageMeta title="Providers | GreenLoop" description="Browse available recovered materials from GreenLoop providers." />
      <header className="mb-6 border-b border-steel-200 pb-5 dark:border-steel-800">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-loop-700 dark:text-loop-300">Receiver workspace</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold text-ink-900 dark:text-white">Provider Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-steel-600 dark:text-gray-400">Browse real, available material records. Provider contact details stay private until a transaction is accepted.</p>
        <p className="mt-3 text-xs font-medium text-steel-500">{providers.length} providers · {listings.length} available material records</p>
      </header>

      <SearchFilterBar
        searchValue={location}
        onSearchChange={setLocation}
        searchPlaceholder="Search location, city or organization…"
        searchLabel="Search providers and material"
        activeFilterCount={activeFilterCount}
        onClearFilters={() => { setType(""); setLocation(""); setMinimumQuantity(""); setMaximumPrice(""); setAvailableBy(""); setCondition(""); }}
        resultLabel={`Showing ${filteredListings.length} of ${listings.length} records`}
        filters={
          <>
            <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Material<select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">All materials</option>{types.map((item) => <option key={item} value={item}>{materialTypeLabel(item)}</option>)}{typeOptions.map((item) => <option key={item} value={item}>{materialTypeLabel(item)}</option>)}</select></label>
            <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Minimum quantity (t)<input type="number" min="0" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
            <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Maximum price / tonne<input type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
            <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Date<input type="date" value={availableBy} onChange={(event) => setAvailableBy(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
            {activeTab === "providers" && <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Condition<select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">Any condition</option>{conditions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>}
          </>
        }
      />

      <div className="mb-6 flex gap-1 border border-[#e5e2da] bg-[#fdfcfa] p-1 shadow-sm dark:border-steel-800 dark:bg-[#1a2b21] sm:w-max rounded-surface">
        <button type="button" onClick={() => setActiveTab("providers")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "providers" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>All Providers</button>
        <button type="button" onClick={() => setActiveTab("sent")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "sent" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Requests Sent</button>
        <button type="button" onClick={() => setActiveTab("received")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "received" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Offers Received</button>
      </div>

      {activeTab === "providers" && (
        filteredListings.length ? (
          <section aria-label="Available provider materials" className="grid gap-card md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => {
              const media = materialMediaFor(listing.materialType);
              return <article key={listing.materialId} className="flex h-full min-w-0 flex-col overflow-hidden border border-steel-200 bg-white dark:border-steel-800 dark:bg-[#17251d] rounded-surface">
                <img src={media.src} alt={media.alt} loading="lazy" className="h-44 w-full object-cover" />
                <div className="flex flex-1 flex-col gl-card-pad">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-loop-700 dark:text-loop-300">{listing.organization}</p><h2 className="mt-1 font-archivo text-xl font-bold capitalize text-ink-900 dark:text-white">{listing.materialType}</h2></div><span className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{listing.availableT.toLocaleString("en-IN")} t</span></div>
                  <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">{listing.location}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-y border-steel-100 py-3 text-xs dark:border-steel-800 mb-card"><span>Project <strong className="block mt-1 text-ink-900 dark:text-white">{listing.projectName}</strong></span><span>Condition <strong className="block mt-1 capitalize text-ink-900 dark:text-white">{listing.condition} · Grade {listing.grade}</strong></span><span>Availability <strong className="block mt-1 text-ink-900 dark:text-white">{listing.availableFrom ? formatDate(listing.availableFrom) : "Ready now"}</strong></span><span>Price <strong className="block mt-1 text-ink-900 dark:text-white">{listing.pricePerT !== undefined ? formatINRPerT(listing.pricePerT) : "Price on request"}</strong></span></div>
                  <Link to={`/app/receiver/providers/${listing.materialId}`} className="mt-auto inline-flex min-h-10 w-full items-center justify-center bg-[#315f3d] px-4 text-sm font-semibold text-white hover:bg-[#274d32]">View material details</Link>
                </div>
              </article>;
            })}
          </section>
        ) : (
          <div className="border border-dashed border-steel-300 bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02] rounded-surface">
            <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{listings.length ? "No listings match these filters" : "No available provider listings yet"}</h2>
            <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">{listings.length ? "Adjust your material, location, quantity, price, date, or condition filters." : "Available material records from providers will appear here."}</p>
          </div>
        )
      )}

      {activeTab === "sent" && (
        <section className="mt-4 overflow-hidden border border-[#e5e2da] bg-white dark:border-steel-800 dark:bg-[#17251d] rounded-surface">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eeeae2] px-4 py-4 dark:border-steel-800 sm:px-5">
            <div>
              <h2 className="font-archivo text-xl font-bold text-[#26362c] dark:text-white">Requests you have sent to providers</h2>
              <p className="mt-0.5 text-xs text-[#7c857d] dark:text-gray-400">{filteredMyRequests.length ? `${filteredMyRequests.length} requests sent` : "Your direct requests to providers will appear here."}</p>
            </div>
          </div>
          {filteredMyRequests.length === 0 ? (
            <p className="px-5 py-5 text-sm text-[#778078] dark:text-gray-400">No requests sent matching these filters.</p>
          ) : (
            <ul className="divide-y divide-[#eeeae2] dark:divide-steel-800">
              {filteredMyRequests.map((demand) => {
                const targetProvider = dataset.providerListings?.find(l => l.materialId === demand.targetMaterialId);
                return (
                  <li key={demand.id} className="grid gap-card hover:bg-[#fcfbf9] dark:hover:bg-white/[0.02] sm:grid-cols-[2fr_1fr_1fr] gl-card-pad">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-900 dark:text-white">{materialTypeLabel(demand.materialType)}</span>
                        <StatusBadge status={demand.status} />
                      </div>
                      <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{demand.requiredT.toFixed(1)} t · Needed by {demand.period}</p>
                      <p className="mt-1 truncate text-xs text-steel-500">To: {demand.targetProviderName ?? targetProvider?.organization ?? "Provider"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-steel-500">Status</p>
                      <p className="mt-1 text-sm text-ink-900 dark:text-white">{demand.status === "OPEN" ? "Waiting for provider" : demand.status}</p>
                    </div>
                    <div className="flex items-center justify-end">
                      <Link to={`/app/receiver/demand?demand=${encodeURIComponent(demand.id)}`} className="text-sm font-semibold text-[#416d4b] hover:underline dark:text-[#b8d0bd]">View request</Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {activeTab === "received" && (
        <section className="mt-4 overflow-hidden border border-[#e5e2da] bg-white dark:border-steel-800 dark:bg-[#17251d] rounded-surface">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eeeae2] px-4 py-4 dark:border-steel-800 sm:px-5">
            <div>
              <h2 className="font-archivo text-xl font-bold text-[#26362c] dark:text-white">Offers received from providers</h2>
              <p className="mt-0.5 text-xs text-[#7c857d] dark:text-gray-400">{filteredMyOffers.length ? `${filteredMyOffers.length} offers received` : "When providers offer material for your requests, they will appear here."}</p>
            </div>
          </div>
          {filteredMyOffers.length === 0 ? (
            <p className="px-5 py-5 text-sm text-[#778078] dark:text-gray-400">No offers received matching these filters.</p>
          ) : (
            <ul className="divide-y divide-[#eeeae2] dark:divide-steel-800">
              {filteredMyOffers.map((offer) => {
                const demand = dataset.demands?.find((d) => d.id === offer.demandId);
                const passport = dataset.materials?.find(m => m.id === offer.passportId);
                const provider = dataset.providerListings?.find(l => l.providerId === offer.providerId);
                
                const filters = {
                  minimumQuantityT: minimumQuantity ? Number(minimumQuantity) : undefined,
                  maximumBudget: maximumPrice ? Number(maximumPrice) : undefined,
                  neededBy: availableBy || undefined,
                };
                
                const matchCandidates = demand ? contextualMatch(dataset, { demandId: demand.id, offerId: offer.id }, filters) : [];
                const matchCandidate = matchCandidates[0];

                return (
                  <li key={offer.id} className="grid gap-card hover:bg-[#fcfbf9] dark:hover:bg-white/[0.02] gl-card-pad">
                    <div className="grid gap-card sm:grid-cols-[2fr_1fr_1fr]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-900 dark:text-white">{passport ? materialTypeLabel(passport.type) : "Material"}</span>
                          <StatusBadge status={offer.status} />
                          {matchCandidate && matchCandidate.isFullMatch && <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">Full Match</span>}
                          {matchCandidate && matchCandidate.isPartialMatch && <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">Partial Match</span>}
                        </div>
                        <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{offer.offeredQuantityT.toFixed(1)} t offered @ {offer.pricePerT !== undefined ? formatINRPerT(offer.pricePerT) : "Negotiable"}</p>
                        <p className="mt-1 truncate text-xs text-steel-500">From: {provider?.organization ?? offer.providerId}</p>
                        <p className="mt-0.5 truncate text-xs text-steel-500">For your request: {demand?.requiredT.toFixed(1)} t {demand ? materialTypeLabel(demand.materialType) : ""}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-steel-500">Match Score</p>
                        <p className="mt-1 text-sm font-bold text-[#4b7956] dark:text-[#a9c7b0]">
                          {matchCandidate ? `${Math.round(matchCandidate.score * 100)}% Match` : "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center justify-end">
                        {demand && <Link to={`/app/receiver/demand?demand=${encodeURIComponent(demand.id)}${offer.status === "pending" ? `&offer=${encodeURIComponent(offer.id)}` : ""}`} className="text-sm font-semibold text-[#416d4b] hover:underline dark:text-[#b8d0bd]">{offer.status === "pending" ? "Respond" : "View request"}</Link>}
                      </div>
                    </div>
                    {matchCandidate && (
                      <details className="mt-2 text-xs text-[#526b58] dark:text-[#b6cfbd]">
                        <summary className="w-fit cursor-pointer font-semibold">View Match Details <span aria-hidden="true">→</span></summary>
                        <div className="mt-3 text-left">
                          <MatchDetailsPanel match={matchCandidate} />
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

    </main>
  );
}
