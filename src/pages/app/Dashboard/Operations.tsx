import CapacityBar from "@/components/greenloop/CapacityBar";
import EventLog from "@/components/greenloop/EventLog";
import RecoveryFlow from "@/components/greenloop/RecoveryFlow";
import StatusBadge from "@/components/greenloop/StatusBadge";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import { slotLedger } from "@/domain/capacity";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { formatDate } from "@/utils";
import { ProjectStatusChip, materialMedia } from "@/components/greenloop/AppExploration";
import { ambientMedia, projectMediaFor } from "@/config/appMedia";
import { cn } from "@/utils";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

export default function Operations() {
  const { dataset } = useGreenLoopStore();

  const holdBookings = dataset.bookings.filter((b) => b.status === "hold");
  const upcomingBookings = dataset.bookings.filter((b) => b.status !== "cancelled").slice(0, 6);
  const readyToSend = dataset.bookings.filter((booking) => booking.status === "confirmed" && booking.receiverAcceptedAt && !booking.loadRef);
  const unassignedMaterials = dataset.materials.filter((material) => material.status !== "verified" && material.status !== "dispatched" && !dataset.allocations.some((allocation) => allocation.materialId === material.id && allocation.status !== "cancelled"));

  const attentionTasks: Array<{ id: string; title: string; action: string; to: string; materialId?: string }> = [
    ...unassignedMaterials.map((material) => ({ id: material.id, title: `${material.quantityT.toFixed(1)} t ${material.type} needs a receiver`, action: "Find receiver", to: "/app/receivers", materialId: material.id })),
    ...readyToSend.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t booking is ready to dispatch`, action: "Send load", to: "/app/deliveries" })),
    ...holdBookings.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t request is waiting on capacity`, action: "Review booking", to: "/app/bookings" })),
  ];

  const activeProject = dataset.projects[0];
  const projectMaterials = dataset.materials.filter((m) => m.projectId === activeProject?.id);

  const capacitySlots = dataset.slots.filter(slot => slot.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
  const surveyedTotal = dataset.materials.reduce((total, material) => total + material.quantityT, 0);
  const verifiedTotal = dataset.verifications.filter((record) => record.status === "verified").reduce((total, record) => total + record.acceptedT, 0);
  const dispatchedBookingIds = new Set(
    dataset.events.filter((event) => event.kind === "load.dispatched").flatMap((event) => event.subjectIds.filter((id) => dataset.bookings.some((booking) => booking.id === id))),
  );
  const dispatchedTotal = dataset.bookings.filter((booking) => dispatchedBookingIds.has(booking.id)).reduce((total, booking) => total + booking.tonnesT, 0);
  const activeBookingCount = dataset.bookings.filter((booking) => booking.status === "confirmed" || booking.status === "hold" || booking.status === "pending").length;
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;
  const materialName = (id: string) => TYPE_LABEL[dataset.materials.find((m) => m.id === id)?.type ?? ""] ?? dataset.materials.find((m) => m.id === id)?.type ?? id;
  const projectName = (id: string) => dataset.projects.find((p) => p.id === id)?.name ?? id;
  const materialProject = (materialId: string) => dataset.materials.find((m) => m.id === materialId)?.projectId ?? "";

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 pb-16">
      <PageMeta
        title="Operations | GreenLoop"
        description="GreenLoop circular material recovery operations dashboard."
      />

      <header className="relative min-h-40 overflow-hidden rounded-xl border border-[#e5e1d8] bg-[#17291e] sm:min-h-44 dark:border-steel-800">
        <img src={ambientMedia.surveyHero.src} alt={ambientMedia.surveyHero.alt} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/75 to-[#17291e]/20" aria-hidden="true" />
        <div className="relative flex min-h-40 max-w-3xl flex-col justify-end px-5 py-5 text-white sm:min-h-44 sm:px-7 sm:py-6">
          <p className="eyebrow-label text-loop-300">Operations console</p>
          <h1 className="mt-1 font-archivo text-3xl font-bold tracking-tight sm:text-4xl">Operations console</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/85">
            Get a real-time view of your projects, materials, deliveries and recovery operations.
          </p>
        </div>
      </header>

      <section className="border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-900/10 sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center border border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 21 19H3L12 3Z" /><path d="M12 9v4M12 16.5h.01" /></svg>
          </span>
          <h2 className="font-archivo text-sm font-bold uppercase tracking-wide text-amber-950 dark:text-amber-200">Needs Attention</h2>
          {attentionTasks.length > 0 && <span className="ledger-numeral text-xs font-semibold text-amber-800 dark:text-amber-300">{attentionTasks.length}</span>}
        </div>
        {attentionTasks.length ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {attentionTasks.map((task) => {
              const material = task.materialId ? dataset.materials.find((item) => item.id === task.materialId) : undefined;
              const media = material ? materialMedia(material)[0] : undefined;
              return (
                <li key={task.id} className="flex min-w-0 items-center gap-3 border border-amber-200 bg-white p-2.5 dark:border-amber-900/50 dark:bg-white/[0.03]">
                  {media ? (
                    <img src={media.src} alt={media.caption} className="size-12 shrink-0 border border-steel-200 object-cover dark:border-steel-800" />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300" aria-hidden="true">
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-snug text-ink-900 dark:text-white">{task.title}</p>
                    <Link to={task.to} state={task.materialId ? { materialId: task.materialId } : {}} className="mt-1.5 inline-flex min-h-7 items-center bg-ink-900 px-2.5 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900">
                      {task.action} <span className="ml-1" aria-hidden="true">→</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border border-amber-200/80 bg-white/70 px-3 py-2 text-sm font-medium text-steel-700 dark:border-amber-900/50 dark:bg-white/[0.02] dark:text-amber-200/80">All operations are running smoothly. Nothing needs immediate action.</p>
        )}
      </section>

      {activeProject && (
        <section className="grid gap-3 lg:grid-cols-[1.45fr_1fr]">
          <article className="overflow-hidden rounded-lg border border-[#e5e1d8] bg-white dark:border-steel-800 dark:bg-white/[0.02]">
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
              <div className="min-w-0">
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Active recovery project</p>
                <h2 className="mt-0.5 truncate font-archivo text-lg font-bold uppercase tracking-tight text-ink-900 dark:text-white sm:text-xl">{activeProject.name}</h2>
              </div>
              <Link to="/app/projects" className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-loop-800 hover:text-loop-600 dark:text-loop-300 dark:hover:text-loop-200 sm:text-xs">
                View all projects <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="relative mx-4 h-36 overflow-hidden border border-steel-200 sm:mx-5 sm:h-40 dark:border-steel-800">
              <img src={projectMediaFor(activeProject).src} alt={projectMediaFor(activeProject).alt} className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#13251b]/80 via-transparent to-transparent" aria-hidden="true" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-end justify-between gap-2">
                <span className="border border-white/25 bg-[#17291e]/85 px-2.5 py-1 text-xs font-medium text-white">{activeProject.location}</span>
                <ProjectStatusChip status={activeProject.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:grid-cols-3 sm:px-5">
              <ProjectMetric label="Surveyed volume" value={`${projectMaterials.reduce((acc, material) => acc + material.quantityT, 0).toFixed(1)} t`} />
              <ProjectMetric label="Material types" value={String(new Set(projectMaterials.map((material) => material.type)).size)} />
              <ProjectMetric label="Passports" value={String(projectMaterials.length)} />
            </div>
          </article>

          <article className="flex flex-col rounded-lg border border-[#e5e1d8] bg-white p-4 sm:p-5 dark:border-steel-800 dark:bg-white/[0.02]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Project workflow</p>
                <h2 className="mt-0.5 font-archivo text-base font-bold uppercase tracking-wide text-ink-900 dark:text-white">Current stage</h2>
              </div>
              <span className="text-[10px] font-medium text-steel-500 dark:text-steel-400">Live passports</span>
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

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operations summary">
        <KpiCard label="Material surveyed" value={surveyedTotal.toFixed(1)} suffix=" t" hint={`${dataset.materials.length} live passports`} icon="materials" />
        <KpiCard label="Verified recovery" value={verifiedTotal.toFixed(1)} suffix=" t" hint={`${dataset.verifications.length} verifications logged`} icon="verified" positive />
        <KpiCard label="Dispatched" value={dispatchedTotal.toFixed(1)} suffix=" t" hint="Loads en route or received" icon="dispatch" />
        <KpiCard label="Bookings placed" value={String(dataset.bookings.length)} hint={`${activeBookingCount} active now`} icon="bookings" />
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1.2fr_1fr]">
        <section className="rounded-lg border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02]">
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
                      <span className="block truncate font-archivo text-xs font-bold uppercase text-ink-900 dark:text-white">{TYPE_LABEL[material.type] ?? material.type}</span>
                      <span className="mt-0.5 block text-[10px] text-steel-600 dark:text-steel-400"><span className="ledger-numeral font-semibold text-ink-900 dark:text-gray-200">{material.quantityT.toFixed(1)} t</span> · <span className="capitalize">{material.condition}</span></span>
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

        <section className="rounded-lg border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02]">
          <SectionHeading title="Network Capacity" to="/app/receivers" action="Find receivers" />
          <p className="mt-1 text-[11px] text-steel-600 dark:text-steel-400">Real-time receiving capacity for tracked facilities.</p>
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
              <Link to="/app/bookings" className="mt-1 inline-flex text-[10px] font-bold uppercase tracking-wide text-ink-900 underline underline-offset-2 dark:text-white">Manage booking</Link>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02]">
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
                    <p className="truncate text-[10px] font-medium text-steel-500 dark:text-steel-400">{projectName(materialProject(booking.materialId))}</p>
                    <p className="truncate text-xs font-bold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t {materialName(booking.materialId)}</p>
                    <p className="mt-0.5 truncate text-[10px] text-steel-600 dark:text-steel-400">To: {receiverName(booking.receiverId)} · {booking.slotId}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </li>
              );
            })}
            {upcomingBookings.length === 0 && <li className="border border-dashed border-steel-300 px-3 py-6 text-center text-xs text-steel-500 dark:border-steel-700">No upcoming deliveries.</li>}
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-[#e5e1d8] bg-white p-3.5 dark:border-steel-800 dark:bg-white/[0.02] sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Operations log</p>
            <h2 className="mt-0.5 font-archivo text-base font-bold uppercase tracking-wide text-ink-900 dark:text-white">Recent Activity</h2>
          </div>
          <span className="text-[10px] font-medium text-steel-500 dark:text-steel-400">Latest events</span>
        </div>
        <EventLog events={dataset.events} limit={6} />
      </section>
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

function KpiCard({
  label,
  value,
  suffix = "",
  hint,
  icon,
  positive = false,
}: {
  label: string;
  value: string;
  suffix?: string;
  hint: string;
  icon: "materials" | "verified" | "dispatch" | "bookings";
  positive?: boolean;
}) {
  return (
    <article className={cn("flex min-w-0 items-center gap-3 rounded-lg border bg-white px-3 py-3 dark:bg-white/[0.02]", positive ? "border-loop-200 dark:border-loop-700/50" : "border-[#e5e1d8] dark:border-steel-800")}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center border", positive ? "border-loop-200 bg-loop-50 text-loop-800 dark:border-loop-700/50 dark:bg-loop-900/30 dark:text-loop-300" : "border-steel-200 bg-steel-50 text-ink-800 dark:border-steel-700 dark:bg-white/[0.03] dark:text-steel-300")}>
        <KpiIcon kind={icon} />
      </span>
      <div className="min-w-0">
        <p className="eyebrow-label truncate text-steel-500 dark:text-steel-400">{label}</p>
        <p className="ledger-numeral mt-0.5 text-xl font-bold leading-none text-ink-900 dark:text-white">{value}{suffix}</p>
        <p className="mt-1 truncate text-[10px] text-steel-500 dark:text-gray-400">{hint}</p>
      </div>
    </article>
  );
}

function KpiIcon({ kind }: { kind: "materials" | "verified" | "dispatch" | "bookings" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      {kind === "materials" && <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.3 7.6 7.7 4.3 7.7-4.3M12 12v9" /></>}
      {kind === "verified" && <><path d="M12 3 20 6v5.5c0 4.6-3.1 7.8-8 9.5-4.9-1.7-8-4.9-8-9.5V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-4.8" /></>}
      {kind === "dispatch" && <><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></>}
      {kind === "bookings" && <><path d="M6 3.5h12v17H6zM9 7.5h6M9 11.5h6M9 15.5h3" /><path d="M9 3.5v-1M15 3.5v-1" /></>}
    </svg>
  );
}

function SectionHeading({ title, to, action }: { title: string; to: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-archivo text-sm font-bold uppercase tracking-wide text-ink-900 dark:text-white">{title}</h2>
      <Link to={to} className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-loop-800 hover:text-loop-600 dark:text-loop-300 dark:hover:text-loop-200 sm:text-[10px]">
        {action} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
