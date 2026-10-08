import PageMeta from "@/components/common/PageMeta";
import ListingSponsorshipControl from "@/components/monetization/ListingSponsorshipControl";
import { EmptyState, PageMotion, RevealItem, StatusChip, VideoPanel } from "@/components/greenloop/kit";
import RecordActions from "@/components/greenloop/RecordActions";
import { ambientVideo, materialMediaFor } from "@/config/appMedia";
import type { MaterialTypeKey } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { materialTypeLabel } from "@/utils";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

type MaterialCategory = "all" | MaterialTypeKey | "other";

const CATEGORY_FILTERS: { id: MaterialCategory; label: string }[] = [
  { id: "all", label: "All Materials" },
  { id: "concrete", label: "Concrete" },
  { id: "brick", label: "Brick" },
  { id: "steel", label: "Steel" },
  { id: "timber", label: "Wood" },
  { id: "plasterboard", label: "Plasterboard" },
  { id: "glass", label: "Glass" },
  { id: "other", label: "Other" },
];

const knownTypes = new Set<string>(["concrete", "brick", "steel", "timber", "plasterboard", "glass"]);

function MaterialFilterIcon({ category }: { category: MaterialCategory }) {
  const common = "size-3.5 shrink-0";
  switch (category) {
    case "all":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={common}><path d="M2 2h6v6H2zm10 0h6v6h-6zM2 12h6v6H2zm10 0h6v6h-6z" /></svg>;
    case "concrete":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={common}><path d="m10 2.5 7 4v7l-7 4-7-4v-7l7-4Z" /><path d="m3.5 6.5 6.5 4 6.5-4M10 10.5v7" /></svg>;
    case "brick":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={common}><path d="M2.5 4h6v5h-6zm9 0h6v5h-6zM2.5 11h6v5h-6zm9 0h6v5h-6z" /><path d="M8.5 6.5h3m-9 7h3m6 0h3" /></svg>;
    case "steel":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}><path d="M3 5h14l-2 3H5L3 5Zm2 5h12l-2 3H7l-2-3Zm2 5h10" /></svg>;
    case "timber":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={common}><path d="M5 3.5h10v3H5zm-2 5h14v3H3zm2 5h10v3H5z" /><path d="M7 5h.01M13 10h.01M8 15h.01" /></svg>;
    case "plasterboard":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={common}><path d="M4 2.5h9l3 3V17H4z" /><path d="M13 2.5v3h3M7 9h6m-6 3h6" /></svg>;
    case "glass":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={common}><path d="m6 2.5h8l3 6-7 9-7-9 3-6Z" /><path d="M6 2.5 10 17.5m4-15L10 17.5M3 8.5h14" /></svg>;
    case "other":
      return <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className={common}><circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" /></svg>;
  }
}

const categoryIconColors: Record<MaterialCategory, string> = {
  all: "text-[#91bd9a]",
  concrete: "text-[#6e8a78]",
  brick: "text-[#d77933]",
  steel: "text-[#788994]",
  timber: "text-[#a87838]",
  plasterboard: "text-[#c28b4d]",
  glass: "text-[#67978f]",
  other: "text-[#78847c]",
};

function MaterialCategoryIcon({ kind }: { kind: "passports" | "volume" }) {
  return kind === "passports" ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="M6 3.75h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" /><path d="M14 4v4h4M8 13h8m-8 3.5h6" /></svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-5"><circle cx="12" cy="12" r="9" /><path d="M12 6v12m4-9.5c-.5-1-1.5-1.5-3.3-1.5-1.6 0-2.7.8-2.7 2s1 1.8 2.7 2.2 3.3 1 3.3 2.4-1.2 2.4-3.2 2.4c-1.6 0-2.9-.7-3.5-1.8" /></svg>
  );
}

