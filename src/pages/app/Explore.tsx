/**
 * Explore — Provider Home.
 *
 * "I HAVE MATERIAL." The page answers, in order: what material is on the
 * ground, what needs my decision, where can it go, what happens next,
 * where my loads are, and what the network has verified. Every figure is
 * live from the shared recovery ledger; every image is the material it
 * represents.
 */

import { useGreenLoopStore } from "@/store/GreenLoopStore";
import PageMeta from "@/components/common/PageMeta";
import {
  STORY_PROJECT_ID,
  currentStepIndex,
  projectNextAction,
  projectSteps,
  useGreeting,
} from "@/components/greenloop/AppExploration";
import { Link, useLocation } from "react-router";
import { computeMatch, slotLedger, availableT } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { eventsForSubjects } from "@/domain/events";
import { cn } from "@/utils";
import { motion } from "motion/react";
import type { Booking, MaterialPassport } from "@/domain/types";
import { useAuth } from "@/context/AuthContext";
import {
  PageMotion,
  RevealItem,
  MediaPanel,
  VideoPanel,
  WorkflowRail7,
  WorkflowProgress,
  StatusChip,
  JourneyStrip,
  Counter,
  type KitStatus,
} from "@/components/greenloop/kit";
import {
  materialMediaFor,
  projectMediaFor,
  receiverMediaFor,
  ambientMedia,
  ambientVideo,
} from "@/config/appMedia";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

/** Map a domain booking/material state onto the kit status language. */
function bookingChip(status: Booking["status"], dispatched: boolean): { status: KitStatus; label: string } {
  if (status === "confirmed") return { status: "confirmed", label: dispatched ? "In transit" : "Confirmed" };
  if (status === "hold") return { status: "hold", label: "On hold" };
  if (status === "cancelled") return { status: "cancelled", label: "Cancelled" };
  return { status: "waiting", label: "Waiting on capacity" };
}

function materialChip(material: MaterialPassport): KitStatus {
  if (material.status === "verified") return "verified";
  if (material.status === "dispatched") return "active";
  if (material.status === "reserved" || material.status === "allocated") return "confirmed";
  return "attention";
}

/** One row of the LIVE RECOVERY FLOW panel. */
function FlowStage({
  index,
  name,
  figure,
  note,
  state,
  last,
}: {
  index: number;
  name: string;
  figure?: string;
  note?: string;
  state: "done" | "active" | "next";
  last?: boolean;
}) {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center pt-1" aria-hidden="true">
        <span
          className={cn(
            "flex size-6 items-center justify-center border font-archivo text-[11px] font-bold leading-none",
            state === "done" && "border-loop-500 bg-loop-500 text-white",
            state === "active" && "border-ink-900 bg-ink-900 text-white dark:border-white dark:bg-white dark:text-ink-900",
            state === "next" && "border-steel-300 bg-white text-steel-400 dark:border-steel-700 dark:bg-transparent",
          )}
        >
          {state === "done" ? "✓" : index + 1}
        </span>
        {!last && <span className={cn("w-px grow", state === "next" ? "bg-steel-200 dark:bg-steel-800" : "bg-loop-400")} />}
      </div>
      <div className={cn("min-w-0 flex-1", !last && "pb-5")}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <p className={cn("font-archivo text-sm font-bold uppercase tracking-wider", state === "next" ? "text-steel-400 dark:text-steel-500" : "text-ink-900 dark:text-white")}>
            {name}
          </p>
          {figure && <span className="ledger-numeral text-xs font-semibold text-steel-600 dark:text-gray-400">{figure}</span>}
        </div>
        {note && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{note}</p>}
      </div>
    </motion.li>
  );
}

