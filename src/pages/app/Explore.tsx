/**
 * Explore — the friendly project-first home for the app.
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
import { motion } from "motion/react";

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

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <FriendlyPageHeader
        title={`${greeting}. Operations are live.`}
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
        <section className="mt-8 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
          {/* Animated Hero Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex min-h-[500px] flex-col justify-end overflow-hidden border border-steel-200 bg-ink-950 shadow-lg dark:border-steel-800 dark:bg-black"
          >
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <img
                src="/images/site/hero-demolition.jpg"
                alt="Demolition Site"
                className="h-full w-full animate-slow-mo object-cover opacity-40 dark:opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent dark:from-black/90 dark:via-black/40" />
            </div>

            <div className="p-8 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow-label text-white/70">Active Operation</p>
                <ProjectStatusChip status={project.status} />
              </div>
              <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl uppercase">
                {project.name}
              </h1>
              <p className="mt-4 max-w-xl text-lg font-medium text-white/90 drop-shadow-sm">
                {project.location} · {projectMaterials[0]?.type || "Mixed"} recovery
              </p>
            </div>
          </motion.div>

          {/* Floating Operations Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6 lg:gap-8"
          >
            <div className="relative overflow-hidden border-t-4 border-t-loop-500 border-x border-b border-steel-200 bg-white p-8 shadow-md dark:border-steel-800 dark:border-t-loop-500 dark:bg-ink-950 dark:shadow-xl">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Total Volume</p>
              <div className="mt-2 flex items-baseline gap-2">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="ledger-numeral text-5xl font-semibold tracking-tight text-ink-900 dark:text-white"
                >
                  {projectMaterials.reduce((acc, m) => acc + m.quantityT, 0).toFixed(1)}
                </motion.span>
                <span className="text-2xl text-steel-400 dark:text-steel-500">t</span>
              </div>

              {next && (
                <div className="mt-8 border-t border-steel-200 pt-8 dark:border-steel-800">
                  <p className="eyebrow-label text-steel-500 dark:text-steel-400">Required Action</p>
                  <p className="mt-2 font-archivo text-xl font-bold text-ink-900 dark:text-white">{next.label}</p>
                  <p className="mt-1 text-theme-sm text-steel-600 dark:text-steel-400">{next.reason}</p>
                  <Link
                    to={next.to}
                    className="group relative mt-6 inline-flex w-full items-center justify-between border border-transparent bg-ink-900 px-6 py-4 text-theme-sm font-semibold text-white shadow-md transition-all hover:bg-loop-700 dark:border-steel-700 dark:bg-white/10 dark:hover:border-loop-500 dark:hover:bg-loop-500/20 dark:hover:text-loop-300"
                  >
                    <span>{next.label}</span>
                    <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-ink-950">
              <LiveWorkflow projectStages={projectStages!} />
            </div>
          </motion.div>
        </section>
      ) : (
        <EmptyState title="No active project selected" body="Choose a project to see its recovery stage and next action." action={{ label: "View projects", to: "/app/projects" }} />
      )}

      <section className="mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Materials needing action</p>
            <h2 className="mt-1 font-archivo text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
              {materialsNeedingAction.length} passport{materialsNeedingAction.length === 1 ? "" : "s"} to progress
            </h2>
          </div>
          <Link to="/app/materials" className="text-theme-sm font-semibold text-ink-600 underline decoration-ink-200 underline-offset-4 hover:text-ink-900 dark:text-gray-300 dark:decoration-steel-700 dark:hover:text-white">
            All materials →
          </Link>
        </div>
        
        <div className="grid gap-4 lg:grid-cols-2">
          {materialsNeedingAction.length > 0 ? materialsNeedingAction.map((material, i) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Link to="/app/materials" className="group flex flex-col gap-4 overflow-hidden border border-steel-200 bg-white p-5 shadow-sm transition-all hover:border-loop-500 hover:shadow-md sm:flex-row sm:items-center sm:gap-6 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-loop-500/50 dark:hover:bg-white/[0.05]">
                <div className="h-24 w-32 shrink-0 overflow-hidden bg-steel-100 sm:h-20 sm:w-28 dark:bg-black">
                  <img
                    src={material.type === 'concrete' ? "/images/site/auth-concrete.jpg" : "/images/site/brick-pallets.jpg"}
                    alt={material.type}
                    className="h-full w-full animate-slow-mo object-cover opacity-80"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-archivo text-lg font-bold uppercase tracking-wide text-ink-900 transition-colors group-hover:text-loop-600 dark:text-white dark:group-hover:text-loop-400">{material.type}</p>
                  <p className="mt-1 text-theme-sm text-steel-600 dark:text-gray-400">{material.id} · {material.condition} condition · grade {material.grade}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="ledger-numeral text-xl font-semibold text-ink-900 transition-transform origin-right group-hover:scale-105 dark:text-white">
                    {material.quantityT.toFixed(1)} t
                  </p>
                  <p className="text-xs text-steel-500 dark:text-gray-500">({material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)})</p>
                  <StatusBadge status={material.status} />
                </div>
              </Link>
            </motion.div>
          )) : (
            <p className="py-5 text-theme-sm text-steel-500 dark:text-gray-400">No materials are waiting for action on this project.</p>
          )}
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group relative overflow-hidden border border-steel-200 bg-white p-6 shadow-sm lg:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-steel-100 opacity-50 blur-3xl dark:bg-white/5" />
          
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Receiver capacity</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold text-ink-900 dark:text-white">RIVERSTONE AGGREGATES</h2>
            </div>
            <Link to="/app/receivers" className="text-theme-sm font-semibold text-ink-600 underline decoration-ink-200 underline-offset-4 hover:text-ink-900 dark:text-gray-300 dark:decoration-steel-700 dark:hover:text-white">Find receiver</Link>
          </div>
          
          <div className="relative z-10 mt-8 flex flex-col gap-6 sm:flex-row">
            <div className="h-32 w-full shrink-0 overflow-hidden bg-steel-100 border border-steel-200 sm:w-48 dark:border-steel-700 dark:bg-black">
               <img
                 src="/images/site/auth-yard.jpg"
                 alt="Receiver Yard"
                 className="h-full w-full animate-slow-mo object-cover opacity-70"
               />
            </div>
            <div className="flex-1">
              <SlotAvailability slotId={STORY.concreteSlotSept28} />
              {concreteLedger && (
                <p className="mt-6 border-t border-steel-200 pt-4 text-theme-sm text-steel-600 dark:border-steel-800 dark:text-gray-400">
                  <span className="font-semibold text-ink-900 dark:text-white">{concreteLedger.reserved.toFixed(1)} t</span> reserved · <span className="font-semibold text-ink-900 dark:text-white">{concreteLedger.available.toFixed(1)} t</span> available
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="border border-steel-200 bg-white p-6 shadow-sm lg:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Upcoming bookings</p>
              <h2 className="mt-1 font-archivo text-2xl font-semibold text-ink-900 dark:text-white">Reserved receiver slots</h2>
            </div>
            <Link to="/app/bookings" className="text-theme-sm font-semibold text-ink-600 underline decoration-ink-200 underline-offset-4 hover:text-ink-900 dark:text-gray-300 dark:decoration-steel-700 dark:hover:text-white">All bookings</Link>
          </div>
          {activeBookings.length > 0 ? (
            <ul className="mt-6 flex flex-col gap-3">{activeBookings.map((booking) => <BookingSummaryRow key={booking.id} booking={booking} />)}</ul>
          ) : (
            <p className="mt-6 text-theme-sm text-steel-500 dark:text-gray-400">No active receiver slots are booked.</p>
          )}
        </motion.div>
      </section>

      <section className="mt-16">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Logistics & Delivery</p>
            <h2 className="mt-1 font-archivo text-2xl font-semibold text-ink-900 dark:text-white">
              {awaitingVerification.length > 0 ? `${awaitingVerification.length} live load${awaitingVerification.length === 1 ? "" : "s"} in transit` : "No deliveries currently in transit"}
            </h2>
            {latestVerification && (
              <p className="mt-2 text-theme-sm text-steel-600 dark:text-gray-400">
                Latest completion: <span className="font-mono text-ink-900 dark:text-white">{latestVerification.loadRef}</span> · {latestVerification.acceptedT.toFixed(1)} t recovered
              </p>
            )}
          </div>
          <Link to="/app/deliveries" className="text-theme-sm font-semibold text-ink-600 underline decoration-ink-200 underline-offset-4 hover:text-ink-900 dark:text-gray-300 dark:decoration-steel-700 dark:hover:text-white">Delivery board</Link>
        </div>
        
        {awaitingVerification.length > 0 && (
          <div className="flex flex-col gap-4">
            {awaitingVerification.map((booking, i) => (
              <LiveDeliveryRow key={booking.id} booking={booking} index={i} />
            ))}
          </div>
        )}
      </section>

      <details className="group mt-16 border border-steel-200 bg-white p-6 shadow-sm lg:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-archivo text-xl font-semibold text-ink-900 dark:text-white">
          All projects <span className="eyebrow-label text-steel-500 dark:text-steel-400">{dataset.projects.length} records</span>
        </summary>
        <p className="mt-2 text-theme-sm text-steel-600 dark:text-gray-400">Select a project to make it the active recovery plan.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {dataset.projects.map((item) => <ProjectCard key={item.id} project={item} />)}
        </div>
      </details>

      <div className="mt-12">
        <PrimaryActions />
      </div>

      {role === "admin" && (
        <section className="mt-12 border border-steel-200 bg-[#E8E8E3] p-6 lg:p-8 dark:border-steel-800 dark:bg-white/[0.02]">
          <p className="eyebrow-label text-steel-500 dark:text-steel-400">Admin access</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { label: "Operations console", to: "/app/operations" },
              { label: "Allocations & scoring", to: "/app/allocations" },
              { label: "Reports", to: "/app/reports" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="text-theme-sm font-semibold text-ink-600 underline decoration-ink-200 underline-offset-4 hover:text-ink-900 dark:text-gray-300 dark:decoration-steel-700 dark:hover:text-white">
                {item.label} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LiveWorkflow({ projectStages }: { projectStages: ReturnType<typeof projectSteps> }) {
  const currentIndex = currentStepIndex(projectStages);
  const stages = [
    { label: "SURVEY", active: currentIndex >= 0, complete: currentIndex > 0 },
    { label: "MATCH", active: currentIndex >= 1, complete: currentIndex > 1 },
    { label: "RESERVE", active: currentIndex >= 2, complete: currentIndex > 2 },
    { label: "DELIVER", active: currentIndex >= 3, complete: currentIndex > 3 },
    { label: "VERIFY", active: currentIndex >= 4, complete: currentIndex > 4 },
  ];

  return (
    <div className="py-2">
      <p className="eyebrow-label mb-6 text-steel-500 dark:text-steel-400">Live Process</p>
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute left-0 top-1/2 -z-10 h-[2px] w-full -translate-y-1/2 bg-steel-200 dark:bg-steel-800" />
        
        {/* Animated fill track */}
        <motion.div 
          className="absolute left-0 top-1/2 -z-10 h-[3px] -translate-y-1/2 bg-ink-900 dark:bg-white"
          initial={{ width: 0 }}
          whileInView={{ width: `${(Math.min(currentIndex, 4) / 4) * 100}%` }}
          transition={{ duration: 1, ease: "easeInOut" }}
          viewport={{ once: true }}
        />

        {stages.map((stage, i) => (
          <div key={stage.label} className="flex flex-col items-center gap-3">
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.2, type: "spring", stiffness: 300, damping: 20 }}
              viewport={{ once: true }}
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-500 ring-4 ring-white dark:ring-ink-950",
                stage.complete 
                  ? "bg-ink-900 dark:bg-white" 
                  : stage.active 
                    ? "bg-loop-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                    : "bg-white border-2 border-steel-300 dark:bg-ink-900 dark:border-steel-700"
              )}
            />
            <p className={cn(
              "font-archivo text-xs font-bold tracking-widest transition-colors duration-500",
              stage.complete ? "text-ink-900 dark:text-white" : stage.active ? "text-loop-600 dark:text-loop-400" : "text-steel-400 dark:text-steel-600"
            )}>
              {stage.label}
            </p>
          </div>
        ))}
      </div>
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

