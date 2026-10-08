import PageMeta from "@/components/common/PageMeta";
import MatchDetailsPanel from "@/components/greenloop/MatchDetailsPanel";
import AuctionsBoard from "@/components/auctions/AuctionsBoard";
import SearchFilterBar from "@/components/greenloop/SearchFilterBar";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { materialMediaFor, ambientMedia } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { contextualMatch } from "@shared/domain/capacity";
import type { MaterialCondition, MaterialTypeKey } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate, formatINRPerT, materialTypeLabel } from "@/utils";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

const types: MaterialTypeKey[] = ["concrete", "brick", "steel", "timber", "plasterboard", "glass"];
const conditions: MaterialCondition[] = ["good", "fair", "poor"];

type SortKey = "newest" | "quantity" | "price-asc" | "price-desc";
type ViewMode = "grid" | "list";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "quantity", label: "Largest quantity" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** "Ready now" while stock is ample, "Limited quantity" once it runs low. */
function stockStatus(listing: { availableT: number; availableFrom?: string }): { label: string; tone: "green" | "amber" } {
  if (listing.availableFrom) return { label: "Coming soon", tone: "amber" };
  return listing.availableT > 0 && listing.availableT <= 5
    ? { label: "Limited quantity", tone: "amber" }
    : { label: "Ready now", tone: "green" };
}

function StockPill({ label, tone }: { label: string; tone: "green" | "amber" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#22301f] shadow-[0_2px_10px_rgba(10,25,14,0.18)] backdrop-blur-sm">
      <span aria-hidden="true" className={`size-2 rounded-full ${tone === "green" ? "bg-[#2fae5e]" : "bg-[#e0a83c]"}`} />
      {label}
    </span>
  );
}

function OrgBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[85%] items-center gap-1.5 rounded-md border border-white/25 bg-[#0d1f12]/75 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-3.5 shrink-0 text-[#8fe0a4]">
        <path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 9h3a1 1 0 0 1 1 1v11" strokeLinecap="round" />
        <path d="M8 8h4M8 12h4M8 16h4" strokeLinecap="round" />
      </svg>
      <span className="truncate">{name}</span>
    </span>
  );
}

function StatIcon({ kind }: { kind: "providers" | "records" | "tonnes" }) {
  const paths = {
    providers: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M15.5 5.6a3.2 3.2 0 0 1 0 4.8M17.6 14.3c1.6.8 2.6 2.4 2.9 4.7" /></>,
    records: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    tonnes: <><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="M4 12v5l8 4.5 8-4.5v-5" /><path d="M12 16.5V21" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-5">
      {paths[kind]}
    </svg>
  );
}

