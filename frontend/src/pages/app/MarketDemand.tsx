import PageMeta from "@/components/common/PageMeta";
import { materialMedia } from "@/components/greenloop/AppExploration.helpers";
import MatchDetailsPanel from "@/components/greenloop/MatchDetailsPanel";
import NegotiationPanel from "@/components/greenloop/NegotiationPanel";
import ReceiverDiscovery from "@/components/greenloop/ReceiverDiscovery";
import SearchFilterBar from "@/components/greenloop/SearchFilterBar";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { contextualMatch } from "@shared/domain/capacity";
import type { MaterialTypeKey } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate, formatINR, formatINRPerT, materialTypeLabel } from "@/utils";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

type DemandCategory = "all" | MaterialTypeKey | "other";

const DEMAND_CATEGORIES: { id: DemandCategory; label: string }[] = [
  { id: "all", label: "All Requests" },
  { id: "concrete", label: "Concrete" },
  { id: "brick", label: "Brick" },
  { id: "steel", label: "Steel" },
  { id: "timber", label: "Wood" },
  { id: "other", label: "Other" },
];

const commonMaterialTypes = new Set<string>(["concrete", "brick", "steel", "timber"]);

function DemandMetricIcon({ kind }: { kind: "requests" | "volume" | "receivers" | "matched" }) {
  const paths = {
    requests: <><path d="M5 4h14v16H5z" /><path d="M8 8h8m-8 4h8m-8 4h5" /></>,
    volume: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7m-8 4v10" /></>,
    receivers: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 9h8m-8 4h5" /><circle cx="17" cy="16" r="1" /></>,
    matched: <><path d="M4 19V9l8-5 8 5v10" /><path d="M9 19v-6h6v6m-7-5 2 2 4-4" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-5">{paths[kind]}</svg>;
}

export default function MarketDemand() {
  const { dataset, addOfferAction, saveOfferDraftAction, deleteOfferDraftAction, counterOfferAction, withdrawOfferAction } = useGreenLoopStore();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const providerId = user?.email ?? "P-001";
  const openDemands = useMemo(() => dataset.demands.filter((demand) => demand.status === "OPEN" || demand.status === "PARTIALLY_COVERED"), [dataset.demands]);

  const navigationKey = searchParams.toString();
  const [selectedDemandOverride, setSelectedDemandOverride] = useState<{ query: string; id: string | null } | null>(null);
  const selectedDemandId = selectedDemandOverride?.query === navigationKey ? selectedDemandOverride.id : searchParams.get("demand");
  const setSelectedDemandId = (id: string | null) => setSelectedDemandOverride({ query: navigationKey, id });
  const [selectedPassportId, setSelectedPassportId] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [offerPricePerT, setOfferPricePerT] = useState("");
  const [offerError, setOfferError] = useState("");
  const [category, setCategory] = useState<DemandCategory>("all");
  const [query, setQuery] = useState("");
  const [minimumT, setMinimumT] = useState("");
  const [maximumBudget, setMaximumBudget] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const myOffers = dataset.offers?.filter((offer) => offer.providerId === providerId) ?? [];

  type TabKey = "received" | "sent" | "receivers";
  const [tabOverride, setTabOverride] = useState<{ query: string; tab: TabKey } | null>(null);
  const activeTab: TabKey = tabOverride?.query === navigationKey ? tabOverride.tab : searchParams.get("demand") ? "received" : searchParams.get("view") === "receivers" ? "receivers" : "received";
  const setActiveTab = (tab: TabKey) => setTabOverride({ query: navigationKey, tab });

  useEffect(() => {
    const demandId = searchParams.get("demand");
    if (!demandId) return;
    const timer = window.setTimeout(() => document.getElementById(`demand-${demandId}`)?.scrollIntoView(), 100);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const filteredDemands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return openDemands.filter((demand) => {
      const isOther = !commonMaterialTypes.has(demand.materialType);
      const matchesCategory = category === "all"
        || (category === "other" ? isOther : demand.materialType === category);
      const receiver = dataset.receivers.find((item) => item.id === demand.receiverId);
      const searchableValues = [
        materialTypeLabel(demand.materialType),
        demand.location,
        demand.period,
        demand.id,
        receiver?.name ?? "",
        receiver?.location ?? "",
        demand.notes ?? "",
      ];
      const matchesQuery = !normalizedQuery || searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesQuantity = !minimumT || demand.requiredT >= Number(minimumT);
      const matchesBudget = !maximumBudget || (demand.budgetPerT !== undefined && demand.budgetPerT <= Number(maximumBudget));
      const matchesNeededBy = !neededBy || demand.period <= neededBy;
      return matchesCategory && matchesQuery && matchesQuantity && matchesBudget && matchesNeededBy;
    });
  }, [category, dataset.receivers, openDemands, query, minimumT, maximumBudget, neededBy]);

  const categoryCounts = useMemo(() => {
    const counts: Record<DemandCategory, number> = {
      all: openDemands.length,
      concrete: 0,
      brick: 0,
      steel: 0,
      timber: 0,
      plasterboard: 0,
      glass: 0,
      other: 0,
    };
    openDemands.forEach((demand) => {
      if (commonMaterialTypes.has(demand.materialType)) counts[demand.materialType as MaterialTypeKey] += 1;
      else counts.other += 1;
    });
    return counts;
  }, [openDemands]);

  const neededT = openDemands.reduce((total, demand) => total + demand.requiredT, 0);
  const receivingProjects = new Set(openDemands.map((demand) => demand.receiverId)).size;
  const matchedPassports = new Set(myOffers.filter((offer) => offer.status === "accepted").map((offer) => offer.passportId)).size;
  const metrics = [
    { label: "Open Requests", value: openDemands.length.toLocaleString(), note: "Open and partially covered", kind: "requests" as const },
    { label: "Total Material Needed", value: `${neededT.toFixed(1)} t`, note: "Across open requests", kind: "volume" as const },
    { label: "Receiving Projects", value: receivingProjects.toLocaleString(), note: "Requesting facilities", kind: "receivers" as const },
    { label: "Materials Matched", value: matchedPassports.toLocaleString(), note: "Accepted provider offers", kind: "matched" as const },
  ];

  const handleOffer = async (event: React.FormEvent) => {
    event.preventDefault();
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
    const saved = await addOfferAction({
      demandId: demand.id,
      providerId,
      passportId: selectedPassportId,
      offeredQuantityT: quantity,
      ...(offerPricePerT !== "" ? { pricePerT: Number(offerPricePerT) } : {}),
    });
    
    if (!saved) return;
    setSelectedDemandId(null);
    setSelectedPassportId("");
    setOfferQuantity("");
    setOfferPricePerT("");
  };

  const handleSaveOfferDraft = async () => {
    const quantity = Number(offerQuantity);
    const passport = dataset.materials.find((item) => item.id === selectedPassportId);
    const demand = dataset.demands.find((item) => item.id === selectedDemandId);
    const committedT = dataset.bookings.filter((booking) => booking.materialId === selectedPassportId && booking.status !== "cancelled")
      .reduce((total, booking) => total + booking.tonnesT, 0);
    const availableT = Math.max(0, (passport?.quantityT ?? 0) - committedT);
    if (!passport || !demand || !Number.isFinite(quantity) || quantity <= 0 || quantity > availableT) {
      setOfferError("Choose a passport and offer a positive quantity within its available amount to save this draft.");
      return;
    }
    setOfferError("");
    if (!await saveOfferDraftAction({ demandId: demand.id, providerId, passportId: passport.id, offeredQuantityT: quantity, ...(offerPricePerT !== "" ? { pricePerT: Number(offerPricePerT) } : {}) })) return;
    setSelectedDemandId(null); setSelectedPassportId(""); setOfferQuantity(""); setOfferPricePerT("");
  };

  const categoryCount = (id: DemandCategory) => id === "all"
    ? categoryCounts.all
    : id === "other"
      ? categoryCounts.other
      : categoryCounts[id];

  return (
    <div className="mx-auto max-w-app pb-16">
      <PageMeta title="Active Demand | GreenLoop" description="See material requests from receivers and offer your material." />

      <section className="relative mb-5 grid min-h-[210px] overflow-hidden border border-[#e5e1d8] bg-[#192c20] dark:border-steel-800 sm:min-h-[225px] lg:grid-cols-[1fr_230px] rounded-surface">
        <img src={ambientMedia.surveyHero.src} alt={ambientMedia.surveyHero.alt} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/75 to-[#17291e]/15" />
        <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:max-w-[740px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c7d5c8]">GreenLoop Operations</p>
          <h1 className="mt-2 font-archivo font-bold tracking-tight text-white gl-page-title">Active Demand</h1>
          <p className="mt-2 max-w-xl text-sm leading-5 text-white/85 sm:text-base sm:leading-6">Receivers are asking for material. Offer yours directly using a Material Passport, your material’s digital record.</p>
        </div>
        <div className="relative z-10 hidden flex-col justify-center gap-2 border-s border-white/15 bg-[#12241a]/50 px-5 py-5 backdrop-blur-sm lg:flex">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-[#d5e2d6]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M4 18V6l8-3 8 3v12l-8 3-8-3Z" /><path d="m4 6 8 3 8-3M12 9v12m-4-9 2 1m4 0 2-1" /></svg>
          </span>
          <p className="max-w-[170px] text-sm font-semibold leading-5 text-white">Help projects access recovered materials and reduce construction waste.</p>
        </div>
      </section>

      <section aria-label="Demand summary" className="mb-6 grid grid-cols-2 gap-detail xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex min-h-[88px] items-center gap-3 border border-[#e7e3da] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(26,42,31,0.035)] dark:border-steel-800 dark:bg-[#17251d] sm:px-4 rounded-surface">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#edf3ed] text-[#487454] dark:bg-[#284233] dark:text-[#b6d1bd]"><DemandMetricIcon kind={metric.kind} /></span>
            <div className="min-w-0">
              <p className="font-archivo text-lg font-bold leading-5 text-[#1d2c23] dark:text-white sm:text-xl">{metric.value}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#38483e] dark:text-gray-200 sm:text-xs">{metric.label}</p>
              <p className="mt-0.5 hidden truncate text-xs text-[#828b83] dark:text-gray-400 sm:block">{metric.note}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mb-6 flex gap-1 border border-[#e5e2da] bg-[#fdfcfa] p-1 shadow-sm dark:border-steel-800 dark:bg-[#1a2b21] sm:w-max rounded-surface">
        <button type="button" onClick={() => setActiveTab("receivers")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "receivers" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>All Receivers</button>
        <button type="button" onClick={() => setActiveTab("sent")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "sent" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Requests Sent</button>
        <button type="button" onClick={() => setActiveTab("received")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "received" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Requests Received</button>
      </div>

      {activeTab === "received" && (
        <section id="active-demand-list" aria-label="Active material requests">
        <div className="mb-3 border-b border-[#e4e1d8] dark:border-steel-800">
          <div className="flex gap-5 overflow-x-auto">
            {DEMAND_CATEGORIES.map((item) => (
              <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-3 pt-1 text-xs font-semibold transition-colors ${category === item.id ? "border-[#4b7956] text-[#315c3d] dark:text-[#c5ddcb]" : "border-transparent text-[#7c857d] hover:text-[#315c3d] dark:text-gray-400 dark:hover:text-white"}`}>
                {item.label} <span className={`text-xs ${category === item.id ? "text-[#66806b] dark:text-[#a9c7b0]" : "text-[#a1a79f]"}`}>({categoryCount(item.id)})</span>
              </button>
            ))}
          </div>
        </div>

        <SearchFilterBar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search material, location, receiver…"
          searchLabel="Search active demand"
          activeFilterCount={[minimumT, maximumBudget, neededBy].filter(Boolean).length}
          onClearFilters={() => { setMinimumT(""); setMaximumBudget(""); setNeededBy(""); }}
          resultLabel={`Showing ${filteredDemands.length} of ${openDemands.length} requests`}
          filters={
            <>
              <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Minimum required tonnes<input type="number" min="0" value={minimumT} onChange={(event) => setMinimumT(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
              <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Maximum budget / tonne (₹)<input type="number" min="0" value={maximumBudget} onChange={(event) => setMaximumBudget(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
              <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Needed by<input type="date" value={neededBy} onChange={(event) => setNeededBy(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
            </>
          }
        />

        {filteredDemands.length === 0 ? (
          <div className="border border-dashed border-[#d8ddd5] bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02] rounded-surface">
            <h2 className="font-archivo text-lg font-bold text-[#2c3e31] dark:text-white">{openDemands.length ? "No matching requests" : "No open material requests"}</h2>
            <p className="mt-1 text-sm text-[#7a837b] dark:text-gray-400">{openDemands.length ? "Try another material name or category." : "New requests from receivers will appear here when they need material."}</p>
            {openDemands.length > 0 && <button type="button" onClick={() => { setQuery(""); setCategory("all"); setMinimumT(""); setMaximumBudget(""); setNeededBy(""); }} className="mt-4 text-sm font-semibold text-[#416d4b] underline underline-offset-4 dark:text-[#b8d0bd]">Clear search and filters</button>}
          </div>
        ) : (
          <div className="grid gap-detail">
            {filteredDemands.map((demand, index) => {
              const receiver = dataset.receivers.find((item) => item.id === demand.receiverId);
              const isOffering = selectedDemandId === demand.id;
              const availablePassports = dataset.materials.filter((item) => item.type === demand.materialType && (!demand.targetMaterialId || item.id === demand.targetMaterialId) && item.status !== "cancelled" && item.quantityT > dataset.bookings.filter((booking) => booking.materialId === item.id && booking.status !== "cancelled").reduce((sum, booking) => sum + booking.tonnesT, 0));
              const image = materialMediaFor(demand.materialType);
              return (
                <motion.article id={`demand-${demand.id}`} key={demand.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.2) }} className="overflow-hidden border border-[#e5e2da] bg-white shadow-[0_2px_10px_rgba(26,42,31,0.035)] transition hover:border-[#bfccbf] dark:border-steel-800 dark:bg-[#17251d] dark:hover:border-[#506957] rounded-surface">
                  <div className="grid lg:grid-cols-[180px_minmax(0,1fr)_250px]">
                    <div className="relative min-h-40 overflow-hidden lg:min-h-[188px]">
                      <img src={image.src} alt={image.alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#142319]/50 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-3 border border-white/30 bg-[#17281e]/75 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm rounded-surface">{materialTypeLabel(demand.materialType)}</span>
                    </div>

                    <div className="min-w-0 gl-card-pad">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8a938b]">Receiver Request</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <h2 className="font-archivo text-xl font-bold tracking-tight text-[#26362c] dark:text-white">{materialTypeLabel(demand.materialType)}</h2>
                        <StatusBadge status={demand.status} />
                        {demand.targetProviderId === providerId && (
                          <span className="rounded-full bg-loop-100 px-2 py-0.5 text-xs font-semibold text-loop-800 dark:bg-loop-900 dark:text-loop-200">Direct Request</span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-[#778078] dark:text-gray-400"><span className="font-semibold text-[#3a4b3e] dark:text-gray-200">{demand.requiredT.toFixed(1)} t {materialTypeLabel(demand.materialType)}</span> · {demand.period}</p>
                      {demand.notes && <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#727d74] dark:text-gray-400">{demand.notes}</p>}
                      <details className="mt-3 text-xs text-[#526b58] dark:text-[#b6cfbd]">
                        <summary className="w-fit cursor-pointer font-semibold">View Match Details <span aria-hidden="true">→</span></summary>
                        <div className="mt-2 text-left">
                          {(() => {
                            const filters = {
                              minimumQuantityT: minimumT ? Number(minimumT) : undefined,
                              maximumBudget: maximumBudget ? Number(maximumBudget) : undefined,
                              neededBy: neededBy || undefined,
                            };
                            const matchCandidates = contextualMatch(dataset, { demandId: demand.id }, filters).filter(c => c.providerId === providerId);
                            const bestMatch = matchCandidates.length > 0 ? matchCandidates[0] : null;
                            if (!bestMatch) return <p className="text-sm text-steel-500">You have no matching materials for this request.</p>;
                            return (
                              <div className="space-y-4">
                                <p className="text-sm text-steel-600 dark:text-gray-300">Analysis against your best available material ({dataset.materials.find(m => m.id === bestMatch.materialId)?.id}):</p>
                                <MatchDetailsPanel match={bestMatch} />
                              </div>
                            );
                          })()}
                        </div>
                      </details>
                    </div>

                    <div className="flex flex-col justify-between gap-4 border-t border-[#eeeae2] bg-[#f8f7f2] p-4 dark:border-steel-800 dark:bg-[#1c2b22] sm:flex-row sm:items-center lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:p-4">
                      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-3 lg:grid-cols-1">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#929990]">Needs</p>
                          <p className="mt-0.5 font-archivo text-lg font-bold text-[#26362c] dark:text-white">{demand.requiredT.toFixed(1)} <span className="text-xs font-medium text-[#7e887f]">t</span></p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#929990]">Receiver</p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-[#38483e] dark:text-gray-200">{receiver?.name ?? demand.receiverId}</p>
                        </div>
                        <div className="col-span-2 min-w-0 lg:col-span-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#929990]">Location</p>
                          <p className="mt-0.5 truncate text-xs text-[#647168] dark:text-gray-400">{demand.location || receiver?.location || "Location not provided"}</p>
                        </div>
                        {demand.budgetPerT !== undefined && <div className="col-span-2 min-w-0 lg:col-span-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#929990]">Budget / tonne</p>
                          <p className="mt-0.5 truncate text-xs text-[#647168] dark:text-gray-400">{formatINRPerT(demand.budgetPerT)}</p>
                        </div>}
                      </div>
                      <div className="flex shrink-0 flex-row gap-2 sm:flex-col lg:mt-2">
                        {!isOffering && <button type="button" onClick={() => { setSelectedDemandId(demand.id); setSelectedPassportId(""); setOfferQuantity(""); setOfferError(""); }} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#315f3d] px-3 text-xs font-semibold text-white transition hover:bg-[#274d32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1c2b22] sm:flex-none">Offer material <span aria-hidden="true">→</span></button>}
                        {isOffering && <button type="button" onClick={() => setSelectedDemandId(null)} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-[#cbd4ca] bg-white px-3 text-xs font-semibold text-[#3f5946] hover:bg-[#f0f4ef] dark:border-steel-700 dark:bg-transparent dark:text-gray-200">Close offer form</button>}
                      </div>
                    </div>
                  </div>

                  {isOffering && (
                    <div className="border-t border-[#e9e6de] bg-white dark:border-steel-800 dark:bg-[#17251d] gl-card-pad">
                      <h3 className="font-archivo text-lg font-bold text-[#26362c] dark:text-white">Choose a Material Passport</h3>
                      <p className="mt-1 text-sm text-[#778078] dark:text-gray-400">A Material Passport is your material’s digital record, including its quantity and evidence.</p>
                      {availablePassports.length === 0 ? (
                        <div className="mt-4 border border-[#e8e5dd] bg-[#f8f7f2] p-4 text-sm text-[#667168] dark:border-steel-800 dark:bg-white/[0.03] dark:text-gray-300 rounded-surface">
                          You don’t have any surveyed passports for {materialTypeLabel(demand.materialType)}. <a href="/app/materials/new" className="font-semibold text-[#416d4b] underline underline-offset-2 dark:text-[#b8d0bd]">Add Material</a> first.
                        </div>
                      ) : (
                        <form onSubmit={handleOffer} className="mt-4 space-y-4">
                          <fieldset>
                            <legend className="mb-2 text-sm font-semibold text-[#526158] dark:text-gray-300">Choose the material to offer</legend>
                            <div className="grid gap-detail md:grid-cols-2">
                              {availablePassports.map((passport) => {
                                const committedT = dataset.bookings.filter((booking) => booking.materialId === passport.id && booking.status !== "cancelled").reduce((total, booking) => total + booking.tonnesT, 0);
                                const availableT = Math.max(0, passport.quantityT - committedT);
                                const photo = materialMedia(passport)[0];
                                return (
                                  <label key={passport.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${selectedPassportId === passport.id ? "border-[#5c8967] bg-[#eef4ed] dark:bg-[#294334]" : "border-[#e5e2da] bg-white hover:border-[#b9c8ba] dark:border-steel-800 dark:bg-[#17251d]"}`}>
                                    <input type="radio" name="passport" value={passport.id} checked={selectedPassportId === passport.id} onChange={() => setSelectedPassportId(passport.id)} required className="mt-1 accent-[#39714b]" />
                                    {photo && <img src={photo.src} alt={photo.caption} className="size-16 shrink-0 rounded-md object-cover" />}
                                    <span className="min-w-0 text-xs">
                                      <span className="block font-semibold text-[#26362c] dark:text-white">{materialTypeLabel(passport.type)} · {availableT.toFixed(1)} t available</span>
                                      <span className="mt-1 block text-[#778078] dark:text-gray-400">{passport.condition} condition · Grade {passport.grade} · {passport.evidence.length} evidence items</span>
                                      <details className="mt-1 text-xs text-[#526b58] dark:text-[#b6cfbd]"><summary className="cursor-pointer">Passport details</summary><span className="block pt-1 text-[#778078] dark:text-gray-400">Passport ID: {passport.id} · Est. range {passport.quantityRangeT[0]}–{passport.quantityRangeT[1]} t</span></details>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>
                          <div className="max-w-xs">
                            <label htmlFor={`offer-quantity-${demand.id}`} className="block text-sm font-semibold text-[#526158] dark:text-gray-300">Offer Quantity (t)</label>
                            <input id={`offer-quantity-${demand.id}`} type="number" min="0.1" step="0.1" value={offerQuantity} onChange={(event) => setOfferQuantity(event.target.value)} required max={(() => {
                              const passport = availablePassports.find((item) => item.id === selectedPassportId);
                              const committedT = dataset.bookings.filter((booking) => booking.materialId === selectedPassportId && booking.status !== "cancelled").reduce((total, booking) => total + booking.tonnesT, 0);
                              return passport ? Math.max(0, passport.quantityT - committedT) : "";
                            })()} className="mt-1 block h-10 w-full rounded-lg border border-[#dcded7] bg-white px-3 text-sm text-[#26362c] outline-none focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                          </div>
                          <div className="max-w-xs">
                            <label htmlFor={`offer-price-${demand.id}`} className="block text-sm font-semibold text-[#526158] dark:text-gray-300">Price per tonne (₹, optional)</label>
                            <input id={`offer-price-${demand.id}`} type="number" min="0.01" step="0.01" value={offerPricePerT} onChange={(event) => setOfferPricePerT(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-[#dcded7] bg-white px-3 text-sm text-[#26362c] outline-none focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white" />
                            {offerPricePerT !== "" && offerQuantity !== "" && <p className="mt-1 text-xs text-[#667168] dark:text-gray-400">{formatINRPerT(Number(offerPricePerT))} × {Number(offerQuantity).toLocaleString("en-IN")} t = <strong>{formatINR(Number(offerPricePerT) * Number(offerQuantity))}</strong></p>}
                          </div>
                          {offerError && <p role="alert" className="text-sm text-error-500">{offerError}</p>}
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" type="submit">Send offer</Button>
                            <Button variant="outline" size="sm" type="button" onClick={handleSaveOfferDraft}>Save Draft</Button>
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
      </section>
      )}

      {activeTab === "sent" && (
      <section className="mt-section overflow-hidden border border-[#e5e2da] bg-white dark:border-steel-800 dark:bg-[#17251d] rounded-surface">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eeeae2] px-4 py-4 dark:border-steel-800 sm:px-5">
          <div>
            <h2 className="font-archivo text-xl font-bold text-[#26362c] dark:text-white">Offers you have sent</h2>
            <p className="mt-0.5 text-xs text-[#7c857d] dark:text-gray-400">{myOffers.length ? `${myOffers.length} submitted ${myOffers.length === 1 ? "offer" : "offers"}` : "Your submitted offers will appear here."}</p>
          </div>
        </div>
        {myOffers.length === 0 ? (
          <p className="px-5 py-5 text-sm text-[#778078] dark:text-gray-400">No offers submitted yet.</p>
        ) : (
          <div className="divide-y divide-[#eeeae2] dark:divide-steel-800">
            {myOffers.map((offer) => {
              const demand = dataset.demands.find((item) => item.id === offer.demandId);
              const passport = dataset.materials.find((item) => item.id === offer.passportId);
              const project = passport && dataset.projects.find((item) => item.id === passport.projectId);
              const receiver = demand && dataset.receivers.find((item) => item.id === demand.receiverId);
              const photo = passport && materialMedia(passport)[0];
              return (
                <article key={offer.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  {photo ? <img src={photo.src} alt={photo.caption} className="size-12 shrink-0 rounded-md object-cover" /> : <img src={materialMediaFor(passport?.type ?? "").src} alt={materialMediaFor(passport?.type ?? "").alt} className="size-12 shrink-0 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#26362c] dark:text-white">{materialTypeLabel(passport?.type ?? "")} · {offer.offeredQuantityT.toFixed(1)} t</p>
                    <p className="mt-0.5 truncate text-xs text-[#778078] dark:text-gray-400">{project?.name ?? passport?.projectId ?? "Project unavailable"} · {receiver?.name ?? demand?.receiverId ?? "Receiver unavailable"}</p>
                  </div>
                  <p className="hidden text-xs text-[#778078] dark:text-gray-400 sm:block">{formatDate(offer.createdAt)}</p>
                  <StatusBadge status={offer.status} />
                  {offer.status === "pending" && <Button size="sm" variant="outline" onClick={() => withdrawOfferAction(offer.id)}>Withdraw offer</Button>}
                  {offer.status === "draft" && <Button size="sm" variant="outline" onClick={() => deleteOfferDraftAction(offer.id)}>Delete Draft</Button>}
                  <details className="basis-full sm:basis-auto">
                    <summary className="cursor-pointer text-xs font-semibold text-[#526b58] dark:text-[#b6cfbd]">View details <span aria-hidden="true">→</span></summary>
                    <p className="mt-2 text-xs text-[#778078] dark:text-gray-400">Offer {offer.id} · Request {offer.demandId} · Passport {offer.passportId} · {formatDate(offer.createdAt)}</p>
                  </details>
                  {offer.status !== "draft" && <NegotiationPanel offer={offer} canCounter={offer.status === "pending"} onCounter={(price) => counterOfferAction(offer.id, price)} />}
                </article>
              );
            })}
          </div>
        )}
      </section>
      )}

      {activeTab === "receivers" && user?.activeWorkspace !== "receiver" && <ReceiverDiscovery dataset={dataset} />}
    </div>
  );
}
