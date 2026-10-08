import PageMeta from "@/components/common/PageMeta";
import AdvancedImpactPanel from "@/components/monetization/AdvancedImpactPanel";
import { ProjectStatusChip } from "@/components/greenloop/AppExploration";
import { materialMedia } from "@/components/greenloop/AppExploration.helpers";
import CapacityBar from "@/components/greenloop/CapacityBar";
import EventLog from "@/components/greenloop/EventLog";
import { MediaPanel } from "@/components/greenloop/kit";
import RecoveryFlow from "@/components/greenloop/RecoveryFlow";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Badge from "@/components/ui/badge/Badge";
import { ambientMedia, materialMediaFor, projectMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { slotLedger } from "@shared/domain/capacity";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate, materialTypeLabel } from "@/utils";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Bookings from "../Bookings";
import Deliveries from "../Deliveries";
import ReceiverDeliveriesPage from "../receiver/ReceiverDeliveries";
import {
CapacityTimelineChart,
CompositionChart,
KpiCard,
PlannedActualChart,
ProjectRecoveryChart,
ReceiverCapacityChart,
RecoveryFlowChart,
} from "../Reports";

/**
 * One Dashboard per workspace. Merges the former Reports page and Operations
 * console into a single operational home: attention items, KPIs, analytics and
 * recent activity. Nothing was removed — everything from both pages lives here.
 */
export default function Dashboard() {
  const { user } = useAuth();
  return user?.activeWorkspace === "receiver" ? <ReceiverDashboard /> : <ProviderDashboard />;
}

type ProviderProps = ReturnType<typeof useProviderDashboardData>;

function useProviderDashboardData() {
  const { dataset } = useGreenLoopStore();
  return useMemo(() => {
    const holdBookings = dataset.bookings.filter((b) => b.status === "hold");
    const upcomingBookings = dataset.bookings.filter((b) => b.status !== "cancelled").slice(0, 6);
    const readyToSend = dataset.bookings.filter((booking) => booking.status === "confirmed" && booking.receiverAcceptedAt && !booking.loadRef);
    const unassignedMaterials = dataset.materials.filter((material) => material.status !== "verified" && material.status !== "dispatched" && !dataset.allocations.some((allocation) => allocation.materialId === material.id && allocation.status !== "cancelled"));
    const attentionTasks: Array<{ id: string; title: string; action: string; to: string; materialId?: string }> = [
      ...unassignedMaterials.map((material) => ({ id: material.id, title: `${material.quantityT.toFixed(1)} t ${materialTypeLabel(material.type)} needs a receiver`, action: "Find receiver", to: "/app/market-demand?view=receivers", materialId: material.id })),
      ...readyToSend.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t booking is ready to dispatch`, action: "Send load", to: "/app/deliveries" })),
      ...holdBookings.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t request is waiting on capacity`, action: "Review booking", to: "/app/bookings" })),
    ];
    return { dataset, holdBookings, upcomingBookings, attentionTasks };
  }, [dataset]);
}

function DashboardHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="relative mb-5 min-h-40 overflow-hidden border border-[#e5e1d8] bg-[#17291e] dark:border-steel-800 sm:min-h-44 rounded-surface">
      <img src={ambientMedia.surveyHero.src} alt={ambientMedia.surveyHero.alt} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/75 to-[#17291e]/20" aria-hidden="true" />
      <div className="relative flex min-h-40 max-w-3xl flex-col justify-end px-5 py-5 text-white sm:min-h-44 sm:px-7 sm:py-6">
        <p className="eyebrow-label text-loop-300">{eyebrow}</p>
        <h1 className="mt-1 font-archivo font-bold tracking-tight gl-page-title">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/85">{description}</p>
      </div>
    </header>
  );
}