export default function Providers() {
  const { t } = useTranslation();
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "";
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<"providers" | "sent" | "received" | "auctions">("providers");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [maximumQuantity, setMaximumQuantity] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [availableBy, setAvailableBy] = useState("");
  const [condition, setCondition] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");
  const listings = useMemo(() => dataset.providerListings ?? [], [dataset.providerListings]);
  const providers = useMemo(() => [...new Set(listings.map((listing) => listing.organization))], [listings]);
  const invalidQuantityValue = [minimumQuantity, maximumQuantity].some((value) => value !== "" && Number(value) < 0);
  const invalidPriceValue = [minimumPrice, maximumPrice].some((value) => value !== "" && Number(value) < 0);
  const invalidQuantityRange = !invalidQuantityValue && minimumQuantity !== "" && maximumQuantity !== "" && Number(minimumQuantity) > Number(maximumQuantity);
  const invalidPriceRange = !invalidPriceValue && minimumPrice !== "" && maximumPrice !== "" && Number(minimumPrice) > Number(maximumPrice);
  const handleMaterialSearchChange = (value: string) => {
    setMaterialSearch(value);
    const exactType = listings.find((listing) => listing.materialType.toLowerCase() === value.trim().toLowerCase())?.materialType;
    setType(exactType ?? "");
  };
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const locationQuery = location.trim().toLowerCase();
    const materialQuery = materialSearch.trim().toLowerCase();
    return (!type || listing.materialType === type)
      && (!materialQuery || `${listing.materialType} ${listing.grade}`.toLowerCase().includes(materialQuery))
      && (!locationQuery || `${listing.location} ${listing.projectLocation}`.toLowerCase().includes(locationQuery))
      && (invalidQuantityValue || invalidQuantityRange || !minimumQuantity || listing.availableT >= Number(minimumQuantity))
      && (invalidQuantityValue || invalidQuantityRange || !maximumQuantity || listing.availableT <= Number(maximumQuantity))
      && (invalidPriceValue || invalidPriceRange || !minimumPrice || listing.pricePerT !== undefined && listing.pricePerT >= Number(minimumPrice))
      && (invalidPriceValue || invalidPriceRange || !maximumPrice || listing.pricePerT !== undefined && listing.pricePerT <= Number(maximumPrice))
      && (!availableBy || !listing.availableFrom || listing.availableFrom <= availableBy)
      && (!condition || listing.condition === condition);
  }), [listings, type, materialSearch, location, minimumQuantity, maximumQuantity, minimumPrice, maximumPrice, availableBy, condition, invalidQuantityValue, invalidPriceValue, invalidQuantityRange, invalidPriceRange]);
  const sortedListings = useMemo(() => [...filteredListings].sort((a, b) => {
    const placement = Number(Boolean(b.sponsored)) - Number(Boolean(a.sponsored)) || Number(Boolean(b.premium)) - Number(Boolean(a.premium));
    if (sortBy === "quantity") return b.availableT - a.availableT || placement || a.materialId.localeCompare(b.materialId);
    if (sortBy === "price-asc") return (a.pricePerT ?? Number.POSITIVE_INFINITY) - (b.pricePerT ?? Number.POSITIVE_INFINITY) || placement || a.materialId.localeCompare(b.materialId);
    if (sortBy === "price-desc") return (b.pricePerT ?? -1) - (a.pricePerT ?? -1) || placement || a.materialId.localeCompare(b.materialId);
    const av = a.availableFrom ?? "";
    const bv = b.availableFrom ?? "";
    if (av !== bv) return av.localeCompare(bv);
    return placement || b.materialId.localeCompare(a.materialId);
  }), [filteredListings, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) counts.set(listing.materialType, (counts.get(listing.materialType) ?? 0) + 1);
    return counts;
  }, [listings]);
  const categories = useMemo(() => (
    [...types, ...[...categoryCounts.keys()].filter((item) => !types.includes(item as MaterialTypeKey))]
      .filter((item) => categoryCounts.get(item))
  ), [categoryCounts]);
  const totalAvailableT = useMemo(() => listings.reduce((sum, listing) => sum + listing.availableT, 0), [listings]);

  const activeFilterCount = [type, location, minimumQuantity, maximumQuantity, minimumPrice, maximumPrice, availableBy, condition].filter(Boolean).length;

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
    if (o.auctionId) return false;
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
    <div className="pb-16">
      <PageMeta title="Providers | GreenLoop" description="Browse available recovered materials from GreenLoop providers." />

      {/* ---------------------------------------------------------- */}
      {/* Cinematic hero — Receiver Workspace / Provider Directory    */}
      {/* ---------------------------------------------------------- */}
      <section className="relative isolate" aria-labelledby="provider-directory-title">
        <div className="relative h-[320px] overflow-hidden sm:h-[340px] lg:h-[360px]">
          <img
            src={ambientMedia.surveyHero.src}
            alt={ambientMedia.surveyHero.alt}
            className={`absolute inset-0 size-full object-cover ${reduceMotion ? "" : "motion-safe:animate-gl-hero-zoom"}`}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0a1c10]/82 via-[#0a1c10]/55 to-[#0a1c10]/10" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#f6f5f0] to-transparent dark:from-[#101913]" />

          <motion.div
            className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col justify-center px-5 sm:px-9 lg:px-12 xl:px-16"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8e5d9] backdrop-blur-sm sm:text-xs">Receiver Workspace</p>
            <h1 id="provider-directory-title" className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-[3.5rem]">
              Provider <span className="text-[#6ee584]">Directory</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">Browse real, available material records. Provider contact details stay private until a transaction is accepted.</p>

            <dl className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              {([
                { kind: "providers", value: providers.length.toLocaleString("en-IN"), label: "Active providers" },
                { kind: "records", value: listings.length.toLocaleString("en-IN"), label: "Material records" },
                { kind: "tonnes", value: `${Math.round(totalAvailableT).toLocaleString("en-IN")} t`, label: "Total available" },
              ] as const).map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#b9d8bf]">
                    <StatIcon kind={stat.kind} />
                  </span>
                  <div>
                    <dd className="ledger-numeral font-archivo text-lg font-bold leading-5 text-white">{stat.value}</dd>
                    <dt className="text-xs leading-4 text-white/70">{stat.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Search, filters, sort, view toggle                          */}
      {/* ---------------------------------------------------------- */}
      <div className="mx-auto max-w-app px-4 pt-6 sm:px-card xl:px-section">
        {activeTab === "providers" && (
          <SearchFilterBar
            searchValue={materialSearch}
            onSearchChange={handleMaterialSearchChange}
            searchPlaceholder={t("providerDirectory.searchPlaceholder")}
            searchLabel={t("providerDirectory.searchLabel")}
            activeFilterCount={activeFilterCount}
            onClearFilters={() => {
              setType("");
              setMaterialSearch("");
              setLocation("");
              setMinimumQuantity("");
              setMaximumQuantity("");
              setMinimumPrice("");
              setMaximumPrice("");
              setAvailableBy("");
              setCondition("");
            }}
            resultLabel={t("providerDirectory.resultCount", { shown: filteredListings.length, total: listings.length })}
            filters={
              <>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.location")}
                  <input type="search" value={location} onChange={(event) => setLocation(event.target.value)} placeholder={t("providerDirectory.locationPlaceholder")} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                </label>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.minAvailableQuantity")}
                  <input type="number" min="0" step="any" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} aria-invalid={invalidQuantityValue || invalidQuantityRange} aria-describedby={invalidQuantityValue || invalidQuantityRange ? "quantity-range-error" : undefined} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                </label>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.maxAvailableQuantity")}
                  <input type="number" min="0" step="any" value={maximumQuantity} onChange={(event) => setMaximumQuantity(event.target.value)} aria-invalid={invalidQuantityValue || invalidQuantityRange} aria-describedby={invalidQuantityValue || invalidQuantityRange ? "quantity-range-error" : undefined} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                </label>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.minPrice")}
                  <input type="number" min="0" step="any" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} aria-invalid={invalidPriceValue || invalidPriceRange} aria-describedby={invalidPriceValue || invalidPriceRange ? "price-range-error" : undefined} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                </label>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.maxPrice")}
                  <input type="number" min="0" step="any" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} aria-invalid={invalidPriceValue || invalidPriceRange} aria-describedby={invalidPriceValue || invalidPriceRange ? "price-range-error" : undefined} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                </label>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.availableBy")}
                  <input type="date" value={availableBy} onChange={(event) => setAvailableBy(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                </label>
                <label className="text-xs font-medium text-steel-600 dark:text-gray-300">
                  {t("providerDirectory.condition")}
                  <select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white">
                    <option value="">{t("providerDirectory.anyCondition")}</option>
                    {conditions.map((item) => <option key={item} value={item}>{t(`recordCrud.${item}`)}</option>)}
                  </select>
                </label>
                {(invalidQuantityValue || invalidQuantityRange) && <p id="quantity-range-error" role="alert" className="text-xs text-error-500 sm:col-span-2">{t(invalidQuantityValue ? "providerDirectory.negativeQuantity" : "providerDirectory.invalidQuantityRange")}</p>}
                {(invalidPriceValue || invalidPriceRange) && <p id="price-range-error" role="alert" className="text-xs text-error-500 sm:col-span-2">{t(invalidPriceValue ? "providerDirectory.negativePrice" : "providerDirectory.invalidPriceRange")}</p>}
              </>
            }
            actions={
              <>
              <label className="relative hidden items-center md:flex">
                <span className="sr-only">Sort listings</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="pointer-events-none absolute start-3 size-4 text-steel-400"><path d="M7 4v13m0 0-3-3m3 3 3-3M17 20V7m0 0-3 3m3-3 3 3" /></svg>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortKey)}
                  className="h-11 appearance-none rounded-control border border-steel-300 bg-white ps-9 pe-8 text-sm font-semibold text-ink-900 outline-none transition focus:border-loop-500 focus:ring-2 focus:ring-loop-500/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white"
                >
                  {SORT_OPTIONS.map((option) => <option key={option.id} value={option.id}>Sort by {option.label}</option>)}
                </select>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute end-2.5 size-4 text-steel-400"><path d="m6 9 6 6 6-6" /></svg>
              </label>
              <div role="group" aria-label="View mode" className="flex h-11 items-center rounded-control border border-steel-300 bg-white p-1 dark:border-steel-700 dark:bg-[#17251d]">
                {([
                  { id: "grid" as ViewMode, label: "Grid view", icon: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" /></> },
                  { id: "list" as ViewMode, label: "List view", icon: <><path d="M4 6h16M4 12h16M4 18h16" /></> },
                ]).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={view === mode.id}
                    aria-label={mode.label}
                    onClick={() => setView(mode.id)}
                    className={`flex size-8 items-center justify-center rounded-[7px] transition-colors ${view === mode.id ? "bg-ink-900 text-white dark:bg-white dark:text-ink-900" : "text-steel-500 hover:text-ink-900 dark:text-gray-400 dark:hover:text-white"}`}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="size-4">{mode.icon}</svg>
                  </button>
                ))}
              </div>
              </>
            }
          />
        )}

        {/* ------------------------------------------------------ */}
        {/* Tabs — All Providers / Requests Sent / Offers Received  */}
        {/* ------------------------------------------------------ */}
        <div className="mb-4 flex gap-1 rounded-full border border-[#e5e2da] bg-[#f7f6f0] p-1 shadow-sm dark:border-steel-800 dark:bg-[#1a2b21] sm:w-max">
          <button type="button" onClick={() => setActiveTab("providers")} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px sm:flex-none ${activeTab === "providers" ? "bg-[#315b3c] text-white shadow-[0_4px_12px_rgba(49,91,60,0.2)] dark:bg-[#527e5c]" : "text-[#7c857d] hover:bg-white/70 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>All Providers</button>
          <button type="button" onClick={() => setActiveTab("sent")} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px sm:flex-none ${activeTab === "sent" ? "bg-[#315b3c] text-white shadow-[0_4px_12px_rgba(49,91,60,0.2)] dark:bg-[#527e5c]" : "text-[#7c857d] hover:bg-white/70 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Requests Sent</button>
          <button type="button" onClick={() => setActiveTab("received")} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px sm:flex-none ${activeTab === "received" ? "bg-[#315b3c] text-white shadow-[0_4px_12px_rgba(49,91,60,0.2)] dark:bg-[#527e5c] dark:text-white" : "text-[#7c857d] hover:bg-white/70 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Offers Received</button>
          <button type="button" onClick={() => setActiveTab("auctions")} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px sm:flex-none ${activeTab === "auctions" ? "bg-[#315b3c] text-white shadow-[0_4px_12px_rgba(49,91,60,0.2)] dark:bg-[#527e5c] dark:text-white" : "text-[#7c857d] hover:bg-white/70 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>{t("auctions.tab")}</button>
        </div>

        {/* ------------------------------------------------------ */}
        {/* Category pills (All Providers tab)                      */}
        {/* ------------------------------------------------------ */}
        {activeTab === "providers" && (
          <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              aria-pressed={!type && !materialSearch}
              onClick={() => { setType(""); setMaterialSearch(""); }}
              className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pe-3.5 ps-1.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-px ${!type && !materialSearch ? "border-[#315b3c] bg-[#0f2d1c] text-white shadow-[0_4px_12px_rgba(15,45,28,0.28)] dark:border-[#527e5c] dark:bg-[#2c4233]" : "border-[#e3e3d9] bg-white/85 text-[#4f5b51] hover:border-[#b9c8ba] hover:bg-[#f1f5ef] hover:text-[#315c3d] dark:border-steel-700 dark:bg-[#17251d] dark:text-gray-300 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}
            >
              <span aria-hidden="true" className={`flex size-7 items-center justify-center rounded-full ${!type && !materialSearch ? "bg-[#2c4a38] text-[#8fe0a4]" : "bg-[#eaf2ea] text-[#487454] dark:bg-[#284233] dark:text-[#b6d1bd]"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="size-4"><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" /></svg>
              </span>
              All Providers
              <span className={`ledger-numeral rounded-full px-1.5 text-xs ${!type && !materialSearch ? "bg-white/15 text-[#cfe6d3]" : "bg-[#eef2ec] text-[#5c6a5f] dark:bg-white/10 dark:text-gray-300"}`}>{listings.length}</span>
            </button>
            {categories.map((item) => {
              const media = materialMediaFor(item);
              const active = type === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { const next = active ? "" : item; setType(next); setMaterialSearch(next); }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pe-3.5 ps-1.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-px ${active ? "border-[#315b3c] bg-[#0f2d1c] text-white shadow-[0_4px_12px_rgba(15,45,28,0.28)] dark:border-[#527e5c] dark:bg-[#2c4233]" : "border-[#e3e3d9] bg-white/85 text-[#4f5b51] hover:border-[#b9c8ba] hover:bg-[#f1f5ef] hover:text-[#315c3d] dark:border-steel-700 dark:bg-[#17251d] dark:text-gray-300 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}
                >
                  <img src={media.src} alt="" loading="lazy" aria-hidden="true" className="size-7 rounded-full border border-white/60 object-cover shadow-sm dark:border-white/20" />
                  {materialTypeLabel(item)}
                  <span className={`ledger-numeral rounded-full px-1.5 text-xs ${active ? "bg-white/15 text-[#cfe6d3]" : "bg-[#eef2ec] text-[#5c6a5f] dark:bg-white/10 dark:text-gray-300"}`}>{categoryCounts.get(item) ?? 0}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* All Providers — grid / list                             */}
        {/* ------------------------------------------------------ */}
        {activeTab === "providers" && (
          sortedListings.length ? (
            <motion.section
              aria-label="Available provider materials"
              className={view === "grid" ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}
              initial={reduceMotion ? false : "hidden"}
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            >
              {sortedListings.map((listing) => {
                const media = materialMediaFor(listing.materialType);
                const stock = stockStatus(listing);
                const price = listing.pricePerT !== undefined ? formatINRPerT(listing.pricePerT) : "On request";
                const available = listing.availableFrom ? formatDate(listing.availableFrom) : "Ready now";
                const facts = (
                  <>
                    <div><p className="text-xs text-steel-500 dark:text-gray-400">Condition</p><p className="mt-0.5 text-sm font-semibold capitalize text-ink-900 dark:text-white">{listing.condition}</p></div>
                    <div><p className="text-xs text-steel-500 dark:text-gray-400">Availability</p><p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-white">{available}</p></div>
                    <div><p className="text-xs text-steel-500 dark:text-gray-400">Price</p><p className="mt-0.5 text-sm font-semibold text-ink-900 dark:text-white">{price}</p></div>
                  </>
                );
                const cta = (
                  <Link
                    to={`/app/receiver/providers/${listing.materialId}`}
                    className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#12291a] px-4 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(18,41,26,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1c3d27] hover:shadow-[0_10px_22px_rgba(18,41,26,0.3)] dark:bg-[#315b3c] dark:hover:bg-[#3c6d49]"
                  >
                    View material details
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 transition-transform duration-300 group-hover/card:translate-x-1"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                  </Link>
                );

                return (
                  <motion.article
                    key={listing.materialId}
                    variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.45, ease: EASE }}
                    whileHover={reduceMotion ? undefined : { y: -4 }}
                    className={`group/card flex min-w-0 overflow-hidden rounded-2xl border ${listing.premium ? "border-loop-300 shadow-[0_3px_14px_rgba(49,95,61,0.11)] dark:border-loop-800" : "border-[#e7e4db] shadow-[0_2px_10px_rgba(26,42,31,0.05)]"} bg-white transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(26,42,31,0.12)] dark:bg-[#17251d] ${view === "list" ? "sm:grid sm:grid-cols-[260px_1fr]" : "flex-col"}`}
                  >
                    <div className={`relative overflow-hidden ${view === "list" ? "h-44 sm:h-full sm:min-h-[196px]" : "h-44"}`}>
                      <img src={media.src} alt={media.alt} loading="lazy" className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-[900ms] group-hover/card:scale-[1.05]" />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a1c10]/45 via-transparent to-transparent" />
                      <div className="absolute end-3 top-3"><StockPill label={stock.label} tone={stock.tone} /></div>
                      {(listing.premium || listing.sponsored) && <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">{listing.premium&&<span className="rounded-full border border-amber-200 bg-[#fff9e8]/95 px-2.5 py-1 text-[10px] font-bold text-amber-900 shadow-sm">★ Premium</span>}{listing.sponsored&&<span className="rounded-full bg-ink-900/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">Sponsored</span>}</div>}
                      <div className="absolute bottom-3 start-3"><OrgBadge name={listing.organization} /></div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{materialTypeLabel(listing.materialType)}</h2>
                        <span className="ledger-numeral shrink-0 font-archivo text-lg font-bold text-ink-900 dark:text-white">{listing.availableT.toLocaleString("en-IN")} t</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-steel-600 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-steel-400"><path d="M12 21s-6.5-5.3-6.5-10.2a6.5 6.5 0 1 1 13 0C18.5 15.7 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.2" /></svg>
                          {listing.location}
                        </span>
                        <span aria-hidden="true" className="text-steel-300 dark:text-steel-700">·</span>
                        <span className="inline-flex items-center gap-1">
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 text-steel-400"><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4M9 11h.01M15 11h.01" /></svg>
                          {listing.projectName}
                        </span>
                      </div>
                      <dl className={`grid grid-cols-3 gap-2 rounded-xl border border-[#eeeae2] bg-[#fbfaf7] px-3 py-2.5 dark:border-steel-800 dark:bg-white/[0.03] ${view === "list" ? "sm:max-w-md" : ""}`}>
                        {facts}
                      </dl>
                      {cta}
                    </div>
                  </motion.article>
                );
              })}
            </motion.section>
          ) : (
            <div className="rounded-2xl border border-dashed border-steel-300 bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02]">
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{listings.length ? "No listings match these filters" : "No available provider listings yet"}</h2>
              <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">{listings.length ? "Adjust your material, location, quantity, price, date, or condition filters." : "Available material records from providers will appear here."}</p>
            </div>
          )
        )}

        {/* ------------------------------------------------------ */}
        {/* Requests Sent                                           */}
        {/* ------------------------------------------------------ */}
        {activeTab === "sent" && (
          <section className="overflow-hidden rounded-2xl border border-[#e5e2da] bg-white shadow-[0_2px_10px_rgba(26,42,31,0.05)] dark:border-steel-800 dark:bg-[#17251d]">
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
                    <li key={demand.id} className="grid gap-card hover:bg-[#fcfbf9] dark:hover:bg-white/[0.02] gl-card-pad sm:grid-cols-[2fr_1fr_1fr]">
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

        {/* ------------------------------------------------------ */}
        {/* Offers Received                                         */}
        {/* ------------------------------------------------------ */}
        {activeTab === "received" && (
          <section className="overflow-hidden rounded-2xl border border-[#e5e2da] bg-white shadow-[0_2px_10px_rgba(26,42,31,0.05)] dark:border-steel-800 dark:bg-[#17251d]">
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
        {activeTab === "auctions" && <AuctionsBoard />}

      </div>
    </div>
  );
}