export default function Explore() {
  const { dataset } = useGreenLoopStore();
  const greeting = useGreeting();
  const { user } = useAuth();
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

  const dispatchedBookings = dataset.bookings.filter((booking) =>
    dataset.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id)),
  );
  const awaitingVerification = dispatchedBookings.filter(
    (booking) => !dataset.verifications.some((verification) => verification.bookingId === booking.id),
  );
  const readyToDispatch = dataset.bookings.filter((booking) => booking.status === "confirmed" && booking.receiverAcceptedAt && !booking.loadRef);
  const unmatchedMaterials = dataset.materials.filter((material) =>
    material.status !== "verified" && material.status !== "dispatched" &&
    !dataset.allocations.some((allocation) => allocation.materialId === material.id && allocation.status !== "cancelled"),
  );

  const primaryTask:
    | { type: "material"; data: MaterialPassport }
    | { type: "dispatch"; data: Booking }
    | { type: "verify"; data: Booking }
    | null = unmatchedMaterials.length > 0
      ? {
          type: "material",
          data: unmatchedMaterials[0],
        }
      : readyToDispatch.length > 0
        ? {
            type: "dispatch",
            data: readyToDispatch[0],
          }
        : awaitingVerification.length > 0
          ? {
              type: "verify",
              data: awaitingVerification[0],
            }
          : null;

  const projectStages = project ? projectSteps(dataset, project.id) : null;
  const stageIndex = projectStages ? currentStepIndex(projectStages) : 0;
  const totalT = dataset.materials.reduce((sum, m) => sum + m.quantityT, 0);
  const verifiedT = dataset.verifications.reduce((sum, v) => sum + v.acceptedT, 0);
  const matchedCount = dataset.materials.filter((m) =>
    dataset.allocations.some((a) => a.materialId === m.id && a.status !== "cancelled")).length;
  const confirmedCount = dataset.bookings.filter((b) => b.status === "confirmed").length;
  const holdBookings = dataset.bookings.filter((b) => b.status === "hold");
  const storyLedger = slotLedger(dataset, STORY.concreteSlotSept24);
  const recentEvents = project ? eventsForSubjects(dataset, [project.id]).slice(0, 6) : [];
  const incomingBookings = dataset.bookings
    .filter((b) => b.status !== "cancelled")
    .slice(0, 3);

  // Live matching candidates for the primary material.
  const primaryMaterial = unmatchedMaterials[0];
  const candidates = primaryMaterial ? computeMatch(dataset, primaryMaterial.id).slice(0, 2) : [];
  const openDemand = dataset.demands.find((d) => d.status === "OPEN" || d.status === "PARTIALLY_COVERED");
  const demandNote = openDemand ? `${openDemand.requiredT.toFixed(1)} t of ${openDemand.materialType} demand is open in the network` : null;

  const flowStep = unmatchedMaterials.length > 0 ? 2 : readyToDispatch.length > 0 ? 5 : dispatchedBookings.length > 0 ? 6 : 7;

  return (
    <PageMotion className="mx-auto max-w-[1200px] pb-24">
      <PageMeta
        title="Home | GreenLoop"
        description="Your active recovery: material on the ground, receiving capacity, and the next load to move."
      />

      {/* ============================================================ */}
      {/* HERO — construction footage + operational statement          */}
      {/* ============================================================ */}
      <RevealItem>
        <header className="grid overflow-hidden border border-steel-200 bg-ink-950 shadow-sm dark:border-steel-800 lg:grid-cols-[1.45fr_1fr]">
          <VideoPanel
            video={ambientVideo.demolition}
            aspect="min-h-[280px] lg:min-h-[420px] h-full"
            scrim="bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-ink-950/30"
            caption={`${project?.name ?? "Active project"} · live site`}
          />
          <div className="flex flex-col justify-center gap-6 p-6 sm:p-8">
            <div>
              <p className="eyebrow-label text-loop-400">GreenLoop operations</p>
              <h1 className="mt-3 font-archivo text-3xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl">
                Recovery in motion
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} — the material you have on the ground, the yards that can take it, and the next load to move.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
              <div>
                <dd className="ledger-numeral text-2xl font-bold text-white">
                  <Counter value={totalT} />
                  <span className="text-sm font-semibold text-white/60"> t</span>
                </dd>
                <dt className="eyebrow-label mt-1 text-white/50">On the ground</dt>
              </div>
              <div>
                <dd className="ledger-numeral text-2xl font-bold text-loop-300">
                  <Counter value={verifiedT} />
                  <span className="text-sm font-semibold text-white/60"> t</span>
                </dd>
                <dt className="eyebrow-label mt-1 text-white/50">Verified</dt>
              </div>
              <div>
                <dd className="ledger-numeral text-2xl font-bold text-white">{dataset.bookings.length}</dd>
                <dt className="eyebrow-label mt-1 text-white/50">Bookings</dt>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <WorkflowRail7 current={stageIndex} inverse />
              {project?.status === "complete"
                ? <StatusChip status="verified" label="Complete" />
                : <StatusChip status="active" label="Recovery live" />}
            </div>
          </div>
        </header>
      </RevealItem>

      {/* ============================================================ */}
      {/* PRIORITY ACTION — the one thing that needs a decision        */}
      {/* ============================================================ */}
      <RevealItem className="mt-6">
        {primaryTask ? (
          <section className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] md:grid-cols-2" aria-label="Priority action">
            <div className="group relative">
              {primaryTask.type === "material" ? (
                <MediaPanel
                  media={materialMediaFor(primaryTask.data.type)}
                  aspect="h-full min-h-[260px]"
                  scrim="bg-gradient-to-t from-ink-950/55 via-transparent to-transparent"
                  caption={`${primaryTask.data.type} — as surveyed`}
                />
              ) : primaryTask.type === "dispatch" ? (
                <VideoPanel video={ambientVideo.dispatch} aspect="h-full min-h-[260px]" caption="Ready to dispatch" />
              ) : (
                <MediaPanel
                  media={ambientMedia.weighbridge}
                  aspect="h-full min-h-[260px]"
                  caption="Awaiting the weighbridge record"
                />
              )}
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <p className="eyebrow-label text-signal-600 dark:text-signal-400">Needs a receiver</p>
              {primaryTask.type === "material" && (
                <>
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                    <span className="ledger-numeral text-4xl font-bold text-ink-900 dark:text-white">{primaryTask.data.quantityT.toFixed(1)} t</span>
                    <span className="font-archivo text-2xl font-bold uppercase text-ink-900 dark:text-white">{primaryTask.data.type}</span>
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-700 dark:text-gray-300">
                    {dataset.projects.find((p) => p.id === primaryTask.data.projectId)?.name ?? "Unknown project"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Surveyed, passport-ready — no receiving slot confirmed yet.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link
                      to="/app/receivers"
                      state={{ materialId: primaryTask.data.id }}
                      className="inline-flex min-h-11 items-center bg-ink-900 px-5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900"
                    >
                      Find a receiver
                    </Link>
                    <Link
                      to={`/app/materials/${primaryTask.data.id}`}
                      className="inline-flex min-h-11 items-center border border-steel-300 px-4 text-sm font-semibold uppercase tracking-wide text-ink-900 hover:bg-steel-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5"
                    >
                      View passport
                    </Link>
                  </div>
                </>
              )}
              {primaryTask.type === "dispatch" && (
                <>
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                    <span className="ledger-numeral text-4xl font-bold text-ink-900 dark:text-white">{primaryTask.data.tonnesT.toFixed(1)} t</span>
                    <span className="font-archivo text-2xl font-bold uppercase text-ink-900 dark:text-white">Ready to dispatch</span>
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-700 dark:text-gray-300">
                    {dataset.receivers.find((r) => r.id === primaryTask.data.receiverId)?.name ?? "Receiver"} is expecting this load.
                  </p>
                  <div className="mt-6">
                    <Link to="/app/deliveries" className="inline-flex min-h-11 items-center bg-ink-900 px-5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900">
                      Send load
                    </Link>
                  </div>
                </>
              )}
              {primaryTask.type === "verify" && (
                <>
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                    <span className="ledger-numeral text-4xl font-bold text-ink-900 dark:text-white">{primaryTask.data.tonnesT.toFixed(1)} t</span>
                    <span className="font-archivo text-2xl font-bold uppercase text-ink-900 dark:text-white">Awaiting verification</span>
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-700 dark:text-gray-300">
                    Delivered to {dataset.receivers.find((r) => r.id === primaryTask.data.receiverId)?.name ?? "the receiver"}.
                  </p>
                  <div className="mt-6">
                    <Link to="/app/deliveries" className="inline-flex min-h-11 items-center border border-ink-900 px-5 text-sm font-bold uppercase tracking-wide text-ink-900 transition-colors hover:bg-steel-50 dark:border-white dark:text-white dark:hover:bg-white/10">
                      View delivery
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : (
          <section className="border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
            <p className="font-archivo text-lg font-medium text-gray-600 dark:text-gray-400">All loads are moving.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Nothing is waiting on a decision right now.</p>
          </section>
        )}
      </RevealItem>

      {/* ============================================================ */}
      {/* ACTIVE PROJECT — site image + workflow command               */}
      {/* ============================================================ */}
      {project && (
        <RevealItem className="mt-6">
          <section aria-label="Active recovery project">
            <div className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[1.15fr_0.85fr]">
              <MediaPanel
                media={projectMediaFor(project)}
                aspect="min-h-[300px] lg:min-h-[380px]"
                scrim="bg-gradient-to-t from-ink-950/70 via-ink-950/15 to-transparent"
                className="border-0 border-b border-steel-200 lg:border-b-0 lg:border-e dark:border-steel-800"
                caption={project.location}
              >
                <figcaption className="absolute bottom-4 left-5 right-5">
                  <p className="eyebrow-label text-white/70">Active recovery project</p>
                  <p className="mt-1 font-archivo text-2xl font-bold uppercase tracking-tight text-white">{project.name}</p>
                  <p className="ledger-numeral mt-1 text-sm text-white/80">
                    {projectMaterials.reduce((acc, m) => acc + m.quantityT, 0).toFixed(1)} t surveyed · {projectMaterials.length} passports
                  </p>
                </figcaption>
              </MediaPanel>
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3">
                  <WorkflowProgress current={stageIndex} reason={next?.reason} />
                  <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                    {project.status === "complete" ? <StatusChip status="verified" label="Complete" /> : <StatusChip status="active" label="Active" />}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link to="/app/materials/new" className="inline-flex min-h-11 items-center bg-ink-900 px-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900">
                    + New survey
                  </Link>
                  <Link to="/app/projects" className="inline-flex min-h-11 items-center border border-steel-300 px-4 text-sm font-semibold uppercase tracking-wide text-ink-900 hover:bg-steel-50 dark:border-steel-700 dark:text-white dark:hover:bg-white/5">
                    All projects
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </RevealItem>
      )}

      {/* ============================================================ */}
      {/* MATERIALS IN MOTION — every passport, real material imagery  */}
      {/* ============================================================ */}
      {dataset.materials.length > 0 && (
        <RevealItem className="mt-12">
          <section aria-label="Materials in motion">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material passports</p>
                <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Materials in motion</h2>
              </div>
              <Link to="/app/materials" className="text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
                All materials
              </Link>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dataset.materials.map((material) => {
                const allocation = dataset.allocations.find((a) => a.materialId === material.id && a.status !== "cancelled");
                const receiverId = allocation?.receiverId;
                const receiver = receiverId ? dataset.receivers.find((r) => r.id === receiverId) : undefined;
                const isPrimary = primaryMaterial?.id === material.id;
                return (
                  <li key={material.id}>
                    <article className={cn(
                      "group flex h-full flex-col border bg-white transition-colors dark:bg-white/[0.02]",
                      isPrimary ? "border-ink-900 shadow-md dark:border-white" : "border-steel-200 hover:border-ink-900 dark:border-steel-800 dark:hover:border-white",
                    )}>
                      <Link to={`/app/materials/${material.id}`} className="relative block overflow-hidden" aria-label={`Open passport ${material.id}`}>
                        <MediaPanel
                          media={materialMediaFor(material.type)}
                          aspect="aspect-[16/10]"
                          scrim="bg-gradient-to-t from-ink-950/75 via-ink-950/10 to-transparent"
                          className="border-0 border-b border-steel-200 dark:border-steel-800"
                          caption={TYPE_LABEL[material.type] ?? material.type}
                        />
                        <span className="pointer-events-none absolute bottom-10 left-4 flex items-baseline gap-2">
                          <span className="ledger-numeral text-xl font-bold text-white">{material.quantityT.toFixed(1)} t</span>
                          {isPrimary && (
                            <span className="border border-signal-400 bg-signal-500/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              Priority
                            </span>
                          )}
                        </span>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-archivo text-lg font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                            {TYPE_LABEL[material.type] ?? material.type}
                          </h3>
                          <StatusChip status={materialChip(material)} label={material.status} />
                        </div>
                        <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                          <Link to="/app/explore" state={{ projectId: material.projectId }} className="font-semibold text-ink-900 hover:text-loop-600 dark:text-gray-200 dark:hover:text-loop-400">
                            {dataset.projects.find((p) => p.id === material.projectId)?.name ?? material.projectId}
                          </Link>
                          {" · "}
                          {material.condition} condition · Grade {material.grade}
                        </p>
                        {receiver && (
                          <p className="mt-2 border-s-2 border-loop-500 ps-2 text-xs text-gray-600 dark:text-gray-400">
                            {allocation ? "Matched with" : "Suggested"}: <span className="font-semibold text-ink-900 dark:text-gray-200">{receiver.name}</span>
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-white/5 lg:mt-auto">
                          <Link to={`/app/materials/${material.id}`} className="text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
                            View passport
                          </Link>
                          {!allocation && material.status !== "verified" && material.status !== "dispatched" && (
                            <Link to="/app/receivers" state={{ materialId: material.id }} className="ms-auto text-xs font-bold uppercase tracking-wider text-loop-700 underline underline-offset-4 hover:text-loop-600 dark:text-loop-400">
                              Find receiver
                            </Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        </RevealItem>
      )}

      {/* ============================================================ */}
      {/* WHERE CAN IT GO — live receiver matching, dispatch footage   */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Where can this material go">
          <div className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[0.9fr_1.1fr]">
            <VideoPanel
              video={ambientVideo.dispatch}
              aspect="min-h-[240px] lg:min-h-[320px] h-full"
              scrim="bg-gradient-to-t from-ink-950/60 via-transparent to-transparent"
              className="border-0 border-b border-steel-200 lg:border-b-0 lg:border-e dark:border-steel-800"
              caption="Loads leaving site for the yard"
            />
            <div className="p-6 sm:p-8">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Live matching</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Where can it go?</h2>
              {primaryMaterial && candidates.length > 0 ? (
                <>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {primaryMaterial.quantityT.toFixed(1)} t of {primaryMaterial.type} from {dataset.projects.find((p) => p.id === primaryMaterial.projectId)?.name} — receivers ranked by the matching engine.
                  </p>
                  <ul className="mt-5 space-y-4">
                    {candidates.map((candidate, i) => {
                      const receiver = dataset.receivers.find((r) => r.id === candidate.receiverId);
                      if (!receiver) return null;
                      return (
                        <li key={candidate.receiverId} className="border border-steel-200 bg-gray-25 p-4 dark:border-steel-800 dark:bg-white/[0.02]">
                          <div className="flex items-start gap-4">
                            <img
                              src={receiverMediaFor(candidate.receiverId).src}
                              alt={receiverMediaFor(candidate.receiverId).alt}
                              loading="lazy"
                              className="hidden h-16 w-24 shrink-0 border border-steel-200 object-cover sm:block dark:border-steel-800"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="font-archivo text-base font-bold text-ink-900 dark:text-white">
                                  <span className="ledger-numeral me-2 text-xs text-steel-400">0{i + 1}</span>
                                  {receiver.name}
                                </p>
                                <StatusChip status={i === 0 ? "available" : "limited"} label={i === 0 ? "Best match" : "Also fits"} />
                              </div>
                              <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                                {candidate.distanceKm} km · accepts {receiver.acceptedTypes.join(", ")}
                              </p>
                              <p className="ledger-numeral mt-1 text-xs text-gray-500 dark:text-gray-500">
                                {candidate.availableT.toFixed(1)} t free in the fitting slot · handling £{candidate.handlingCostPerT.toFixed(2)}/t
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-white/5">
                            <span className="ledger-numeral text-xs text-gray-500 dark:text-gray-500">
                              Score {candidate.score.toFixed(3)} · suitability {Math.round(candidate.suitability * 100)}%
                            </span>
                            <Link
                              to="/app/receivers"
                              state={{ materialId: primaryMaterial.id }}
                              className="text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white"
                            >
                              View receiver
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Every passport is matched or moving. Open Find a receiver to see the network.
                </p>
              )}
              {demandNote && (
                <p className="mt-4 border-s-2 border-loop-500 ps-3 text-xs font-medium text-gray-600 dark:text-gray-400">{demandNote}.</p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <Link to="/app/receivers" className="inline-flex min-h-11 items-center border border-ink-900 px-4 text-sm font-bold uppercase tracking-wide text-ink-900 transition-colors hover:bg-ink-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-ink-900">
                  Find capacity
                </Link>
                {storyLedger && (
                  <p className="ledger-numeral text-xs text-gray-500 dark:text-gray-400">
                    Riverstone {storyLedger.slot.date}: {availableT(storyLedger.slot, dataset.bookings).toFixed(1)} t free
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* LIVE RECOVERY FLOW — the workflow as a live process          */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Live recovery flow">
          <div className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="p-6 sm:p-8">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">The recovery sequence</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Live recovery flow</h2>
              <ol className="mt-6">
                <FlowStage index={0} name="Survey" figure={`${dataset.materials.length} passports`} note={`${totalT.toFixed(1)} t recorded on site`} state={totalT > 0 ? "done" : "next"} />
                <FlowStage index={1} name="Passport" note="Condition, grade and evidence recorded" state={totalT > 0 ? "done" : "next"} />
                <FlowStage index={2} name="Match" figure={`${matchedCount}/${dataset.materials.length}`} note="Receivers scored against each passport" state={flowStep >= 3 ? "done" : flowStep === 2 ? "active" : "next"} />
                <FlowStage index={3} name="Capacity" figure={storyLedger ? `${storyLedger.available.toFixed(1)} t free` : undefined} note="Riverstone concrete slot" state={confirmedCount > 0 ? "done" : "next"} />
                <FlowStage index={4} name="Book" figure={`${confirmedCount} confirmed${holdBookings.length ? ` · ${holdBookings.length} on hold` : ""}`} state={confirmedCount > 0 ? "done" : "next"} last={!dispatchedBookings.length} />
                {dispatchedBookings.length > 0 && (
                  <FlowStage index={5} name="Send" figure={`${dispatchedBookings.length} load${dispatchedBookings.length === 1 ? "" : "s"} on the road`} note="Trucks dispatched to the receiving yard" state={flowStep >= 6 ? "done" : "active"} last={awaitingVerification.length === 0} />
                )}
                {awaitingVerification.length > 0 && (
                  <FlowStage index={6} name="Verify" note={`${awaitingVerification[0].loadRef ?? "Load"} awaiting the weighbridge`} state="active" last />
                )}
                {awaitingVerification.length === 0 && verifiedT > 0 && (
                  <FlowStage index={6} name="Verify" figure={`${verifiedT.toFixed(1)} t accepted`} note="Weighed, inspected and accepted" state="done" last />
                )}
              </ol>
            </div>
            <VideoPanel
              video={ambientVideo.materialHandling}
              aspect="min-h-[240px] lg:min-h-[320px] h-full"
              scrim="bg-gradient-to-t from-ink-950/55 via-transparent to-transparent"
              className="border-0 border-t border-steel-200 lg:border-s lg:border-t-0 dark:border-steel-800"
              caption="Material handling — Recovery in progress"
            />
          </div>
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* WHERE IS MY LOAD — delivery journeys                          */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Where is my load">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Dispatch &amp; delivery</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Where is my load?</h2>
            </div>
            <Link to="/app/deliveries" className="text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
              Track deliveries
            </Link>
          </div>
          {incomingBookings.length > 0 ? (
            <ul className="grid gap-5 lg:grid-cols-3">
              {incomingBookings.map((booking) => {
                const dispatched = dispatchedBookings.some((b) => b.id === booking.id);
                const verified = dataset.verifications.some((v) => v.bookingId === booking.id);
                const chip = bookingChip(booking.status, dispatched);
                const receiver = dataset.receivers.find((r) => r.id === booking.receiverId);
                const material = dataset.materials.find((m) => m.id === booking.materialId);
                return (
                  <li key={booking.id}>
                    <Link to="/app/deliveries" className="group block border border-steel-200 bg-white p-5 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-archivo text-base font-bold uppercase text-ink-900 dark:text-white">
                          <span className="ledger-numeral me-2 text-xs text-steel-400">{booking.id}</span>
                          {booking.tonnesT.toFixed(1)} t {material?.type ?? ""}
                        </p>
                        <StatusChip status={chip.status} label={chip.label} />
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        To {receiver?.name ?? booking.receiverId} · {dispatched ? "on the road" : verified ? "delivered" : booking.status === "hold" ? "slot pending" : "slot booked"}
                      </p>
                      <div className="mt-4">
                        <JourneyStrip current={verified ? 4 : dispatched ? 2 : booking.status === "confirmed" ? 1 : 0} />
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 group-hover:text-loop-600 dark:text-white">
                        Open delivery
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="border border-steel-200 bg-white p-6 text-sm text-gray-500 dark:border-steel-800 dark:bg-white/[0.02] dark:text-gray-400">
              No bookings yet — match a passport to a receiver to start a load.
            </p>
          )}
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* RECENT ACTIVITY                                              */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Recent activity">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Recent activity</h2>
            <Link to="/app/audit-trail" className="text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-gray-100 border border-steel-200 bg-white dark:divide-white/5 dark:border-steel-800 dark:bg-white/[0.02]">
            {recentEvents.length === 0 && <li className="p-4 text-theme-sm text-gray-500 dark:text-gray-400">No activity yet.</li>}
            {recentEvents.map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-4 p-4">
                <span className="text-theme-sm text-ink-800 dark:text-gray-200">{event.summary}</span>
                <span className="ledger-numeral shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">{new Date(event.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
              </li>
            ))}
          </ul>
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* RECOVERY AT A GLANCE — the ledger as a closing band          */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Recovery at a glance" className="bg-ink-950 p-6 sm:p-8 dark:bg-black/40">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow-label text-loop-400">Recovery at a glance</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-white">Where the tonnage stands</h2>
            </div>
            <Link to="/app/reports" className="text-sm font-semibold text-loop-300 underline underline-offset-4 hover:text-loop-200">
              Open reports
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-white/15 pt-6 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Surveyed", value: totalT, suffix: " t", reached: true },
              { label: "Matched", value: dataset.materials.filter((m) => dataset.allocations.some((a) => a.materialId === m.id && a.status !== "cancelled")).reduce((s, m) => s + m.quantityT, 0), suffix: " t", reached: matchedCount > 0 },
              { label: "Booked", value: dataset.bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + b.tonnesT, 0), suffix: " t", reached: confirmedCount > 0 },
              { label: "Dispatched", value: dispatchedBookings.reduce((s, b) => s + b.tonnesT, 0), suffix: " t", reached: dispatchedBookings.length > 0 },
              { label: "Verified", value: verifiedT, suffix: " t", reached: verifiedT > 0 },
            ].map((stage) => (
              <div key={stage.label} className={cn("border-t-2 pt-3", stage.reached ? "border-loop-400" : "border-white/15")}>
                <dd className={cn("ledger-numeral text-2xl font-bold", stage.reached ? "text-white" : "text-white/40")}>
                  <Counter value={stage.value} />
                  <span className="text-sm font-semibold text-white/60">{stage.suffix}</span>
                </dd>
                <dt className={cn("eyebrow-label mt-1", stage.reached ? "text-white/70" : "text-white/40")}>{stage.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-white/50">Live figures from the shared recovery ledger — provider and receiver see the same tonnage.</p>
        </section>
      </RevealItem>
    </PageMotion>
  );
}