function NeedsAttention<T extends { id: string; title: string; action: string; to: string; materialId?: string }>({ tasks, dataset }: { tasks: T[]; dataset: ProviderProps["dataset"] }) {
  return (
    <section className="mb-4 border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-900/10 sm:p-4 rounded-surface">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center border border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 21 19H3L12 3Z" /><path d="M12 9v4M12 16.5h.01" /></svg>
        </span>
        <h2 className="font-archivo text-sm font-bold uppercase tracking-wide text-amber-950 dark:text-amber-200">Needs Attention</h2>
        {tasks.length > 0 && <span className="ledger-numeral text-xs font-semibold text-amber-800 dark:text-amber-300">{tasks.length}</span>}
      </div>
      {tasks.length ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => {
            const material = task.materialId ? dataset.materials.find((item) => item.id === task.materialId) : undefined;
            const media = material ? materialMedia(material)[0] : undefined;
            return (
              <li key={task.id} className="flex min-w-0 items-center gap-3 border border-amber-200 bg-white p-2.5 dark:border-amber-900/50 dark:bg-white/[0.03] rounded-surface">
                {media ? (
                  <img src={media.src} alt={media.caption} className="size-12 shrink-0 border border-steel-200 object-cover dark:border-steel-800" />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-snug text-ink-900 dark:text-white">{task.title}</p>
                  <Link to={task.to} state={task.materialId ? { materialId: task.materialId } : {}} className="mt-1.5 inline-flex min-h-7 items-center bg-ink-900 px-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900">
                    {task.action} <span className="ml-1" aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border border-amber-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-steel-700 dark:border-amber-900/50 dark:bg-white/[0.02] dark:text-amber-200/80 rounded-surface">All operations are running smoothly. Nothing needs immediate action.</p>
      )}
    </section>
  );
}

const PROVIDER_KPIS = ["materials", "verified", "dispatch", "bookings"] as const;

function ProviderDashboard() {
  const { dataset, holdBookings, upcomingBookings, attentionTasks } = useProviderDashboardData();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "overview");

  const flowSurveyed = dataset.materials.reduce((total, material) => total + material.quantityT, 0);
  const flowVerified = dataset.verifications.filter((record) => record.status === "verified").reduce((total, record) => total + record.acceptedT, 0);
  const dispatchedBookingIds = new Set(
    dataset.events.filter((event) => event.kind === "load.dispatched").flatMap((event) => event.subjectIds.filter((id) => dataset.bookings.some((booking) => booking.id === id))),
  );
  const dispatchedTotal = dataset.bookings.filter((booking) => dispatchedBookingIds.has(booking.id)).reduce((total, booking) => total + booking.tonnesT, 0);
  const activeBookingCount = dataset.bookings.filter((booking) => booking.status === "confirmed" || booking.status === "hold" || booking.status === "pending").length;
  const activeProject = dataset.projects[0];
  const projectMaterials = dataset.materials.filter((m) => m.projectId === activeProject?.id);
  const capacitySlots = dataset.slots.filter((slot) => slot.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;
  const projectName = (id: string) => dataset.projects.find((p) => p.id === id)?.name ?? id;
  const materialProject = (materialId: string) => dataset.materials.find((m) => m.id === materialId)?.projectId ?? "";
  const typeTotals = new Map<string, number>();
  for (const m of dataset.materials) typeTotals.set(m.type, (typeTotals.get(m.type) ?? 0) + m.quantityT);
  const grandTotal = [...typeTotals.values()].reduce((a, b) => a + b, 0);
  const kpiValues = [flowSurveyed, flowVerified, dispatchedTotal, dataset.bookings.length];

  return (
    <div className="relative min-h-screen pb-20">
      <PageMeta title="Dashboard | GreenLoop" description="Your operational dashboard: attention items, analytics and activity." />
      <DashboardHero
        eyebrow="Dashboard"
        title="Operations Dashboard"
        description="Live view of your material, demand, deliveries and recovery — with the analytics that answer what to do next."
      />

      <div className="mb-6 flex gap-1 border border-[#e5e2da] bg-[#fdfcfa] p-1 shadow-sm dark:border-steel-800 dark:bg-[#1a2b21] sm:w-max rounded-surface">
        <button type="button" onClick={() => setActiveTab("overview")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "overview" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Overview</button>
        <button type="button" onClick={() => setActiveTab("bookings")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "bookings" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Bookings</button>
        <button type="button" onClick={() => setActiveTab("deliveries")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "deliveries" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Deliveries</button>
      </div>

      {activeTab === "overview" && (
        <>
          <NeedsAttention tasks={attentionTasks} dataset={dataset} />

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operations summary">
        {PROVIDER_KPIS.map((kind, index) => (
          <KpiCard
            key={kind}
            label={["Material surveyed", "Verified recovery", "Dispatched", "Bookings placed"][index]}
            value={kpiValues[index]}
            decimals={index === 3 ? 0 : 1}
            suffix={index === 3 ? "" : " t"}
            hint={[`${dataset.materials.length} live passports`, `${dataset.verifications.length} verifications logged`, "Loads en route or received", `${activeBookingCount} active now`][index]}
            icon={kind}
            positive={kind === "verified"}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-detail lg:grid-cols-2">
        <CompositionChart dataset={dataset} />
        <RecoveryFlowChart dataset={dataset} />
        <ReceiverCapacityChart dataset={dataset} />
        <ProjectRecoveryChart dataset={dataset} />
        <PlannedActualChart dataset={dataset} />
        <CapacityTimelineChart dataset={dataset} />
      </div>

      <AdvancedImpactPanel />

      {activeProject && (
        <section className="mt-4 grid gap-detail lg:grid-cols-[1.45fr_1fr]">
          <article className="overflow-hidden border border-[#e5e1d8] bg-white dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
              <div className="min-w-0">
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Active recovery project</p>
                <h2 className="mt-0.5 truncate font-archivo text-lg font-bold uppercase tracking-tight text-ink-900 dark:text-white sm:text-xl">{activeProject.name}</h2>
              </div>
              <Link to="/app/projects" className="shrink-0 text-xs font-bold uppercase tracking-wide text-loop-800 hover:text-loop-600 dark:text-loop-300 dark:hover:text-loop-200 sm:text-xs">
                View all projects <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="relative mx-4 h-36 overflow-hidden border border-steel-200 sm:mx-5 sm:h-40 dark:border-steel-800">
              <img src={projectMediaFor(activeProject).src} alt={projectMediaFor(activeProject).alt} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#13251b]/80 via-transparent to-transparent" aria-hidden="true" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-end justify-between gap-2">
                <span className="border border-white/25 bg-[#17291e]/85 px-2.5 py-1 text-xs font-medium text-white rounded-surface">{activeProject.location}</span>
                <ProjectStatusChip status={activeProject.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-detail px-4 py-3 sm:grid-cols-3 sm:px-5">
              <ProjectMetric label="Surveyed volume" value={`${projectMaterials.reduce((acc, material) => acc + material.quantityT, 0).toFixed(1)} t`} />
              <ProjectMetric label="Material types" value={String(new Set(projectMaterials.map((material) => material.type)).size)} />
              <ProjectMetric label="Passports" value={String(projectMaterials.length)} />
            </div>
          </article>

          <article className="flex flex-col border border-[#e5e1d8] bg-white dark:border-steel-800 dark:bg-white/[0.02] gl-card-pad rounded-surface">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Project workflow</p>
                <h2 className="mt-0.5 font-archivo text-base font-bold uppercase tracking-wide text-ink-900 dark:text-white">Current stage</h2>
              </div>
              <span className="text-xs font-medium text-steel-500 dark:text-steel-400">Live passports</span>
            </div>
            <RecoveryFlow dataset={dataset} />
            <div className="mt-auto border-t border-steel-100 pt-3 dark:border-steel-800">
              <Link to="/app/materials/new" className="inline-flex min-h-10 w-full items-center justify-center gap-2 bg-[#315c3d] px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#254a30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-loop-600">
                <span aria-hidden="true" className="text-base leading-none">+</span> New Survey
              </Link>
            </div>
          </article>
        </section>
      )}

      <DashboardColumns dataset={dataset} capacitySlots={capacitySlots} holdBookings={holdBookings} upcomingBookings={upcomingBookings} receiverName={receiverName} projectName={projectName} materialProject={materialProject} />

      <MaterialBreakdown typeTotals={typeTotals} grandTotal={grandTotal} />

      <section className="mt-4 border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] sm:p-4 rounded-surface">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Operations log</p>
            <h2 className="mt-0.5 font-archivo text-base font-bold uppercase tracking-wide text-ink-900 dark:text-white">Recent Activity</h2>
          </div>
          <span className="text-xs font-medium text-steel-500 dark:text-steel-400">Latest events</span>
        </div>
        <EventLog events={dataset.events} limit={6} />
      </section>
        </>
      )}

      {activeTab === "bookings" && <Bookings />}
      {activeTab === "deliveries" && <Deliveries />}
    </div>
  );
}

function ProjectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-s-2 border-steel-200 pl-2.5 dark:border-steel-700">
      <p className="eyebrow-label truncate text-steel-500 dark:text-steel-400">{label}</p>
      <p className="ledger-numeral mt-0.5 truncate text-sm font-bold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}

function SectionHeading({ title, to, action }: { title: string; to: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-archivo text-sm font-bold uppercase tracking-wide text-ink-900 dark:text-white">{title}</h2>
      <Link to={to} className="shrink-0 text-xs font-bold uppercase tracking-wide text-loop-800 hover:text-loop-600 dark:text-loop-300 dark:hover:text-loop-200 sm:text-xs">
        {action} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function DashboardColumns({
  dataset,
  capacitySlots,
  holdBookings,
  upcomingBookings,
  receiverName,
  projectName,
  materialProject,
}: {
  dataset: ProviderProps["dataset"];
  capacitySlots: ProviderProps["dataset"]["slots"];
  holdBookings: ProviderProps["dataset"]["bookings"];
  upcomingBookings: ProviderProps["dataset"]["bookings"];
  receiverName: (id: string) => string;
  projectName: (id: string) => string;
  materialProject: (materialId: string) => string;
}) {
  const materialName = (id: string) => materialTypeLabel(dataset.materials.find((m) => m.id === id)?.type ?? "");
  return (
    <div className="mt-4 grid grid-cols-1 gap-detail xl:grid-cols-[1fr_1.2fr_1fr]">
      <section className="border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
        <SectionHeading title="Recent Passports" to="/app/materials" action="All materials" />
        <ul className="mt-3 space-y-2">
          {dataset.materials.slice(0, 3).map((material) => {
            const media = materialMedia(material);
            return (
              <li key={material.id}>
                <Link to={`/app/materials/${material.id}`} className="group flex min-w-0 items-center gap-2.5 border border-steel-200 p-2 transition-colors hover:border-loop-500 dark:border-steel-800 dark:hover:border-loop-500">
                  <span className="size-11 shrink-0 overflow-hidden border border-steel-200 bg-steel-100 dark:border-steel-800 dark:bg-steel-900">
                    {media[0] ? <img src={media[0].src} className="size-full object-cover" alt={media[0].caption} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-archivo text-xs font-bold uppercase text-ink-900 dark:text-white">{materialTypeLabel(material.type)}</span>
                    <span className="mt-0.5 block text-xs text-steel-600 dark:text-steel-400"><span className="ledger-numeral font-semibold text-ink-900 dark:text-gray-200">{material.quantityT.toFixed(1)} t</span> · <span className="capitalize">{material.condition}</span></span>
                  </span>
                  <StatusBadge status={material.status} />
                  <span className="text-steel-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true">›</span>
                </Link>
              </li>
            );
          })}
          {dataset.materials.length === 0 && <li className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No material passports recorded.</li>}
        </ul>
      </section>

      <section className="border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
        <SectionHeading title="Network Capacity" to="/app/market-demand?view=receivers" action="Find receivers" />
        <p className="mt-1 text-xs text-steel-600 dark:text-steel-400">Real-time receiving capacity for tracked facilities.</p>
        <div className="mt-3">
          {capacitySlots.length > 0 ? (
            <div className="mt-2 space-y-3">
              {capacitySlots.map((slot) => {
                const ledger = slotLedger(dataset, slot.id);
                if (!ledger) return null;
                return <div key={slot.id} className="border border-steel-100 p-2.5 dark:border-steel-800">
                  <h3 className="text-xs font-bold text-ink-900 dark:text-white">{receiverName(slot.receiverId)}</h3>
                  <div className="mb-2 mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-ink-900 dark:text-white/90">{formatDate(slot.date)} intake</p>
                    <Badge color={ledger.available > 0 ? "success" : "warning"} size="sm">{ledger.available.toFixed(1)} t</Badge>
                  </div>
                  <CapacityBar capacityT={slot.capacityT} reservedT={ledger.reserved} heldT={ledger.heldT} />
                </div>;
              })}
            </div>
          ) : (
            <p className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No capacity slots available.</p>
          )}
        </div>
        {holdBookings.length > 0 && (
          <div className="mt-3 border-s-2 border-amber-500 bg-amber-50 px-3 py-2 dark:bg-amber-900/10">
            <p className="eyebrow-label text-amber-700 dark:text-amber-300">On hold due to capacity</p>
            <p className="mt-1 text-xs font-semibold text-ink-900 dark:text-amber-100">{holdBookings[0].tonnesT.toFixed(1)} t {materialName(holdBookings[0].materialId)}</p>
            <Link to="/app/bookings" className="mt-1 inline-flex text-xs font-bold uppercase tracking-wide text-ink-900 underline underline-offset-2 dark:text-white">Manage booking</Link>
          </div>
        )}
      </section>

      <section className="border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
        <SectionHeading title="Upcoming Deliveries" to="/app/deliveries" action="All deliveries" />
        <ul className="mt-3 space-y-2">
          {upcomingBookings.slice(0, 3).map((booking) => {
            const material = dataset.materials.find((item) => item.id === booking.materialId);
            const media = material ? materialMedia(material) : [];
            return (
              <li key={booking.id} className="flex items-center gap-2.5 border border-steel-200 p-2 dark:border-steel-800">
                <span className="size-11 shrink-0 overflow-hidden border border-steel-200 bg-steel-100 dark:border-steel-800 dark:bg-steel-900">
                  {media[0] ? <img src={media[0].src} className="size-full object-cover" alt={media[0].caption} /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-steel-500 dark:text-steel-400">{projectName(materialProject(booking.materialId))}</p>
                  <p className="truncate text-xs font-bold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t {materialName(booking.materialId)}</p>
                  <p className="mt-0.5 truncate text-xs text-steel-600 dark:text-steel-400">To: {receiverName(booking.receiverId)} · {booking.slotId}</p>
                </div>
                <StatusBadge status={booking.status} />
              </li>
            );
          })}
          {upcomingBookings.length === 0 && <li className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No upcoming deliveries.</li>}
        </ul>
      </section>
    </div>
  );
}

function MaterialBreakdown({ typeTotals, grandTotal }: { typeTotals: Map<string, number>; grandTotal: number }) {
  if (typeTotals.size === 0) return null;
  const rows = [...typeTotals.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <section className="mt-6" aria-label="Material breakdown">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-steel-200 pb-4 dark:border-steel-800">
        <div>
          <h2 className="font-archivo text-lg font-bold tracking-tight text-ink-900 dark:text-white">Material in the system</h2>
          <p className="mt-1 text-sm text-steel-500 dark:text-gray-400">Live tonnage by type — every tile links to the passport library.</p>
        </div>
        <p className="ledger-numeral text-2xl font-bold text-ink-900 dark:text-white">{grandTotal.toFixed(1)} t</p>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-detail sm:grid-cols-3 lg:grid-cols-6">
        {rows.map(([type, tonnes]) => {
          const media = materialMediaFor(type);
          return (
            <li key={type}>
              <Link to="/app/materials" className="group block">
                <MediaPanel media={media} aspect="aspect-[4/3]" caption={materialTypeLabel(type)} />
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="font-archivo text-sm font-bold capitalize text-ink-900 dark:text-white">{materialTypeLabel(type)}</span>
                  <span className="ledger-numeral text-sm font-bold text-steel-600 dark:text-gray-400">{tonnes.toFixed(1)} t</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const RECEIVER_KPIS = ["materials", "verified", "dispatch", "bookings"] as const;

function useReceiverDashboardData() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  return useMemo(() => {
    const receiverId = user?.receiverId ?? "";
    const myDemands = dataset.demands.filter((demand) => demand.receiverId === receiverId);
    const openDemands = myDemands.filter((demand) => demand.status === "OPEN" || demand.status === "PARTIALLY_COVERED");
    const pendingOffers = (dataset.offers ?? []).filter((offer) => offer.status === "pending" && myDemands.some((demand) => demand.id === offer.demandId));
    const futureSlots = dataset.slots.filter((slot) => slot.receiverId === receiverId && slot.date >= new Date().toISOString().slice(0, 10));
    const capacityAvailableT = futureSlots.reduce((total, slot) => total + (slotLedger(dataset, slot.id)?.available ?? 0), 0);
    const acceptedT = dataset.verifications.filter((record) => record.receiverId === receiverId && record.status === "verified").reduce((total, record) => total + record.acceptedT, 0);
    const upcomingDeliveries = dataset.bookings.filter((booking) => booking.receiverId === receiverId && booking.status !== "cancelled").slice(0, 6);
    const readyToReceive = upcomingDeliveries.filter((booking) => booking.status === "confirmed" && dataset.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id)));
    const holdsOnCapacity = upcomingDeliveries.filter((booking) => booking.status === "hold");
    const pendingVerifications = dataset.verifications.filter((record) => record.receiverId === receiverId && record.status === "pending");
    const attentionTasks = [
      ...pendingOffers.map((offer) => ({ id: offer.id, title: `${offer.offeredQuantityT.toFixed(1)} t offer is waiting for your decision`, action: "Review offer", to: `/app/receiver/demand?demand=${encodeURIComponent(offer.demandId)}` })),
      ...readyToReceive.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t load is on its way`, action: "Track delivery", to: "/app/receiver/deliveries" })),
      ...holdsOnCapacity.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t request is waiting on capacity`, action: "Add capacity", to: "/app/receiver/demand?capacity=1" })),
      ...pendingVerifications.map((record) => ({ id: record.id, title: `Weighbridge check for ${record.loadRef ?? "a load"} is incomplete`, action: "Check & accept", to: "/app/receiver/verification" })),
    ];
    return { dataset, myDemands, openDemands, pendingOffers, capacityAvailableT, acceptedT, upcomingDeliveries, attentionTasks };
  }, [dataset, user?.receiverId]);
}

function ReceiverDashboard() {
  const { dataset, myDemands, openDemands, pendingOffers, capacityAvailableT, acceptedT, upcomingDeliveries, attentionTasks } = useReceiverDashboardData();
  const receiverId = useReceiverId();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") ?? "overview");
  const kpiValues = [openDemands.length, pendingOffers.length, capacityAvailableT, acceptedT];

  return (
    <div className="relative min-h-screen pb-20">
      <PageMeta title="Dashboard | GreenLoop" description="Your receiver operations dashboard: requests, offers, capacity and deliveries." />
      <DashboardHero
        eyebrow="Dashboard"
        title="Receiving Dashboard"
        description="Requests, incoming offers, capacity and verified recovery for your facility — in one operational view."
      />

      <div className="mb-6 flex gap-1 border border-[#e5e2da] bg-[#fdfcfa] p-1 shadow-sm dark:border-steel-800 dark:bg-[#1a2b21] sm:w-max rounded-surface">
        <button type="button" onClick={() => setActiveTab("overview")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "overview" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Overview</button>
        <button type="button" onClick={() => setActiveTab("bookings")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "bookings" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Bookings</button>
        <button type="button" onClick={() => setActiveTab("deliveries")} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${activeTab === "deliveries" ? "bg-white text-[#26362c] shadow dark:bg-[#2c4233] dark:text-white" : "text-[#7c857d] hover:bg-white/50 hover:text-[#26362c] dark:text-gray-400 dark:hover:bg-[#2c4233]/50 dark:hover:text-white"}`}>Deliveries</button>
      </div>

      {activeTab === "overview" && (
        <>
          <NeedsAttention tasks={attentionTasks} dataset={dataset} />

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Receiving summary">
        {RECEIVER_KPIS.map((kind, index) => (
          <KpiCard
            key={kind}
            label={["Open requests", "Incoming offers", "Receiving capacity free", "Verified recovery"][index]}
            value={kpiValues[index]}
            decimals={index >= 2 ? 1 : 0}
            suffix={index >= 2 ? " t" : ""}
            hint={[`${myDemands.length} requests total`, "Offers waiting on a decision", "Across your upcoming slots", `${dataset.verifications.length} verifications logged`][index]}
            icon={kind}
            positive={index === 3}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-detail lg:grid-cols-2">
        <RecoveryFlowChart dataset={dataset} />
        <CompositionChart dataset={dataset} />
        <ReceiverCapacityChart dataset={dataset} />
        <ProjectRecoveryChart dataset={dataset} />
        <PlannedActualChart dataset={dataset} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-detail xl:grid-cols-3">
        <section className="border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
          <SectionHeading title="My Material Requests" to="/app/receiver/demand" action="Request material" />
          <ul className="mt-3 space-y-2">
            {openDemands.slice(0, 3).map((demand) => {
              const coveredT = dataset.bookings.filter((booking) => booking.demandId === demand.id && booking.status === "confirmed").reduce((sum, booking) => sum + booking.tonnesT, 0);
              return (
                <li key={demand.id}>
                  <Link to={`/app/receiver/demand?demand=${encodeURIComponent(demand.id)}`} className="group flex min-w-0 items-center gap-2.5 border border-steel-200 p-2 transition-colors hover:border-loop-500 dark:border-steel-800 dark:hover:border-loop-500">
                    <span className="size-11 shrink-0 overflow-hidden border border-steel-200 bg-steel-100 dark:border-steel-800 dark:bg-steel-900">
                      <img src={materialMediaFor(demand.materialType).src} alt={materialMediaFor(demand.materialType).alt} className="size-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-archivo text-xs font-bold uppercase text-ink-900 dark:text-white">{materialTypeLabel(demand.materialType)}</span>
                      <span className="mt-0.5 block text-xs text-steel-600 dark:text-steel-400"><span className="ledger-numeral font-semibold text-ink-900 dark:text-gray-200">{coveredT.toFixed(1)}</span> of {demand.requiredT.toFixed(1)} t covered · {formatDate(demand.period)}</span>
                    </span>
                    <StatusBadge status={demand.status} />
                  </Link>
                </li>
              );
            })}
            {openDemands.length === 0 && <li className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No open requests — publish one from Request Material.</li>}
          </ul>
        </section>

        <section className="border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
          <SectionHeading title="Receiving Capacity" to="/app/receiver/demand?capacity=1" action="Manage capacity" />
          <div className="mt-3 space-y-3">
            {dataset.slots.filter((slot) => slot.receiverId === receiverId).slice(0, 3).map((slot) => {
              const ledger = slotLedger(dataset, slot.id);
              if (!ledger) return null;
              return (
                <div key={slot.id} className="border border-steel-100 p-2.5 dark:border-steel-800">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-ink-900 dark:text-white">{materialTypeLabel(slot.materialType)} · {formatDate(slot.date)}</p>
                    <Badge color={ledger.available > 0 ? "success" : "warning"} size="sm">{ledger.available.toFixed(1)} t free</Badge>
                  </div>
                  <CapacityBar capacityT={slot.capacityT} reservedT={ledger.reserved} heldT={ledger.heldT} />
                </div>
              );
            })}
            {dataset.slots.filter((slot) => slot.receiverId === receiverId).length === 0 && <p className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No capacity scheduled — add intake to accept offers.</p>}
          </div>
        </section>

        <section className="border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] rounded-surface">
          <SectionHeading title="Upcoming Deliveries" to="/app/receiver/deliveries" action="All deliveries" />
          <ul className="mt-3 space-y-2">
            {upcomingDeliveries.slice(0, 3).map((booking) => {
              const material = dataset.materials.find((item) => item.id === booking.materialId);
              return (
                <li key={booking.id} className="flex items-center gap-2.5 border border-steel-200 p-2 dark:border-steel-800">
                  <span className="size-11 shrink-0 overflow-hidden border border-steel-200 bg-steel-100 dark:border-steel-800 dark:bg-steel-900">
                    <img src={materialMediaFor(material?.type ?? "").src} alt={materialMediaFor(material?.type ?? "").alt} className="size-full object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t {materialTypeLabel(material?.type ?? "")}</p>
                    <p className="mt-0.5 truncate text-xs text-steel-600 dark:text-steel-400">Slot {booking.slotId}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </li>
              );
            })}
            {upcomingDeliveries.length === 0 && <li className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No upcoming deliveries.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-4 border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] sm:p-4 rounded-surface">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Operations log</p>
            <h2 className="mt-0.5 font-archivo text-base font-bold uppercase tracking-wide text-ink-900 dark:text-white">Recent Activity</h2>
          </div>
          <span className="text-xs font-medium text-steel-500 dark:text-steel-400">Latest events</span>
        </div>
        <EventLog events={dataset.events} limit={6} />
      </section>
        </>
      )}

      {activeTab === "bookings" && <Bookings />}
      {activeTab === "deliveries" && <ReceiverDeliveriesPage />}
    </div>
  );
}

function useReceiverId() {
  const { user } = useAuth();
  return user?.receiverId ?? "";
}
