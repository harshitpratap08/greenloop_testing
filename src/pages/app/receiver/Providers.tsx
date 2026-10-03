import { useMemo, useState } from "react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { materialMediaFor } from "@/config/appMedia";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { formatDate, formatINRPerT } from "@/utils";
import type { MaterialCondition, MaterialTypeKey } from "@/domain/types";

const types: MaterialTypeKey[] = ["concrete", "brick", "steel", "timber", "plasterboard", "glass"];
const conditions: MaterialCondition[] = ["good", "fair", "poor"];

export default function Providers() {
  const { dataset } = useGreenLoopStore();
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [availableBy, setAvailableBy] = useState("");
  const [condition, setCondition] = useState("");
  const listings = dataset.providerListings ?? [];
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

  return (
    <main className="mx-auto max-w-[1320px] pb-16">
      <PageMeta title="Providers | GreenLoop" description="Browse available recovered materials from GreenLoop providers." />
      <header className="mb-6 border-b border-steel-200 pb-5 dark:border-steel-800">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-loop-700 dark:text-loop-300">Receiver workspace</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold text-ink-900 dark:text-white">Provider Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-steel-600 dark:text-gray-400">Browse real, available material records. Provider contact details stay private until a transaction is accepted.</p>
        <p className="mt-3 text-xs font-medium text-steel-500">{providers.length} providers · {listings.length} available material records</p>
      </header>

      <section aria-labelledby="provider-filters-title" className="mb-5 border border-steel-200 bg-white p-4 dark:border-steel-800 dark:bg-white/[0.02]">
        <h2 id="provider-filters-title" className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">Filter providers and material</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Material<select value={type} onChange={(event) => setType(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">All materials</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or organization" className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Minimum available tonnes<input type="number" min="0" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Maximum price / tonne<input type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Available by<input type="date" value={availableBy} onChange={(event) => setAvailableBy(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Condition<select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">Any condition</option>{conditions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        </div>
      </section>

      {filteredListings.length ? <section aria-label="Available provider materials" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredListings.map((listing) => {
          const media = materialMediaFor(listing.materialType);
          return <article key={listing.materialId} className="overflow-hidden border border-steel-200 bg-white dark:border-steel-800 dark:bg-[#17251d]">
            <img src={media.src} alt={media.alt} loading="lazy" className="h-44 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-loop-700 dark:text-loop-300">{listing.organization}</p><h2 className="mt-1 font-archivo text-xl font-bold capitalize text-ink-900 dark:text-white">{listing.materialType}</h2></div><span className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{listing.availableT.toLocaleString("en-IN")} t</span></div>
              <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">{listing.location}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 border-y border-steel-100 py-3 text-xs dark:border-steel-800"><span>Project <strong className="block mt-1 text-ink-900 dark:text-white">{listing.projectName}</strong></span><span>Condition <strong className="block mt-1 capitalize text-ink-900 dark:text-white">{listing.condition} · Grade {listing.grade}</strong></span><span>Availability <strong className="block mt-1 text-ink-900 dark:text-white">{listing.availableFrom ? formatDate(listing.availableFrom) : "Ready now"}</strong></span><span>Price <strong className="block mt-1 text-ink-900 dark:text-white">{listing.pricePerT !== undefined ? formatINRPerT(listing.pricePerT) : "Price on request"}</strong></span></div>
              <Link to={`/app/receiver/providers/${listing.materialId}`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center bg-[#315f3d] px-4 text-sm font-semibold text-white hover:bg-[#274d32]">View material details</Link>
            </div>
          </article>;
        })}
      </section> : <div className="border border-dashed border-steel-300 bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02]"><h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{listings.length ? "No listings match these filters" : "No available provider listings yet"}</h2><p className="mt-2 text-sm text-steel-600 dark:text-gray-400">{listings.length ? "Adjust your material, location, quantity, price, date, or condition filters." : "Available material records from providers will appear here."}</p></div>}
    </main>
  );
}