function LiveDeliveryRow({ booking, index }: { booking: any, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.5 }}
      className="relative overflow-hidden border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
    >
      <div className="mb-8 flex items-center justify-between">
        <p className="font-archivo text-xl font-bold tracking-tight text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t Load</p>
        <span className="animate-pulse border border-loop-200 bg-loop-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-loop-600 dark:border-loop-500/30 dark:bg-loop-500/10 dark:text-loop-300">In Transit</span>
      </div>
      
      <div className="relative flex items-center justify-between px-4 pb-2 pt-6">
        {/* Track Line */}
        <div className="absolute left-6 right-6 top-1/2 -z-10 h-[2px] -translate-y-1/2 bg-steel-200 dark:bg-steel-800" />
        <motion.div 
          initial={{ width: "0%" }}
          whileInView={{ width: "50%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          viewport={{ once: true }}
          className="absolute left-6 top-1/2 -z-10 h-[3px] -translate-y-1/2 bg-ink-900 dark:bg-white" 
        />
        
        {/* Nodes */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-ink-900 ring-4 ring-white dark:bg-white dark:ring-ink-950" />
          <p className="text-xs font-bold uppercase tracking-wider text-ink-900 dark:text-white">Site</p>
        </div>
        
        <div className="relative flex flex-col items-center gap-2">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute -top-10 text-3xl"
          >
            🚛
          </motion.div>
          <div className="flex h-4 w-4 animate-pulse items-center justify-center rounded-full border-4 border-loop-500 bg-white dark:bg-ink-950" />
          <p className="text-xs font-bold uppercase tracking-wider text-loop-600 dark:text-loop-400">En Route</p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-steel-300 bg-white ring-4 ring-white dark:border-steel-700 dark:bg-ink-950 dark:ring-ink-950" />
          <p className="text-xs font-bold uppercase tracking-wider text-steel-400 dark:text-steel-600">Receiver</p>
        </div>
      </div>
    </motion.div>
  );
}
