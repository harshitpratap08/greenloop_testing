import CapacityBar from "@/components/greenloop/CapacityBar";
import EventLog from "@/components/greenloop/EventLog";
import RecoveryFlow from "@/components/greenloop/RecoveryFlow";
import StatusBadge from "@/components/greenloop/StatusBadge";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import { reservedT, slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { formatDate } from "@/utils";
import { ProjectSiteMedia, materialMedia } from "@/components/greenloop/AppExploration";

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

  // Pick the most active project
  const activeProject = dataset.projects[0];
  const projectMaterials = dataset.materials.filter((m) => m.projectId === activeProject?.id);

  const scenarioLedger = slotLedger(dataset, STORY.concreteSlotSept24);
  const nextSlotLedger = slotLedger(dataset, STORY.concreteSlotSept28);
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;
  const materialName = (id: string) => dataset.materials.find((m) => m.id === id)?.type ?? id;
  const projectName = (id: string) => dataset.projects.find((p) => p.id === id)?.name ?? id;
  const materialProject = (materialId: string) => dataset.materials.find((m) => m.id === materialId)?.projectId ?? "";

  return (
    <div className="mx-auto max-w-[1200px] pb-24 space-y-12">
      <PageMeta
        title="Operations | GreenLoop"
        description="GreenLoop circular material recovery operations dashboard."
      />
      <PageBreadCrumb pageTitle="Operations console" />

      {/* 1. Priority Action */}
      <section className="bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50 p-6 shadow-sm">
        <h2 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-amber-500 mb-4">Needs Attention</h2>
        {attentionTasks.length ? (
          <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {attentionTasks.slice(0, 3).map((task) => (
              <li key={task.id} className="flex flex-col justify-between gap-4 bg-white dark:bg-white/[0.02] border border-amber-200 dark:border-amber-900/50 p-5 shadow-sm">
                <p className="font-semibold text-ink-900 dark:text-white">{task.title}</p>
                <Link to={task.to} state={task.materialId ? { materialId: task.materialId } : {}} className="inline-flex w-fit items-center bg-ink-900 px-6 py-2 text-sm font-bold uppercase tracking-wide text-white hover:bg-amber-500 dark:bg-white dark:text-ink-900">
                  {task.action}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-steel-600 dark:text-amber-200/70 font-medium">All operations are running smoothly. Nothing needs immediate action.</p>
        )}
      </section>

      {/* 2. Active Recovery / Project */}
      {activeProject && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="eyebrow-label text-steel-500">Active Recovery Project</p>
              <h2 className="font-archivo text-3xl font-bold uppercase tracking-tight text-ink-900 dark:text-white mt-1">{activeProject.name}</h2>
            </div>
            <Link to="/app/projects" className="font-bold uppercase text-sm tracking-wider underline underline-offset-4 hover:text-loop-600">All Projects</Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
                <ProjectSiteMedia projectId={activeProject.id} />
                <div className="mt-6 flex flex-wrap gap-8">
                  <div>
                    <p className="eyebrow-label text-steel-500 mb-1">Location</p>
                    <p className="font-medium text-ink-900 dark:text-gray-300">{activeProject.location}</p>
                  </div>
                  <div>
                    <p className="eyebrow-label text-steel-500 mb-1">Surveyed Volume</p>
                    <p className="ledger-numeral font-bold text-ink-900 dark:text-white text-xl">
                      {projectMaterials.reduce((acc, m) => acc + m.quantityT, 0).toFixed(1)} <span className="text-sm text-steel-500">t</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02] flex flex-col">
              <h3 className="font-archivo text-xl font-bold uppercase tracking-tight text-ink-900 dark:text-white mb-6">Current Stage</h3>
              <RecoveryFlow dataset={dataset} />
              <div className="mt-auto pt-6 border-t border-steel-100 dark:border-steel-800/50">
                <Link to="/app/materials/new" className="block text-center border-2 border-ink-900 px-4 py-3 font-bold uppercase tracking-wide hover:bg-ink-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-ink-900">
                  New Survey
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Materials Needing Action & 4. Receiver Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-end justify-between mb-4">
            <h3 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Recent Passports</h3>
            <Link to="/app/materials" className="font-bold uppercase text-sm tracking-wider underline underline-offset-4 hover:text-loop-600">All Materials</Link>
          </div>
          <div className="space-y-4">
            {dataset.materials.slice(0, 3).map(material => {
              const media = materialMedia(material);
              return (
                <div key={material.id} className="flex border border-steel-200 bg-white shadow-sm hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white transition-colors group">
                  <div className="w-32 shrink-0 border-r border-steel-200 dark:border-steel-800 bg-steel-100 dark:bg-steel-900">
                    {media[0] ? <img src={media[0].src} className="size-full object-cover" alt="material" /> : <div className="flex size-full items-center justify-center text-xs text-steel-400">No media</div>}
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-center">
                    <div className="flex justify-between items-start">
                      <h4 className="font-archivo font-bold text-lg uppercase text-ink-900 dark:text-white">{TYPE_LABEL[material.type] ?? material.type}</h4>
                      <StatusBadge status={material.status} />
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-steel-600 dark:text-steel-400"><span className="ledger-numeral font-bold text-ink-900 dark:text-gray-200">{material.quantityT.toFixed(1)}</span> t</span>
                      <span className="text-steel-600 dark:text-steel-400 capitalize">{material.condition}</span>
                    </div>
                    <Link to={`/app/materials/${material.id}`} className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 dark:text-white hover:text-loop-600 group-hover:text-loop-600">View Passport</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-4">
            <h3 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Network Capacity</h3>
            <Link to="/app/receivers" className="font-bold uppercase text-sm tracking-wider underline underline-offset-4 hover:text-loop-600">Find Receivers</Link>
          </div>
          <div className="border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02] h-[calc(100%-2rem)]">
            <h4 className="font-bold text-ink-900 dark:text-white mb-2">{receiverName(STORY.receiverId)}</h4>
            <p className="text-sm text-steel-600 dark:text-steel-400 mb-6">Real-time receiving capacity for tracked facilities.</p>
            
            {scenarioLedger && nextSlotLedger && (
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-ink-900 dark:text-white/90">
                      {formatDate(scenarioLedger.slot.date)} Intake
                    </p>
                    <Badge color="warning" size="sm">Limited</Badge>
                  </div>
                  <CapacityBar
                    capacityT={scenarioLedger.slot.capacityT}
                    reservedT={reservedT(dataset.bookings.filter((b) => b.slotId === scenarioLedger.slot.id))}
                    heldT={scenarioLedger.heldT}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-ink-900 dark:text-white/90">
                      {formatDate(nextSlotLedger.slot.date)} Intake
                    </p>
                    <Badge color="success" size="sm">Available</Badge>
                  </div>
                  <CapacityBar
                    capacityT={nextSlotLedger.slot.capacityT}
                    reservedT={reservedT(dataset.bookings.filter((b) => b.slotId === nextSlotLedger.slot.id))}
                    heldT={nextSlotLedger.heldT}
                  />
                </div>
              </div>
            )}
            
            {holdBookings.length > 0 && (
              <div className="mt-8 border-t border-amber-200 pt-6">
                <p className="eyebrow-label text-amber-600 mb-2">On Hold Due to Capacity</p>
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 border border-amber-200 dark:border-amber-900/50">
                  <p className="font-bold text-sm text-ink-900 dark:text-amber-100">{holdBookings[0].tonnesT.toFixed(1)} t {materialName(holdBookings[0].materialId)}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Cannot reserve slot. Choose another date.</p>
                  <Link to="/app/bookings" className="mt-2 block w-fit text-xs font-bold uppercase underline underline-offset-4">Manage Booking</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. Upcoming Bookings & Deliveries */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h3 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">Upcoming Deliveries</h3>
          <Link to="/app/deliveries" className="font-bold uppercase text-sm tracking-wider underline underline-offset-4 hover:text-loop-600">All Deliveries</Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {upcomingBookings.slice(0, 3).map(booking => {
            const material = dataset.materials.find(m => m.id === booking.materialId);
            const media = material ? materialMedia(material) : [];
            return (
              <div key={booking.id} className="border border-steel-200 bg-white p-5 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="eyebrow-label text-steel-500 mb-1">{projectName(materialProject(booking.materialId))}</p>
                    <p className="font-bold text-ink-900 dark:text-white text-lg">{booking.tonnesT.toFixed(1)} t {materialName(booking.materialId)}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex gap-4 items-center">
                  <div className="size-12 shrink-0 border border-steel-200 dark:border-steel-800 bg-steel-100 dark:bg-steel-900">
                    {media[0] ? <img src={media[0].src} className="size-full object-cover" alt="" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900 dark:text-gray-300">To: {receiverName(booking.receiverId)}</p>
                    <p className="text-xs text-steel-500 mt-1">Slot: {booking.slotId}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Recent Activity */}
      <section>
        <h3 className="font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white mb-6">Recent Activity</h3>
        <div className="border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
          <EventLog events={dataset.events} limit={6} />
        </div>
      </section>
    </div>
  );
}