export default function Materials() {
  const { dataset } = useGreenLoopStore();
  const [params, setParams] = useSearchParams();
  const selectedProjectId = params.get("project");
  const selectedProject = dataset.projects.find((project) => project.id === selectedProjectId);
  const [category, setCategory] = useState<MaterialCategory>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const projectName = (id: string) => dataset.projects.find((project) => project.id === id)?.name ?? id;
  const totalT = dataset.materials.reduce((total, material) => total + material.quantityT, 0);

  const categoryCounts = useMemo(() => {
    const counts: Record<MaterialCategory, number> = {
      all: dataset.materials.length,
      concrete: 0,
      brick: 0,
      steel: 0,
      timber: 0,
      plasterboard: 0,
      glass: 0,
      other: 0,
    };
    dataset.materials.forEach((material) => {
      if (knownTypes.has(material.type)) counts[material.type as MaterialTypeKey] += 1;
      else counts.other += 1;
    });
    return counts;
  }, [dataset.materials]);

  const visibleMaterials = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return dataset.materials.filter((material) => {
      const isOther = !knownTypes.has(material.type);
      const matchesCategory = category === "all"
        || (category === "other" ? isOther : material.type === category);
      const project = dataset.projects.find((item) => item.id === material.projectId)?.name ?? material.projectId;
      const matchesQuery = !normalizedQuery || [
        materialTypeLabel(material.type),
        material.id,
        project,
        material.status,
        material.condition,
        material.grade,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery && (!selectedProjectId || material.projectId === selectedProjectId);
    });
  }, [category, dataset.materials, dataset.projects, query, selectedProjectId]);

  return (
    <PageMotion>
      <PageMeta title="Inventory | GreenLoop" description="Manage recovered construction material and its digital passports." />

      <RevealItem>
        <section className="relative">
          <VideoPanel
            video={ambientVideo.inventory}
            aspect="min-h-[540px] sm:min-h-[520px] lg:min-h-[500px]"
            scrim="bg-gradient-to-r from-[#102018]/90 via-[#102018]/65 to-[#102018]/20"
            className="w-full rounded-none border-0 shadow-none"
          >
            <div className="absolute inset-0 z-10 flex flex-col justify-between px-5 pb-7 pt-24 sm:px-8 sm:pb-8 sm:pt-24 lg:px-10 lg:pb-9 lg:pt-28">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#12251b]/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d2dfd2] backdrop-blur-sm">
                  <span className="size-1.5 rounded-full bg-[#a6d29d]" />
                  GreenLoop Operations
                </span>
                <h1 className="mt-4 font-archivo text-4xl font-bold leading-[1.02] tracking-tight text-white drop-shadow sm:text-5xl lg:text-[58px]">
                  {selectedProject?.name ?? <>Materials today.<br />A cleaner tomorrow.</>}
                </h1>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/85 drop-shadow-sm sm:text-base">
                  Digital records connecting physical material to projects and recovery status.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-white/80">
                  <span aria-hidden="true" className="text-[#b3d9a8]">↻</span>
                  Recovered material, recorded and ready to place
                </span>
              </div>

              <div className="grid shrink-0 overflow-hidden rounded-[20px] border border-white/20 bg-[#14251c]/60 shadow-lg backdrop-blur-md sm:grid-cols-[1fr_1fr_auto] sm:rounded-full">
                <div className="flex min-h-[68px] items-center gap-3 border-b border-white/15 px-4 py-3 text-white sm:border-b-0 sm:border-r sm:px-6">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#d1e1d2]"><MaterialCategoryIcon kind="passports" /></span>
                  <div><p className="font-archivo text-xl font-bold leading-5">{dataset.materials.length}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">Active Passports</p></div>
                </div>
                <div className="flex min-h-[68px] items-center gap-3 border-b border-white/15 px-4 py-3 text-white sm:border-b-0 sm:border-r sm:px-6">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#d1e1d2]"><MaterialCategoryIcon kind="volume" /></span>
                  <div><p className="font-archivo text-xl font-bold leading-5">{totalT.toFixed(1)} t</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">Total Volume</p></div>
                </div>
                <Link to={selectedProjectId ? `/app/materials/new?project=${encodeURIComponent(selectedProjectId)}` : "/app/materials/new"} className="inline-flex min-h-[68px] items-center justify-center gap-2 bg-[#d7e6d5] px-5 text-sm font-bold text-[#203a28] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:rounded-r-full sm:px-7">
                  <span aria-hidden="true" className="text-lg leading-none">+</span> Add New Material
                </Link>
              </div>
            </div>
          </VideoPanel>
        </section>
      </RevealItem>

      <div className="relative isolate mx-auto max-w-app px-4 pt-8 sm:px-6 xl:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[220px] overflow-hidden sm:h-[300px] xl:h-[430px]">
        <img src="/images/site/inventory-nature-concrete.png" alt="" className="absolute inset-y-0 right-0 h-full w-[78%] object-contain object-right-bottom sm:w-[74%] xl:w-[68%]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f6f5f0_0%,rgba(246,245,240,0.88)_24%,rgba(246,245,240,0.42)_48%,transparent_76%)] dark:bg-[linear-gradient(to_right,#101913_0%,rgba(16,25,19,0.88)_24%,rgba(16,25,19,0.42)_48%,transparent_76%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f6f5f0_0%,rgba(246,245,240,0.62)_18%,transparent_48%)] dark:bg-[linear-gradient(to_bottom,#101913_0%,rgba(16,25,19,0.62)_18%,transparent_48%)]" />
      </div>
      <div className="relative z-10">
      {dataset.materials.length === 0 ? (
        <RevealItem>
          <EmptyState
            title="No material passports yet"
            body="Add your material, quantity, location, and photos to create its digital record."
            action={<Link to={selectedProjectId ? `/app/materials/new?project=${encodeURIComponent(selectedProjectId)}` : "/app/materials/new"} className="inline-flex min-h-11 items-center rounded-lg bg-[#315c3d] px-6 text-sm font-semibold text-white hover:bg-[#254a30]">Add New Material</Link>}
          />
        </RevealItem>
      ) : (
        <>
          <section aria-label="Material categories" className="mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORY_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold transition-all ${category === item.id ? "border-[#123e29] bg-[#123e29] text-white shadow-[0_4px_12px_rgba(18,62,41,0.2)] dark:border-[#9cbea3] dark:bg-[#9cbea3] dark:text-[#14251a]" : "border-[#e3e4dc] bg-white/90 text-[#647068] shadow-[0_2px_6px_rgba(38,52,43,0.04)] hover:border-[#a5b7a7] hover:bg-[#f2f5f0] dark:border-steel-700 dark:bg-[#17251d] dark:text-gray-300 dark:hover:bg-white/[0.05]"}`}
                >
                  <span className={category === item.id ? "text-white dark:text-[#315f3d]" : categoryIconColors[item.id]}>
                    <MaterialFilterIcon category={item.id} />
                  </span>
                  {item.label} <span className={`text-[10px] ${category === item.id ? "text-white/70 dark:text-[#294332]" : "text-[#929b92]"}`}>({categoryCounts[item.id]})</span>
                </button>
              ))}
            </div>
          </section>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-[#7c857d] dark:text-gray-400">Showing <span className="font-bold text-[#35483a] dark:text-gray-200">{visibleMaterials.length}</span> of {dataset.materials.length} materials</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block sm:w-[300px]">
                <span className="sr-only">Search materials</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7e887f]"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search materials..."
                  className="h-10 w-full rounded-full border border-[#e1ded6] bg-white pl-9 pr-3 text-xs text-[#26362c] outline-none transition focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white"
                />
              </label>
              <div aria-label="Material display" className="inline-flex self-start rounded-full border border-[#e1ded6] bg-white p-1 dark:border-steel-700 dark:bg-[#17251d]">
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-label={`${mode === "grid" ? "Grid" : "List"} view`}
                    aria-pressed={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex size-8 items-center justify-center rounded-full transition ${viewMode === mode ? "bg-[#315f3d] text-white" : "text-[#78837a] hover:bg-[#f0f3ee] dark:hover:bg-white/[0.06]"}`}
                  >
                    {mode === "grid" ? (
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M2.5 2.5h6v6h-6zm9 0h6v6h-6zm-9 9h6v6h-6zm9 0h6v6h-6z" /></svg>
                    ) : (
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4"><path d="M3 4h14v2H3zm0 5h14v2H3zm0 5h14v2H3z" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {visibleMaterials.length > 0 ? (
            <ul className={viewMode === "grid" ? "grid gap-card sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"} aria-label="Material passports">
              {visibleMaterials.map((material) => {
                const allocation = dataset.allocations.find((item) => item.materialId === material.id && item.status !== "cancelled");
                const photoCount = material.evidence.filter((item) => item.kind === "site-photo").length;
                const chip = material.status === "verified" ? "verified" as const
                  : material.status === "dispatched" ? "active" as const
                  : material.status === "reserved" || material.status === "allocated" ? "confirmed" as const
                  : "attention" as const;

                return (
                  <li key={material.id}>
                        <RevealItem className="h-full">
                          <article className={`group flex h-full overflow-hidden border border-[#e5e2da] bg-white shadow-[0_3px_14px_rgba(26,42,31,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-[#bfccbf] hover:shadow-[0_12px_28px_rgba(26,42,31,0.1)] dark:border-steel-800 dark:bg-[#17251d] dark:hover:border-[#506957] rounded-[18px] ${viewMode === "list" ? "flex-col lg:flex-row" : "flex-col"}`}>
                            <div className={`relative overflow-hidden bg-[#ecebe5] dark:bg-[#24372b] ${viewMode === "list" ? "aspect-[16/8.5] lg:aspect-auto lg:w-[320px] lg:shrink-0" : "aspect-[16/5.5]"}`}>
                              <img src={materialMediaFor(material.type).src} alt={materialMediaFor(material.type).alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#142319]/45 via-transparent to-transparent" />
                              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-[#17281e]/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm"><span className="text-[#b8d6bc]">◉</span>{materialTypeLabel(material.type)}</span>
                              <span className="absolute left-2 top-2 rounded-full bg-white/95 p-0.5 shadow-sm"><StatusChip status={chip} label={material.status} className="rounded-full px-2 py-1 text-[10px] font-semibold tracking-normal" /></span>
                              <div className="absolute right-2 top-2"><RecordActions kind="passport" id={material.id} compact /></div>
                            </div>

                            <div className="flex flex-1 flex-col p-2.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h2 className="truncate font-archivo text-sm font-bold tracking-tight text-[#26362c] dark:text-white">{materialTypeLabel(material.type)}</h2>
                                  <p className="truncate text-[10px] text-[#7d867e] dark:text-gray-400">
                                    <Link to={`/app/materials?project=${encodeURIComponent(material.projectId)}`} className="font-medium text-[#435d49] hover:text-[#2f6b3e] dark:text-gray-200 dark:hover:text-loop-300">{projectName(material.projectId)}</Link>
                                    <span> · ID {material.id}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-[#f6f6f1] px-2 py-1.5 dark:bg-white/[0.04]">
                                <div className="min-w-0">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#929990]">Volume</p>
                                  <p className="truncate text-[10px] font-bold text-[#26362c] dark:text-white">{material.quantityT.toFixed(1)} t</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#929990]">Condition</p>
                                  <p className="truncate text-[10px] font-medium capitalize text-[#38483e] dark:text-gray-200">{material.condition} · Grade {material.grade}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#929990]">Evidence</p>
                                  <p className="truncate text-[10px] font-medium text-[#38483e] dark:text-gray-200">{photoCount} photos · {material.evidence.length} records</p>
                                </div>
                              </div>

                              <div className="mt-auto grid grid-cols-2 gap-1.5 pt-1.5">
                                <Link to={`/app/materials/${material.id}`} className={`inline-flex min-h-7 items-center justify-center gap-1 rounded-full bg-[#315f3d] px-2 text-[10px] font-semibold text-white transition hover:bg-[#274d32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#17251d] ${allocation ? "col-span-2" : ""}`}>
                                  View passport <span aria-hidden="true">→</span>
                                </Link>
                                {!allocation && (
                                  <Link to="/app/market-demand?view=receivers" state={{ materialId: material.id }} className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#cbd4ca] bg-white px-2 text-[10px] font-semibold text-[#3f5946] transition hover:bg-[#f0f4ef] dark:border-steel-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/[0.05]">
                                    Find receiver
                                  </Link>
                                )}
                                <Link to={`/app/auctions?material=${encodeURIComponent(material.id)}`} className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#9fc5a7] bg-[#eef6ee] px-2 text-[10px] font-semibold text-[#315b3c] transition hover:bg-[#e1efe2] dark:border-steel-700 dark:bg-[#21372a] dark:text-loop-200 dark:hover:bg-[#2b4634]">Create Auction</Link>
                                <ListingSponsorshipControl materialId={material.id} />
                          </div>
                        </div>
                      </article>
                    </RevealItem>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="border border-dashed border-[#d8ddd5] bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02] rounded-surface">
              <h2 className="font-archivo text-lg font-bold text-[#2c3e31] dark:text-white">No matching materials</h2>
              <p className="mt-1 text-sm text-[#7a837b] dark:text-gray-400">Try another material name or category.</p>
              <button type="button" onClick={() => { setQuery(""); setCategory("all"); setParams({}); }} className="mt-4 text-sm font-semibold text-[#416d4b] underline underline-offset-4 dark:text-[#b8d0bd]">Clear search and filters</button>
            </div>
          )}
        </>
      )}
      </div>
      </div>
    </PageMotion>
  );
}
