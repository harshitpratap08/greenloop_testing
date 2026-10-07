import PageMeta from "@/components/common/PageMeta";
import { EmptyState, PageMotion, RevealItem, StatusChip } from "@/components/greenloop/kit";
import RecordActions from "@/components/greenloop/RecordActions";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { computeMatch } from "@shared/domain/capacity";
import type { MaterialTypeKey } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatINR, formatINRPerT, materialTypeLabel } from "@/utils";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

type MaterialCategory = "all" | MaterialTypeKey | "other";

const CATEGORY_FILTERS: { id: MaterialCategory; label: string }[] = [
  { id: "all", label: "All Materials" },
  { id: "concrete", label: "Concrete" },
  { id: "brick", label: "Brick" },
  { id: "steel", label: "Steel" },
  { id: "timber", label: "Wood" },
  { id: "other", label: "Other" },
];

const knownTypes = new Set<string>(["concrete", "brick", "steel", "timber"]);

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
    <PageMotion className="mx-auto max-w-app pb-16">
      <PageMeta title="Inventory | GreenLoop" description="Manage recovered construction material and its digital passports." />

      <RevealItem>
        <section className="relative mb-section grid min-h-[230px] overflow-hidden border border-[#e5e1d8] bg-[#192c20] dark:border-steel-800 sm:min-h-[250px] lg:grid-cols-[1fr_auto] rounded-surface">
          <img src={ambientMedia.brickPallets.src} alt={ambientMedia.brickPallets.alt} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/72 to-[#17291e]/15" />
          <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:max-w-[720px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c7d5c8]">GreenLoop Operations</p>
            <h1 className="mt-2 font-archivo font-bold tracking-tight text-white gl-page-title">{selectedProject?.name ?? <>Inventory</>}</h1>
            <p className="mt-2 max-w-lg text-sm leading-5 text-white/85 sm:text-base sm:leading-6">Digital records connecting physical material to projects and recovery status.</p>
            <span className="mt-5 inline-flex w-fit items-center rounded-md border border-white/25 bg-[#102118]/45 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-white/90 backdrop-blur-sm">Recovered material, recorded and ready to place</span>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3 border-t border-white/20 bg-[#12241a]/80 backdrop-blur-sm lg:my-auto lg:mr-5 lg:rounded-xl lg:border lg:bg-[#f8f7f1] lg:p-4 lg:backdrop-blur-none dark:lg:bg-[#17251d] gl-card-pad">
            <div className="flex min-w-[130px] flex-1 items-center gap-3 border border-white/15 bg-white/10 px-3 py-2.5 text-white lg:min-w-[142px] lg:border-[#e4e1d8] lg:bg-transparent lg:text-[#26372c] dark:lg:border-steel-700 dark:lg:text-white rounded-surface">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#c9dccd] lg:bg-[#edf3ed] lg:text-[#4d7658] dark:lg:bg-[#294334] dark:lg:text-[#b8d2bf]"><MaterialCategoryIcon kind="passports" /></span>
              <div><p className="font-archivo text-xl font-bold leading-5">{dataset.materials.length}</p><p className="mt-1 text-xs text-white/70 lg:text-[#7d887f] dark:lg:text-gray-400">Active Passports</p></div>
            </div>
            <div className="flex min-w-[130px] flex-1 items-center gap-3 border border-white/15 bg-white/10 px-3 py-2.5 text-white lg:min-w-[142px] lg:border-[#e4e1d8] lg:bg-transparent lg:text-[#26372c] dark:lg:border-steel-700 dark:lg:text-white rounded-surface">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#c9dccd] lg:bg-[#edf3ed] lg:text-[#4d7658] dark:lg:bg-[#294334] dark:lg:text-[#b8d2bf]"><MaterialCategoryIcon kind="volume" /></span>
              <div><p className="font-archivo text-xl font-bold leading-5">{totalT.toFixed(1)} t</p><p className="mt-1 text-xs text-white/70 lg:text-[#7d887f] dark:lg:text-gray-400">Total Volume</p></div>
            </div>
            <Link to={selectedProjectId ? `/app/materials/new?project=${encodeURIComponent(selectedProjectId)}` : "/app/materials/new"} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#39714b] px-4 text-sm font-semibold text-white transition hover:bg-[#2f613e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:w-auto lg:min-w-[140px]">
              <span aria-hidden="true" className="text-lg leading-none">+</span> Add New Material
            </Link>
          </div>
        </section>
      </RevealItem>

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
          <section aria-label="Material categories" className="mb-5 border-b border-[#e4e1d8] dark:border-steel-800">
            <div className="flex gap-5 overflow-x-auto">
              {CATEGORY_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-3 pt-1 text-xs font-semibold transition-colors ${category === item.id ? "border-[#4b7956] text-[#315c3d] dark:text-[#c5ddcb]" : "border-transparent text-[#7c857d] hover:text-[#315c3d] dark:text-gray-400 dark:hover:text-white"}`}
                >
                  {item.label} <span className={`text-xs ${category === item.id ? "text-[#66806b] dark:text-[#a9c7b0]" : "text-[#a1a79f]"}`}>({categoryCounts[item.id]})</span>
                </button>
              ))}
            </div>
          </section>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-[#7c857d] dark:text-gray-400">Showing {visibleMaterials.length} of {dataset.materials.length} materials</p>
            <label className="relative block sm:w-[330px]">
              <span className="sr-only">Search materials</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7e887f]"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search materials, e.g. concrete, brick..."
                className="h-10 w-full rounded-lg border border-[#e1ded6] bg-white pl-9 pr-3 text-xs text-[#26362c] outline-none transition focus:border-[#64866d] focus:ring-2 focus:ring-[#64866d]/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white"
              />
            </label>
          </div>

          {visibleMaterials.length > 0 ? (
            <ul className="grid gap-card sm:grid-cols-2 xl:grid-cols-3" aria-label="Material passports">
              {visibleMaterials.map((material) => {
                const allocation = dataset.allocations.find((item) => item.materialId === material.id && item.status !== "cancelled");
                const candidate = computeMatch(dataset, material.id)[0];
                const receiverId = allocation?.receiverId ?? candidate?.receiverId;
                const matchedReceiver = receiverId ? dataset.receivers.find((item) => item.id === receiverId) : undefined;
                const photoCount = material.evidence.filter((item) => item.kind === "site-photo").length;
                const chip = material.status === "verified" ? "verified" as const
                  : material.status === "dispatched" ? "active" as const
                  : material.status === "reserved" || material.status === "allocated" ? "confirmed" as const
                  : "attention" as const;

                return (
                  <li key={material.id}>
                    <RevealItem className="h-full">
                      <article className="group flex h-full flex-col overflow-hidden border border-[#e5e2da] bg-white shadow-[0_2px_10px_rgba(26,42,31,0.035)] transition hover:border-[#bfccbf] hover:shadow-[0_6px_18px_rgba(26,42,31,0.075)] dark:border-steel-800 dark:bg-[#17251d] dark:hover:border-[#506957] rounded-surface">
                        <div className="relative aspect-[16/8.5] overflow-hidden bg-[#ecebe5] dark:bg-[#24372b]">
                          <img src={materialMediaFor(material.type).src} alt={materialMediaFor(material.type).alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#142319]/45 via-transparent to-transparent" />
                          <span className="absolute bottom-3 left-3 border border-white/30 bg-[#17281e]/75 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm rounded-surface">{materialTypeLabel(material.type)}</span>
                          <span className="absolute right-3 top-3"><StatusChip status={chip} label={material.status} className="rounded-md px-2 py-1 text-xs font-semibold tracking-normal shadow-sm" /></span>
                        </div>

                        <div className="flex flex-1 flex-col gl-card-pad">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="truncate font-archivo text-lg font-bold tracking-tight text-[#26362c] dark:text-white">{materialTypeLabel(material.type)}</h2>
                              <p className="mt-0.5 truncate text-xs text-[#7d867e] dark:text-gray-400">
                                <Link to={`/app/materials?project=${encodeURIComponent(material.projectId)}`} className="font-medium text-[#435d49] hover:text-[#2f6b3e] dark:text-gray-200 dark:hover:text-loop-300">{projectName(material.projectId)}</Link>
                                <span> · ID {material.id}</span>
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#efede7] py-3 dark:border-white/[0.07]">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#929990]">Volume</p>
                              <p className="mt-1 font-archivo text-base font-bold text-[#26362c] dark:text-white">{material.quantityT.toFixed(1)} <span className="text-xs font-medium text-[#7e887f]">t</span></p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#929990]">Condition</p>
                              <p className="mt-1 truncate text-xs font-medium capitalize text-[#38483e] dark:text-gray-200">{material.condition} · Grade {material.grade}</p>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#929990]">Evidence</p>
                              <p className="mt-1 truncate text-xs font-medium text-[#38483e] dark:text-gray-200">{photoCount} photos · {material.evidence.length} records</p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap justify-between gap-2 rounded-md bg-[#f6f5f0] px-3 py-2 dark:bg-white/[0.04]"><span className="text-xs font-medium text-[#778078]">{material.pricePerT !== undefined ? formatINRPerT(material.pricePerT) : "Price on request"}</span>{material.pricePerT !== undefined && <span className="text-xs font-bold text-[#26362c] dark:text-white">{formatINR(material.pricePerT * material.quantityT)} total</span>}</div>

                          {matchedReceiver ? (
                            <p className="mt-3 flex items-start gap-1.5 text-xs leading-4 text-[#778078] dark:text-gray-400">
                              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="mt-0.5 size-3.5 shrink-0 text-[#54805e]"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                              <span>{allocation ? "Matched with" : "Suggested"}: <span className="font-semibold text-[#415749] dark:text-gray-200">{matchedReceiver.name}</span></span>
                            </p>
                          ) : <div className="mt-3 min-h-4" />}

                          <div className="mt-auto flex flex-wrap gap-2 pt-4">
                            <div className="basis-full"><RecordActions kind="passport" id={material.id} /></div>
                            <Link to={`/app/materials/${material.id}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#315f3d] px-3 text-xs font-semibold text-white transition hover:bg-[#274d32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#17251d]">
                              View passport <span aria-hidden="true">→</span>
                            </Link>
                            {!allocation && (
                              <Link to="/app/market-demand?view=receivers" state={{ materialId: material.id }} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg border border-[#cbd4ca] bg-white px-3 text-xs font-semibold text-[#3f5946] transition hover:bg-[#f0f4ef] dark:border-steel-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/[0.05]">
                                Find receiver
                              </Link>
                            )}
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
    </PageMotion>
  );
}
