import CapacityBar from "@/components/greenloop/CapacityBar";
import EventLog from "@/components/greenloop/EventLog";
import MetricCard from "@/components/greenloop/MetricCard";
import RecoveryFlow from "@/components/greenloop/RecoveryFlow";
import ScenarioActions from "@/components/greenloop/ScenarioActions";
import StatusBadge from "@/components/greenloop/StatusBadge";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import Badge from "@/components/ui/badge/Badge";
import {
  BoxIconLine,
  CheckCircleIcon,
  GroupIcon,
  TaskIcon,
} from "@/icons";
import { reservedT, availableT, findSlot, slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { Link } from "react-router";
import { formatDate } from "@/utils";

export default function Operations() {
  const { dataset } = useGreenLoopStore();

  const recoverableT = dataset.materials
    .filter((m) => m.status !== "verified" && m.status !== "dispatched")
    .reduce((acc, m) => acc + m.quantityT, 0);
  const verifiedT = dataset.verifications.reduce((acc, v) => acc + v.acceptedT, 0);
  const reservedTotalT = dataset.bookings
    .filter((b) => b.status === "confirmed")
    .reduce((acc, b) => acc + b.tonnesT, 0);
  const holdBookings = dataset.bookings.filter((b) => b.status === "hold");
  const readyToSend = dataset.bookings.filter((booking) => booking.status === "confirmed" && booking.receiverAcceptedAt && !booking.loadRef);
  const unassignedMaterials = dataset.materials.filter((material) => material.status !== "verified" && material.status !== "dispatched" && !dataset.allocations.some((allocation) => allocation.materialId === material.id && allocation.status !== "cancelled"));
  const attentionTasks = [
    ...unassignedMaterials.map((material) => ({ id: material.id, title: `${material.quantityT.toFixed(1)} t ${material.type} needs a receiver`, action: "Find receiver", to: "/app/receivers" })),
    ...readyToSend.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t booking is ready`, action: "Send load", to: "/app/deliveries" })),
    ...holdBookings.map((booking) => ({ id: booking.id, title: `${booking.tonnesT.toFixed(1)} t request is waiting on capacity`, action: "Review booking", to: "/app/bookings" })),
  ];

  // Live ledger for the scenario slot + the material each hold blocks.
  const scenarioLedger = slotLedger(dataset, STORY.concreteSlotSept24);
  const nextSlotLedger = slotLedger(dataset, STORY.concreteSlotSept28);
  const materialName = (id: string) => dataset.materials.find((m) => m.id === id)?.type ?? id;
  const projectName = (id: string) => dataset.projects.find((p) => p.id === id)?.name ?? id;
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;
  const materialProject = (materialId: string) =>
    dataset.materials.find((m) => m.id === materialId)?.projectId ?? "";

  return (
    <>
      <PageMeta
        title="Operations | GreenLoop"
        description="GreenLoop circular material recovery operations dashboard."
      />
      <PageBreadCrumb pageTitle="Operations" />

      <div className="space-y-6">
        <section className="surface-card p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-steel-200 pb-4 dark:border-steel-800">
            <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{attentionTasks.length} {attentionTasks.length === 1 ? "thing needs" : "things need"} your attention</h2>
            <p className="text-sm text-steel-500 dark:text-gray-400">Start with the next open task. Operational totals follow.</p>
          </div>
          {attentionTasks.length ? <ul className="mt-4 grid gap-3 lg:grid-cols-3">{attentionTasks.slice(0, 6).map((task) => <li key={task.id} className="flex flex-col justify-between gap-4 rounded-sm border border-steel-200 p-4 dark:border-steel-800"><p className="font-semibold text-ink-900 dark:text-white">{task.title}</p><Link to={task.to} className="inline-flex min-h-11 w-fit items-center bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">{task.action}</Link></li>)}</ul> : <p className="mt-4 text-sm text-steel-600 dark:text-gray-400">Nothing needs action now. Review your project and capacity information below.</p>}
        </section>

        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
          <MetricCard
            label="Active projects"
            value={String(dataset.projects.filter((p) => p.status !== "complete").length)}
            icon={<GroupIcon className="size-6 text-ink-900 dark:text-white/90" />}
            detail={`${dataset.projects.length} managed projects`}
          />
          <MetricCard
            label="Recoverable material"
            value={recoverableT.toFixed(1)}
            unit="t"
            icon={<BoxIconLine className="size-6 text-ink-900 dark:text-white/90" />}
            detail="Surveyed passports awaiting verification"
          />
          <MetricCard
            label="Reserved capacity"
            value={reservedTotalT.toFixed(1)}
            unit="t"
            icon={<TaskIcon className="size-6 text-ink-900 dark:text-white/90" />}
            detail="Confirmed receiver bookings"
          />
          <MetricCard
            label="Verified recovery"
            value={verifiedT.toFixed(1)}
            unit="t"
            icon={<CheckCircleIcon className="size-6 text-loop-600 dark:text-loop-400" />}
            detail={`${dataset.verifications.length} verified load${dataset.verifications.length === 1 ? "" : "s"}`}
          />
        </div>

        {/* Recovery flow */}
        <section className="surface-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
              Material recovery flow
            </h3>
            <span className="eyebrow-label text-steel-600 dark:text-steel-400">
              Survey → Match → Reserve → Dispatch → Verify
            </span>
          </div>
          <RecoveryFlow dataset={dataset} />
        </section>

        {/* Receiver capacity + scenario controls */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="surface-card p-5 md:p-6">
            <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
              Receiver capacity — {receiverName(STORY.receiverId)}
            </h3>
            {scenarioLedger && nextSlotLedger && (
              <div className="mt-4 space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-theme-sm font-medium text-ink-900 dark:text-white/90">
                      Concrete intake · {formatDate(scenarioLedger.slot.date)}
                    </p>
                    <Badge color="success" size="sm">
                      In use
                    </Badge>
                  </div>
                  <CapacityBar
                    capacityT={scenarioLedger.slot.capacityT}
                    reservedT={reservedT(dataset.bookings.filter((b) => b.slotId === scenarioLedger.slot.id))}
                    heldT={scenarioLedger.heldT}
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-theme-sm font-medium text-ink-900 dark:text-white/90">
                      Concrete intake · {formatDate(nextSlotLedger.slot.date)}
                    </p>
                    <Badge color="info" size="sm">
                      Open
                    </Badge>
                  </div>
                  <CapacityBar
                    capacityT={nextSlotLedger.slot.capacityT}
                    reservedT={reservedT(dataset.bookings.filter((b) => b.slotId === nextSlotLedger.slot.id))}
                    heldT={nextSlotLedger.heldT}
                  />
                </div>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Available now:{" "}
                  <span className="ledger-numeral">
                    {availableT(
                      findSlot(dataset, STORY.concreteSlotSept28)!,
                      dataset.bookings,
                    ).toFixed(1)}{" "}
                    t
                  </span>{" "}
                  on Sep 28. A 9 t request into 7 t waits for capacity — try it below.
                </p>
              </div>
            )}
          </section>

          <ScenarioActions />
        </div>

        {/* Requests waiting on capacity */}
        <section className="surface-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">Requests waiting on capacity</h3>
            <Link to="/app/allocations" className="text-theme-sm font-medium text-ink-900 underline dark:text-white">
              View matches
            </Link>
          </div>
          {holdBookings.length === 0 ? (
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              No requests are waiting on capacity. Replaying the scenario will show one here with its reason.
            </p>
          ) : (
            <ul className="space-y-3">
              {holdBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="rounded-sm border border-signal-300 bg-signal-50 p-4 dark:border-signal-500/30 dark:bg-signal-500/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-theme-sm font-semibold text-ink-900 dark:text-white/90">
                      {projectName(materialProject(booking.materialId))} —{" "}
                      <span className="ledger-numeral">{booking.tonnesT.toFixed(1)} t</span>{" "}
                      {materialName(booking.materialId)} at {receiverName(booking.receiverId)}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-1 text-theme-xs text-ink-700 dark:text-gray-300">
                    Reason: {booking.holdReason ?? "Capacity unavailable"}
                  </p>
                  <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                    Next action: open{" "}
                    <Link to="/app/bookings" className="underline">
                      Bookings
                    </Link>{" "}
                    and cancel the confirmed booking to release capacity — the hold is rechecked
                    automatically.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Active matches + recent proof of recovery */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="surface-card p-5 md:p-6">
            <h3 className="mb-4 text-base font-semibold text-ink-900 dark:text-white/90">
              Active matches
            </h3>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataset.allocations
                .filter((a) => a.status === "confirmed")
                .map((allocation) => (
                  <li key={allocation.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-theme-sm font-medium text-ink-900 dark:text-white/90">
                        {materialName(allocation.materialId)} → {receiverName(allocation.receiverId)}
                      </p>
                      <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
                        {allocation.id} · {allocation.requestedT.toFixed(1)} t · slot {allocation.slotId}
                      </p>
                    </div>
                    <StatusBadge status={allocation.status} />
                  </li>
                ))}
              {dataset.allocations.filter((a) => a.status === "confirmed").length === 0 && (
                <li className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  No confirmed matches in the current view.
                </li>
              )}
            </ul>
          </section>

          <section className="surface-card p-5 md:p-6">
            <h3 className="mb-4 text-base font-semibold text-ink-900 dark:text-white/90">
              Recent verification
            </h3>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {dataset.verifications.map((verification) => (
                <li key={verification.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-theme-sm font-medium text-ink-900 dark:text-white/90">
                      <span className="ledger-numeral">{verification.loadRef}</span> ·{" "}
                      {receiverName(verification.receiverId)}
                    </p>
                    <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
                      planned {verification.plannedT.toFixed(1)} t · accepted{" "}
                      {verification.acceptedT.toFixed(1)} t · rejected {verification.rejectedT.toFixed(1)} t
                    </p>
                  </div>
                  <StatusBadge status={verification.status} />
                </li>
              ))}
              {dataset.verifications.length === 0 && (
                <li className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                  No verified loads yet.
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* Event log */}
        <section className="surface-card p-5 md:p-6">
          <h3 className="mb-4 text-base font-semibold text-ink-900 dark:text-white/90">
            Audit trail
          </h3>
          <EventLog events={dataset.events} limit={8} />
        </section>
      </div>
    </>
  );
}
