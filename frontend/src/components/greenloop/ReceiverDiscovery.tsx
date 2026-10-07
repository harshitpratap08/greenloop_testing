import { LocationMap } from "@/components/greenloop/LocationMap";
import MatchDetailsPanel from "@/components/greenloop/MatchDetailsPanel";
import SearchFilterBar from "@/components/greenloop/SearchFilterBar";
import { useAuth } from "@/context/AuthContext.helpers";
import { contextualMatch } from "@shared/domain/capacity";
import type { GreenLoopDataset, MaterialTypeKey } from "@shared/domain/types";
import { formatDate, materialTypeLabel } from "@/utils";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";

const materials: MaterialTypeKey[] = ["concrete", "brick", "steel", "timber", "plasterboard", "glass"];

export default function ReceiverDiscovery({ dataset }: { dataset: GreenLoopDataset }) {
  const { user } = useAuth();
  const providerId = user?.email ?? "P-001";
  const location = useLocation();
  const [materialType, setMaterialType] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [projectId, setProjectId] = useState("");
  const [organization, setOrganization] = useState("");
  const [status, setStatus] = useState("");
  const activeDemands = dataset.demands.filter((demand) => demand.status === "OPEN" || demand.status === "PARTIALLY_COVERED");
  const filteredReceivers = useMemo(() => dataset.receivers.filter((receiver) => {
    const demands = activeDemands.filter((demand) => demand.receiverId === receiver.id);
    const linkedProjectIds = new Set(dataset.bookings.filter((booking) => booking.receiverId === receiver.id).flatMap((booking) => {
      const material = dataset.materials.find((item) => item.id === booking.materialId);
      return material ? [material.projectId] : [];
    }));
    const query = locationQuery.trim().toLowerCase();
    return (!materialType || demands.some((demand) => demand.materialType === materialType))
      && (!query || `${receiver.location} ${receiver.name}`.toLowerCase().includes(query))
      && (!minimumQuantity || demands.some((demand) => demand.requiredT >= Number(minimumQuantity)))
      && (!neededBy || demands.some((demand) => demand.period <= neededBy))
      && (!projectId || linkedProjectIds.has(projectId))
      && (!organization || receiver.name.toLowerCase().includes(organization.trim().toLowerCase()))
      && (!status || demands.some((demand) => demand.status === status));
  }), [dataset.bookings, dataset.materials, dataset.receivers, activeDemands, materialType, locationQuery, minimumQuantity, neededBy, projectId, organization, status]);
  const jumpToDemand = () => document.getElementById("active-demand-list")?.scrollIntoView({ behavior: "smooth" });
  const customTypeOptions = [...new Set(activeDemands.map((demand) => demand.materialType))].filter((item) => !materials.includes(item as MaterialTypeKey));
  const activeFilterCount = [materialType, locationQuery, minimumQuantity, neededBy, projectId, organization, status].filter(Boolean).length;

  return <section id="receiver-discovery" className="mt-12 scroll-mt-24" aria-labelledby="receiver-discovery-title">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-loop-700 dark:text-loop-300">Provider discovery</p><h2 id="receiver-discovery-title" className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">Receivers</h2><p className="mt-1 text-sm text-steel-600 dark:text-gray-400">All receiver facilities are shown before filters are applied.</p></div><span className="text-xs text-steel-500">{filteredReceivers.length} of {dataset.receivers.length} facilities</span></div>
    <SearchFilterBar
      searchValue={locationQuery}
      onSearchChange={setLocationQuery}
      searchPlaceholder="Search facility, city or region…"
      searchLabel="Search receivers"
      activeFilterCount={activeFilterCount}
      onClearFilters={() => { setMaterialType(""); setLocationQuery(""); setMinimumQuantity(""); setNeededBy(""); setProjectId(""); setOrganization(""); setStatus(""); }}
      resultLabel={`${filteredReceivers.length} shown`}
      filters={
        <>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Material<select value={materialType} onChange={(event) => setMaterialType(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">Any material</option>{materials.map((item) => <option key={item} value={item}>{materialTypeLabel(item)}</option>)}{customTypeOptions.map((item) => <option key={item} value={item}>{materialTypeLabel(item)}</option>)}</select></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Minimum quantity<input type="number" min="0" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Required by<input type="date" value={neededBy} onChange={(event) => setNeededBy(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Project<select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">All projects</option>{dataset.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Organization<input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Name" className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white" /></label>
          <label className="text-xs font-medium text-steel-600 dark:text-gray-300">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-steel-300 bg-white px-3 text-sm dark:border-steel-700 dark:bg-[#17251d] dark:text-white"><option value="">All statuses</option><option value="OPEN">Open</option><option value="PARTIALLY_COVERED">Partially covered</option></select></label>
        </>
      }
    />
    {filteredReceivers.length ? <ul className="mt-4 grid gap-detail lg:grid-cols-2">{filteredReceivers.map((receiver) => {
      const demand = activeDemands.find((item) => item.receiverId === receiver.id);
      const relatedProjects = [...new Set(dataset.bookings.filter((booking) => booking.receiverId === receiver.id).map((booking) => dataset.materials.find((item) => item.id === booking.materialId)?.projectId).filter((id): id is string => Boolean(id)))];
      return <li key={receiver.id} className="border border-steel-200 bg-white p-4 dark:border-steel-800 dark:bg-[#17251d] rounded-surface"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">{receiver.name}</h3><p className="mt-1 text-sm text-steel-600 dark:text-gray-400">{receiver.location || "Location not provided"}</p></div><span className="text-xs font-semibold text-steel-500">{receiver.acceptedTypes.length ? receiver.acceptedTypes.join(", ") : "Open to requests"}</span></div>{(demand?.geo ?? receiver.geo) && <LocationMap geo={demand?.geo ?? receiver.geo} className="mt-3 h-40" />}<div className="mt-3 grid grid-cols-2 gap-detail border-y border-steel-100 py-3 text-xs dark:border-steel-800"><span>Material required<strong className="mt-1 block capitalize text-ink-900 dark:text-white">{demand?.materialType ?? "No active request"}</strong></span><span>Quantity<strong className="mt-1 block text-ink-900 dark:text-white">{demand ? `${demand.requiredT.toLocaleString("en-IN")} t` : "—"}</strong></span><span>Required date<strong className="mt-1 block text-ink-900 dark:text-white">{demand ? formatDate(demand.period) : "—"}</strong></span><span>Status<strong className="mt-1 block text-ink-900 dark:text-white">{demand?.status.replaceAll("_", " ") ?? "No active demand"}</strong></span><span className="col-span-2">Project<strong className="mt-1 block text-ink-900 dark:text-white">{relatedProjects.map((id) => dataset.projects.find((project) => project.id === id)?.name ?? id).join(", ") || "Not linked"}</strong></span></div><details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-loop-700 dark:text-loop-300">Overview and details</summary><p className="mt-2 text-xs leading-5 text-steel-600 dark:text-gray-400">{receiver.dailyIntakeT.toLocaleString("en-IN")} tonnes daily intake · currently holding {receiver.currentStockT.toLocaleString("en-IN")} tonnes. This directory shows shared facility data only.</p></details>
      
      <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-loop-700 dark:text-loop-300">View Match Analysis</summary>
        <div className="mt-2 text-left">
          {(() => {
            const context = demand ? { demandId: demand.id } : { receiverId: receiver.id };
            const filters = {
              minimumQuantityT: minimumQuantity ? Number(minimumQuantity) : undefined,
              neededBy: neededBy || undefined,
              locationQuery: locationQuery || undefined,
              materialType: materialType || undefined,
            };
            const matchCandidates = contextualMatch(dataset, context, filters).filter(c => c.providerId === providerId);
            const bestMatch = matchCandidates.length > 0 ? matchCandidates[0] : null;
            if (!bestMatch) return <p className="text-sm text-steel-500">You have no matching materials for this receiver.</p>;
            return (
              <div className="space-y-4">
                <p className="text-sm text-steel-600 dark:text-gray-300">Analysis against your best available material ({dataset.materials.find(m => m.id === bestMatch.materialId)?.id}):</p>
                <MatchDetailsPanel match={bestMatch} />
              </div>
            );
          })()}
        </div>
      </details>
      
      {demand && <Link onClick={jumpToDemand} to={`/app/market-demand?demand=${encodeURIComponent(demand.id)}`} state={{ from: location.pathname }} className="mt-4 inline-flex min-h-10 items-center bg-[#315f3d] px-4 text-sm font-semibold text-white hover:bg-[#274d32]">Offer Material</Link>}</li>;
    })}</ul> : <div className="mt-4 border border-dashed border-steel-300 px-6 py-10 text-center text-sm text-steel-600 dark:border-steel-700 dark:text-gray-400">No receivers match the selected filters.</div>}
  </section>;
}
