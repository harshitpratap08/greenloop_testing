/**
 * Explore — the friendly project-first home for the app.
 *
 * Replaces the dense operational dashboard as the landing experience:
 *   WELCOME → "What would you like to do?" → YOUR PROJECTS → guided detail.
 * Advanced/operational pages (Operations, Allocations, ledger internals)
 * remain one click away for admins and returning users.
 */

import { useGreenLoopStore } from "@/store/GreenLoopStore";
import {
  BookingSummaryRow,
  EmptyState,
  FriendlyPageHeader,
  PrimaryActions,
  ProjectCard,
  ProjectStatusChip,
  SlotAvailability,
  STORY_PROJECT_ID,
  STEP_LABELS,
  WorkflowRail,
  currentStepIndex,
  projectNextAction,
  projectSteps,
  useAppRole,
  useGreeting,
} from "@/components/greenloop/AppExploration";
import { Link, useLocation } from "react-router";
import { computeMatch } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { cn } from "@/utils";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { slotLedger } from "@/domain/capacity";

export default function Explore() {
  const { dataset } = useGreenLoopStore();
  const [role] = useAppRole();
  const greeting = useGreeting();
  const location = useLocation();
  const selectedId =
    (location.state as { projectId?: string } | null)?.projectId ??
    dataset.projects.find((p) => p.id === STORY_PROJECT_ID)?.id ??
    dataset.projects[0]?.id;
  const project = dataset.projects.find((p) => p.id === selectedId);
  const next = project ? projectNextAction(dataset, project.id) : null;
  const projectMaterials = project
    ? dataset.materials.filter((material) => material.projectId === project.id)
    : [];
  const materialsNeedingAction = projectMaterials.filter(
    (material) => material.status !== "verified" && material.status !== "dispatched",
  );
  const dispatchedBookings = dataset.bookings.filter((booking) =>
    dataset.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id)),
  );
  const activeBookings = dataset.bookings.filter(
    (booking) =>
      (booking.status === "confirmed" || booking.status === "hold" || booking.status === "pending") &&
      !dispatchedBookings.some((dispatched) => dispatched.id === booking.id),
  );
  const awaitingVerification = dispatchedBookings.filter(
    (booking) => !dataset.verifications.some((verification) => verification.bookingId === booking.id),
  );
  const latestVerification = [...dataset.verifications].sort(
    (a, b) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? ""),
  )[0];
  const concreteLedger = slotLedger(dataset, STORY.concreteSlotSept28);
  const projectStages = project ? projectSteps(dataset, project.id) : null;
  const currentStage = projectStages ? STEP_LABELS[currentStepIndex(projectStages)] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <FriendlyPageHeader
        title={greeting}
        subtitle={
          role === "receiver"
            ? "Receiver view · materials, intake capacity and deliveries"
            : role === "admin"
              ? "Project activity and operational status"
              : "Project activity and the next recovery action"
        }
      >
        <RoleSwitchNote role={role} />
      </FriendlyPageHeader>

      {project ? (
        <section className="surface-dark overflow-hidden">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-start lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow-label text-white/55">Active project</p>
                <ProjectStatusChip status={project.status} />
              </div>
              <h1 className="mt-4 max-w-3xl font-archivo text-title-sm font-semibold tracking-tight text-white sm:text-title-md">
                {project.name}
              </h1>
              <p className="mt-2 text-theme-sm text-white/60">{project.location}</p>
            </div>
            <div className="border-s border-white/20 ps-4 lg:min-w-44 lg:ps-6">
              <p className="eyebrow-label text-white/45">Current stage</p>
              <p className="mt-2 font-archivo text-xl font-semibold text-white">{currentStage ?? "Complete"}</p>
              <p className="ledger-numeral mt-1 text-theme-xs text-white/45">
                Updated {new Date(project.lastActivityAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </p>
            </div>
          </div>

          <div className="border-y border-white/15 px-6 py-5 sm:px-8 lg:px-10">
            <WorkflowRail projectId={project.id} inverse />
          </div>

          {next && (
            <div className="flex flex-col gap-4 bg-black/15 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
              <div>
                <p className="eyebrow-label text-white/45">Next action</p>
                <p className="mt-1 font-archivo text-xl font-semibold text-white">{next.label}</p>
                <p className="mt-1 max-w-xl text-theme-sm text-white/65">{next.reason}</p>
              </div>
              <Link
                to={next.to}
                className="inline-flex shrink-0 items-center justify-center gap-3 bg-white px-5 py-3 text-theme-sm font-semibold text-ink-900 transition-colors hover:bg-gray-200 dark:bg-loop-500 dark:text-white dark:hover:bg-loop-600"
              >
                Continue project <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
        </section>
      ) : (
        <EmptyState title="No active project selected" body="Choose a project to see its recovery stage and next action." action={{ label: "View projects", to: "/app/projects" }} />
      )}

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Materials needing action</p>
            <h2 className="mt-1 font-archivo text-xl font-semibold tracking-tight text-ink-900 dark:text-white">
              {materialsNeedingAction.length} passport{materialsNeedingAction.length === 1 ? "" : "s"} to progress
            </h2>
          </div>
          <Link to="/app/materials" className="text-theme-sm font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 hover:text-loop-700 dark:text-gray-200 dark:hover:text-loop-300">
            All materials →
          </Link>
        </div>
        <div className="divide-y divide-steel-200 border-y border-steel-200 dark:divide-steel-800 dark:border-steel-800">
          {materialsNeedingAction.length > 0 ? materialsNeedingAction.map((material) => (
            <Link key={material.id} to="/app/materials" className="grid gap-2 py-4 transition-colors hover:bg-white/60 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 dark:hover:bg-white/5">
              <div>
                <p className="font-archivo text-base font-semibold capitalize text-ink-900 dark:text-white">{material.type}</p>
                <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{material.id} · {material.condition} condition · grade {material.grade}</p>
              </div>
              <p className="ledger-numeral text-theme-sm font-semibold text-ink-900 dark:text-white">{material.quantityT.toFixed(1)} t <span className="font-normal text-gray-500">({material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)})</span></p>
              <StatusBadge status={material.status} />
            </Link>
          )) : (
            <p className="py-5 text-theme-sm text-gray-500 dark:text-gray-400">No materials are waiting for action on this project.</p>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="border-t-2 border-ink-900 pt-4 dark:border-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">Receiver capacity</p>
              <h2 className="mt-1 font-archivo text-lg font-semibold text-ink-900 dark:text-white">Next concrete intake</h2>
            </div>
            <Link to="/app/receivers" className="text-theme-xs font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">Find receiver</Link>
          </div>
          <div className="mt-5">
            <SlotAvailability slotId={STORY.concreteSlotSept28} />
          </div>
          {concreteLedger && (
            <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
              Riverstone Aggregates · {concreteLedger.reserved.toFixed(1)} t reserved · {concreteLedger.available.toFixed(1)} t available · reservations share one live ledger.
            </p>
          )}
        </div>

        <div className="border-t-2 border-ink-900 pt-4 dark:border-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-600 dark:text-steel-400">Upcoming bookings</p>
              <h2 className="mt-1 font-archivo text-lg font-semibold text-ink-900 dark:text-white">Reserved receiver slots</h2>
            </div>
            <Link to="/app/bookings" className="text-theme-xs font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">All bookings</Link>
          </div>
          {activeBookings.length > 0 ? (
            <ul className="mt-2">{activeBookings.map((booking) => <BookingSummaryRow key={booking.id} booking={booking} />)}</ul>
          ) : (
            <p className="mt-4 text-theme-sm text-gray-500 dark:text-gray-400">No active receiver slots are booked.</p>
          )}
        </div>
      </section>

      <section className="mt-10 border-t border-steel-300 pt-5 dark:border-steel-700">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-600 dark:text-steel-400">Delivery verification</p>
            <h2 className="mt-1 font-archivo text-lg font-semibold text-ink-900 dark:text-white">
              {awaitingVerification.length > 0 ? `${awaitingVerification.length} load${awaitingVerification.length === 1 ? "" : "s"} awaiting weighbridge record` : "No deliveries waiting for verification"}
            </h2>
            {latestVerification && (
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                Latest: {latestVerification.loadRef} · {latestVerification.acceptedT.toFixed(1)} t accepted of {latestVerification.actualT.toFixed(1)} t arrived
              </p>
            )}
          </div>
          <Link to="/app/verification" className="text-theme-xs font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 dark:text-gray-200">Verification register</Link>
        </div>
        {awaitingVerification.length > 0 && (
          <ul className="mt-3 divide-y divide-steel-200 border-y border-steel-200 dark:divide-steel-800 dark:border-steel-800">
            {awaitingVerification.map((booking) => <BookingSummaryRow key={booking.id} booking={booking} />)}
          </ul>
        )}
      </section>

      <details className="group mt-12 border-t border-steel-300 pt-5 dark:border-steel-700">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-archivo text-lg font-semibold text-ink-900 dark:text-white">
          All projects <span className="eyebrow-label text-steel-500">{dataset.projects.length} records</span>
        </summary>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Select a project to make it the active recovery plan.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {dataset.projects.map((item) => <ProjectCard key={item.id} project={item} />)}
        </div>
      </details>

      <div className="mt-10">
        <PrimaryActions />
      </div>

      {role === "admin" && (
        <section className="mt-10 border-t border-steel-300 pt-5 dark:border-steel-700">
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">Admin access</p>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { label: "Operations console", to: "/app/operations" },
              { label: "Allocations & scoring", to: "/app/allocations" },
              { label: "Reports", to: "/app/reports" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="text-theme-sm font-semibold text-ink-800 underline decoration-steel-300 underline-offset-4 hover:text-loop-700 dark:text-gray-200 dark:hover:text-loop-300">
                {item.label} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RoleSwitchNote({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "rounded border px-2.5 py-1 text-theme-xs font-medium capitalize",
        "border-steel-300 bg-steel-50 text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300",
      )}
    >
      viewing as {role === "site" ? "site manager" : role}
    </span>
  );
}

/** Receiver-facing material spotlight (used when role === "receiver"). */
export function ReceiverSpotlight() {
  const { dataset } = useGreenLoopStore();
  const candidates = computeMatch(dataset, STORY.materialBId);
  const best = candidates[0];
  if (!best) return null;
  const receiver = dataset.receivers.find((r) => r.id === best.receiverId);
  return (
    <p className="text-theme-sm text-gray-500 dark:text-gray-400">
      Top demand signal: {receiver?.name} ({Math.round(best.suitability * 100)}% suitability).
    </p>
  );
}
