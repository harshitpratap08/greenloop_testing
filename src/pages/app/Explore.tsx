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
import { computeMatch, slotLedger } from "@/domain/capacity";
import { eventsForSubjects } from "@/domain/events";
import { cn } from "@/utils";
import { motion, useReducedMotion } from "motion/react";
import type { Booking, MaterialPassport } from "@/domain/types";
import { useAuth } from "@/context/AuthContext";
import {
  PageMotion,
  RevealItem,
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
} from "@/config/appMedia";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

const OPERATION_STEPS = ["Survey", "Passport", "Match", "Capacity", "Book", "Send", "Verify"] as const;

type FlowState = "done" | "active" | "next";

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

function FlowSequence({ states }: { states: FlowState[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className="mt-7 space-y-0" aria-label="Current recovery sequence">
      {OPERATION_STEPS.map((step, index) => {
        const state = states[index];
        return (
          <motion.li
            key={step}
            initial={reduceMotion ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduceMotion ? 0 : index * 0.07, duration: 0.35 }}
            className="flex min-h-10 items-center gap-3"
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center border font-mono text-xs font-bold transition-colors duration-300",
                state === "done" && "border-loop-700 bg-loop-700 text-white",
                state === "active" && "border-signal-500 bg-signal-500 text-ink-950",
                state === "next" && "border-steel-300 text-steel-400 dark:border-steel-700 dark:text-steel-500",
              )}
              aria-hidden="true"
            >
              {state === "done" ? "✓" : state === "active" ? "●" : "○"}
            </span>
            <span className={cn(
              "font-archivo text-sm font-bold uppercase tracking-[0.12em]",
              state === "next" ? "text-steel-400 dark:text-steel-500" : "text-ink-900 dark:text-white",
            )}>{step}</span>
            {state === "active" && <span className="ms-auto font-mono text-[10px] uppercase tracking-wider text-signal-600 dark:text-signal-400">Current</span>}
          </motion.li>
        );
      })}
    </ol>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-steel-300 pb-3 dark:border-steel-800">
      <div>
        <p className="eyebrow-label text-steel-500 dark:text-steel-400">{eyebrow}</p>
        <h2 className="mt-1 font-archivo text-2xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const textLinkClass = "text-xs font-bold uppercase tracking-wider text-ink-900 underline decoration-steel-400 underline-offset-4 transition-colors hover:text-loop-700 dark:text-white dark:hover:text-loop-400";
const actionClass = "inline-flex min-h-10 items-center justify-center border border-ink-900 px-3 text-xs font-bold uppercase tracking-wider text-ink-900 transition-colors hover:bg-ink-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-ink-900";

export default function Explore() {
  const { dataset } = useGreenLoopStore();
  const greeting = useGreeting();
  const { user } = useAuth();
  const location = useLocation();
  const selectedId =
    (location.state as { projectId?: string } | null)?.projectId ??
    dataset.projects.find((project) => project.id === STORY_PROJECT_ID)?.id ??
    dataset.projects[0]?.id;
  const project = dataset.projects.find((item) => item.id === selectedId);
  const next = project ? projectNextAction(dataset, project.id) : null;
  const projectMaterials = project ? dataset.materials.filter((material) => material.projectId === project.id) : [];
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
      ? { type: "material", data: unmatchedMaterials[0] }
      : readyToDispatch.length > 0
        ? { type: "dispatch", data: readyToDispatch[0] }
        : awaitingVerification.length > 0
          ? { type: "verify", data: awaitingVerification[0] }
          : null;

  const projectStages = project ? projectSteps(dataset, project.id) : null;
  const stageIndex = projectStages ? currentStepIndex(projectStages) : 0;
  const totalT = dataset.materials.reduce((sum, material) => sum + material.quantityT, 0);
  const verifiedT = dataset.verifications.reduce((sum, verification) => sum + verification.acceptedT, 0);
  const activeAllocations = dataset.allocations.filter((allocation) => allocation.status !== "cancelled");
  const matchedCount = dataset.materials.filter((material) => activeAllocations.some((allocation) => allocation.materialId === material.id)).length;
  const confirmedBookings = dataset.bookings.filter((booking) => booking.status === "confirmed");
  const confirmedCount = confirmedBookings.length;
  const capacity = dataset.slots.reduce((totals, slot) => {
    const ledger = slotLedger(dataset, slot.id);
    if (!ledger) return totals;
    return {
      available: totals.available + ledger.available,
      reserved: totals.reserved + ledger.reserved,
      held: totals.held + ledger.heldT,
    };
  }, { available: 0, reserved: 0, held: 0 });
  const recentEvents = project ? eventsForSubjects(dataset, [project.id]).slice(0, 5) : [];
  const incomingBookings = dataset.bookings.filter((booking) => booking.status !== "cancelled").slice(0, 3);
  const primaryMaterial = unmatchedMaterials[0];
  const candidates = primaryMaterial ? computeMatch(dataset, primaryMaterial.id).slice(0, 3) : [];
  const openDemand = dataset.demands.find((demand) => demand.status === "OPEN" || demand.status === "PARTIALLY_COVERED");
  const demandNote = openDemand ? `${openDemand.requiredT.toFixed(1)} t of ${openDemand.materialType} demand is open in the network` : null;
  const materialMatched = dataset.materials.length > 0 && matchedCount === dataset.materials.length;
  const dispatchedT = dispatchedBookings.reduce((sum, booking) => sum + booking.tonnesT, 0);
  const bookedT = dataset.bookings.filter((booking) => booking.status !== "cancelled").reduce((sum, booking) => sum + booking.tonnesT, 0);
  const flowComplete = [
    dataset.materials.length > 0,
    dataset.materials.length > 0,
    materialMatched,
    confirmedCount > 0,
    confirmedCount > 0,
    dispatchedBookings.length > 0,
    verifiedT > 0,
  ];
  const activeFlowStep = flowComplete.findIndex((complete) => !complete);
  const flowStates: FlowState[] = flowComplete.map((complete, index) =>
    complete ? "done" : index === activeFlowStep ? "active" : "next",
  );

  return (
    <PageMotion className="mx-auto max-w-[1440px] pb-20">
      <PageMeta
        title="Home | GreenLoop"
        description="Your active recovery: material on the ground, receiving capacity, and the next load to move."
      />

      <RevealItem>
        <header className="grid overflow-hidden border border-steel-300 bg-gray-50 dark:border-steel-800 dark:bg-ink-950 lg:grid-cols-[1.55fr_0.75fr]">
          <div className="group relative isolate flex min-h-[390px] flex-col justify-end overflow-hidden p-6 sm:min-h-[440px] sm:p-9 lg:min-h-[500px] lg:p-12">
            <img
              src={project ? projectMediaFor(project).src : ambientMedia.surveyHero.src}
              alt={project ? projectMediaFor(project).alt : ambientMedia.surveyHero.alt}
              fetchPriority="high"
              className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950/90 via-ink-950/35 to-ink-950/20" aria-hidden="true" />
            <div className="max-w-2xl">
              <p className="eyebrow-label text-loop-300">GREENLOOP OPERATIONS</p>
              <h1 className="mt-3 font-archivo text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">RECOVERY IN MOTION</h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
                Material moves from demolition to receiver, with every handoff recorded.
              </p>
              {(project || user?.name) && (
                <p className="mt-6 border-s-2 border-loop-400 ps-3 text-xs font-semibold uppercase tracking-wider text-white/80">
                  {project?.name ?? `${greeting}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
                  {project?.location ? ` · ${project.location}` : ""}
                </p>
              )}
            </div>
            <div className="mt-8 grid grid-cols-3 border-t border-white/25 pt-5">
              <div className="pe-2 sm:pe-5">
                <p className="ledger-numeral text-2xl font-bold text-white sm:text-3xl"><Counter value={totalT} /><span className="ms-1 text-sm">t</span></p>
                <p className="eyebrow-label mt-1 text-white/65">Surveyed tonnes</p>
              </div>
              <div className="border-s border-white/25 px-3 sm:px-5">
                <p className="ledger-numeral text-2xl font-bold text-loop-300 sm:text-3xl"><Counter value={verifiedT} /><span className="ms-1 text-sm">t</span></p>
                <p className="eyebrow-label mt-1 text-white/65">Verified tonnes</p>
              </div>
              <div className="border-s border-white/25 ps-3 sm:ps-5">
                <p className="ledger-numeral text-2xl font-bold text-white sm:text-3xl"><Counter value={dataset.bookings.length} decimals={0} /></p>
                <p className="eyebrow-label mt-1 text-white/65">Bookings</p>
              </div>
            </div>
          </div>

          <aside className="border-t border-steel-300 bg-gray-25 p-6 dark:border-steel-800 dark:bg-black/30 sm:p-8 lg:border-s lg:border-t-0 lg:p-9" aria-label="Live recovery sequence">
            <div className="flex items-start justify-between gap-3 border-b border-steel-300 pb-4 dark:border-steel-800">
              <div>
                <p className="eyebrow-label text-steel-500 dark:text-steel-400">Operations sequence</p>
                <h2 className="mt-1 font-archivo text-lg font-bold uppercase tracking-wide text-ink-900 dark:text-white">Live recovery flow</h2>
              </div>
              <span className="mt-1 size-2 shrink-0 bg-loop-600" aria-label="Live" />
            </div>
            <FlowSequence states={flowStates} />
          </aside>
        </header>
      </RevealItem>

      {primaryTask && (
        <RevealItem className="mt-6">
          <section className="flex flex-col gap-4 border-s-4 border-signal-500 bg-white p-5 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Next operational action">
            <div className="min-w-0">
              <p className="eyebrow-label text-signal-700 dark:text-signal-400">Next operational action</p>
              {primaryTask.type === "material" && <p className="mt-1 font-archivo text-lg font-bold uppercase text-ink-900 dark:text-white">{primaryTask.data.quantityT.toFixed(1)} t {TYPE_LABEL[primaryTask.data.type]} · find a receiver</p>}
              {primaryTask.type === "dispatch" && <p className="mt-1 font-archivo text-lg font-bold uppercase text-ink-900 dark:text-white">{primaryTask.data.tonnesT.toFixed(1)} t ready to send</p>}
              {primaryTask.type === "verify" && <p className="mt-1 font-archivo text-lg font-bold uppercase text-ink-900 dark:text-white">{primaryTask.data.tonnesT.toFixed(1)} t awaiting verification</p>}
              {primaryTask.type === "material" && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{dataset.projects.find((item) => item.id === primaryTask.data.projectId)?.name ?? "Project"} · passport {primaryTask.data.id}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {primaryTask.type === "material" && <>
                <Link to="/app/receivers" state={{ materialId: primaryTask.data.id }} className={actionClass}>Find receiver</Link>
                <Link to={`/app/materials/${primaryTask.data.id}`} className={actionClass}>View passport</Link>
              </>}
              {primaryTask.type === "dispatch" && <Link to="/app/deliveries" className={actionClass}>Send load</Link>}
              {primaryTask.type === "verify" && <Link to="/app/deliveries" className={actionClass}>View delivery</Link>}
            </div>
          </section>
        </RevealItem>
      )}

      <RevealItem className="mt-10">
        <section aria-label="Materials in motion">
          <SectionHeading
            eyebrow="Passports · quantity · condition · provenance"
            title="Materials in motion"
            action={<Link to="/app/materials" className={textLinkClass}>All materials</Link>}
          />
          {dataset.materials.length > 0 ? (
            <ul className="grid gap-px border border-steel-300 bg-steel-300 dark:border-steel-800 dark:bg-steel-800 sm:grid-cols-2 xl:grid-cols-3" aria-label="Material passports">
              {dataset.materials.map((material) => {
                const allocation = activeAllocations.find((item) => item.materialId === material.id);
                const receiver = allocation ? dataset.receivers.find((item) => item.id === allocation.receiverId) : undefined;
                const materialProject = dataset.projects.find((item) => item.id === material.projectId);
                const isPrimary = primaryMaterial?.id === material.id;
                return (
                  <li key={material.id} className="min-w-0 bg-gray-25 dark:bg-ink-950">
                    <article className="group flex h-full flex-col">
                      <Link to={`/app/materials/${material.id}`} className="relative block aspect-[16/8] overflow-hidden" aria-label={`Open ${TYPE_LABEL[material.type]} passport ${material.id}`}>
                        <img src={materialMediaFor(material.type).src} alt={materialMediaFor(material.type).alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        <span className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-transparent" aria-hidden="true" />
                        <span className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
                          <span className="font-archivo text-lg font-bold uppercase tracking-wide">{TYPE_LABEL[material.type] ?? material.type}</span>
                          <span className="ledger-numeral text-lg font-bold">{material.quantityT.toFixed(1)} t</span>
                        </span>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="ledger-numeral text-[11px] text-steel-500 dark:text-steel-400">{material.id} · Grade {material.grade}</span>
                          <StatusChip status={materialChip(material)} label={material.status} />
                        </div>
                        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 border-t border-steel-200 pt-3 dark:border-steel-800">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{materialProject?.name ?? material.projectId}</p>
                            <p className="mt-0.5 text-xs capitalize text-gray-500 dark:text-gray-400">{material.condition} condition · {material.evidence.length} evidence records</p>
                          </div>
                          {receiver && <span className="max-w-32 truncate self-start text-end text-xs text-gray-500 dark:text-gray-400">{receiver.name}</span>}
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-steel-200 pt-3 dark:border-steel-800">
                          <Link to={`/app/materials/${material.id}`} className={textLinkClass}>View passport</Link>
                          {!allocation && material.status !== "verified" && material.status !== "dispatched" && (
                            <Link to="/app/receivers" state={{ materialId: material.id }} className={cn(textLinkClass, "ms-auto", isPrimary && "text-loop-700 dark:text-loop-400")}>Find receiver</Link>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="border border-steel-300 bg-white p-6 dark:border-steel-800 dark:bg-white/[0.02]">
              <p className="text-sm text-gray-600 dark:text-gray-400">No surveyed material yet.</p>
              <Link to="/app/materials/new" className={cn(actionClass, "mt-4")}>Start a survey</Link>
            </div>
          )}
        </section>
      </RevealItem>

      <RevealItem className="mt-10">
        <section aria-label="Recovery network">
          <SectionHeading
            eyebrow="Receiver matches · distance · open intake"
            title="Where can it go?"
            action={<Link to="/app/receivers" className={textLinkClass}>Find a receiver</Link>}
          />
          {primaryMaterial && candidates.length > 0 ? (
            <div className="grid gap-px border border-steel-300 bg-steel-300 dark:border-steel-800 dark:bg-steel-800 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="flex flex-col justify-between bg-gray-100 p-5 dark:bg-black/30 sm:p-6">
                <div>
                  <p className="eyebrow-label text-steel-500 dark:text-steel-400">Matching against passport</p>
                  <p className="mt-2 font-archivo text-2xl font-bold uppercase text-ink-900 dark:text-white">{TYPE_LABEL[primaryMaterial.type]}</p>
                  <p className="ledger-numeral mt-1 text-sm text-gray-600 dark:text-gray-400">{primaryMaterial.quantityT.toFixed(1)} t · {primaryMaterial.id}</p>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{dataset.projects.find((item) => item.id === primaryMaterial.projectId)?.name ?? primaryMaterial.projectId}</p>
                </div>
                <Link to="/app/receivers" state={{ materialId: primaryMaterial.id }} className={cn(actionClass, "mt-6 w-fit")}>Compare receivers</Link>
              </div>
              <ul className="divide-y divide-steel-200 bg-gray-25 dark:divide-steel-800 dark:bg-ink-950">
                {candidates.map((candidate, index) => {
                  const receiver = dataset.receivers.find((item) => item.id === candidate.receiverId);
                  if (!receiver) return null;
                  const label = candidate.recommended ? "Recommended" : candidate.availableT > 0 ? "Capacity available" : "No open capacity";
                  const status: KitStatus = candidate.recommended ? "available" : candidate.availableT > 0 ? "limited" : "waiting";
                  return (
                    <li key={candidate.receiverId} className="p-4 transition-colors hover:bg-white dark:hover:bg-white/[0.03] sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <img src={receiverMediaFor(candidate.receiverId).src} alt={receiverMediaFor(candidate.receiverId).alt} loading="lazy" className="hidden size-16 shrink-0 border border-steel-300 object-cover sm:block dark:border-steel-700" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-archivo text-base font-bold text-ink-900 dark:text-white"><span className="ledger-numeral me-2 text-xs text-steel-400">0{index + 1}</span>{receiver.name}</h3>
                            <StatusChip status={status} label={label} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>{candidate.distanceKm} km away</span>
                            <span className="ledger-numeral">{candidate.availableT.toFixed(1)} t available</span>
                            <span>Accepts {TYPE_LABEL[primaryMaterial.type]}</span>
                          </div>
                        </div>
                        <Link to="/app/receivers" state={{ materialId: primaryMaterial.id }} className={cn(textLinkClass, "hidden shrink-0 sm:inline")}>Open match</Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="border border-steel-300 bg-gray-25 p-5 dark:border-steel-800 dark:bg-white/[0.02]">
              <p className="text-sm text-gray-600 dark:text-gray-400">{dataset.materials.length ? "All surveyed material is already matched or moving." : "Add a material passport to see suitable receivers and available capacity."}</p>
              <Link to={primaryMaterial ? "/app/receivers" : "/app/materials/new"} state={primaryMaterial ? { materialId: primaryMaterial.id } : undefined} className={cn(textLinkClass, "mt-3 inline-block")}>{primaryMaterial ? "Open receiver matching" : "Start a survey"}</Link>
            </div>
          )}
          {demandNote && <p className="mt-3 border-s-2 border-signal-500 ps-3 text-xs text-gray-600 dark:text-gray-400">{demandNote}.</p>}
        </section>
      </RevealItem>

      <RevealItem className="mt-10">
        <section aria-label="Receiving capacity">
          <SectionHeading eyebrow="Network intake resource" title="Capacity" action={<Link to="/app/receivers" className={textLinkClass}>Browse network</Link>} />
          <dl className="grid border border-steel-300 bg-gray-25 dark:border-steel-800 dark:bg-ink-950 sm:grid-cols-3">
            {([
              { label: "Available", value: capacity.available, color: "border-loop-600", text: "text-loop-700 dark:text-loop-400" },
              { label: "Reserved", value: capacity.reserved, color: "border-ink-900 dark:border-white", text: "text-ink-900 dark:text-white" },
              { label: "Held", value: capacity.held, color: "border-signal-500", text: "text-signal-700 dark:text-signal-400" },
            ]).map((item, index) => (
              <div key={item.label} className={cn("border-t-2 p-5 sm:p-6", item.color, index > 0 && "sm:border-s sm:border-t-2 sm:border-s-steel-200 dark:sm:border-s-steel-800")}>
                <dt className="eyebrow-label text-steel-500 dark:text-steel-400">{item.label}</dt>
                <dd className={cn("ledger-numeral mt-2 text-3xl font-bold", item.text)}><Counter value={item.value} /><span className="ms-1 text-sm font-semibold">t</span></dd>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Across recorded intake slots</p>
              </div>
            ))}
          </dl>
        </section>
      </RevealItem>

      {project && (
        <RevealItem className="mt-10">
          <section aria-label="Active recovery project" className="grid border border-steel-300 bg-gray-25 dark:border-steel-800 dark:bg-ink-950 md:grid-cols-[0.85fr_1.15fr]">
            <Link to="/app/projects" state={{ projectId: project.id }} className="group relative min-h-56 overflow-hidden md:min-h-72" aria-label={`Open project ${project.name}`}>
              <img src={projectMediaFor(project).src} alt={projectMediaFor(project).alt} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" aria-hidden="true" />
              <span className="absolute inset-x-5 bottom-5 text-white sm:inset-x-6">
                <span className="eyebrow-label text-white/70">Project · {project.location}</span>
                <span className="mt-1 block font-archivo text-2xl font-bold uppercase">{project.name}</span>
                <span className="ledger-numeral mt-1 block text-xs text-white/80">{projectMaterials.reduce((sum, material) => sum + material.quantityT, 0).toFixed(1)} t surveyed · {projectMaterials.length} passports</span>
              </span>
            </Link>
            <div className="flex flex-col justify-between gap-6 p-5 sm:p-7">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-steel-200 pb-3 dark:border-steel-800">
                  <div>
                    <p className="eyebrow-label text-steel-500 dark:text-steel-400">Project status · {project.status}</p>
                    <h2 className="mt-1 font-archivo text-xl font-bold uppercase text-ink-900 dark:text-white">{OPERATION_STEPS[Math.min(stageIndex, OPERATION_STEPS.length - 1)]} next</h2>
                  </div>
                  <span className="ledger-numeral text-xs text-steel-500 dark:text-steel-400">{project.id}</span>
                </div>
                {next && <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{next.reason}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={next?.to ?? "/app/projects"} state={next?.to === "/app/receivers" && primaryMaterial ? { materialId: primaryMaterial.id } : undefined} className={actionClass}>{next?.label ?? "View projects"}</Link>
                <Link to="/app/materials/new" className={cn(actionClass, "border-steel-300 dark:border-steel-700")}>New survey</Link>
                <Link to="/app/projects" state={{ projectId: project.id }} className={cn(textLinkClass, "self-center px-2")}>All projects</Link>
              </div>
            </div>
          </section>
        </RevealItem>
      )}

      {incomingBookings.length > 0 && (
        <RevealItem className="mt-10">
          <section aria-label="Delivery and recovery status">
            <SectionHeading eyebrow="Dispatch · delivery · proof" title="Where is my load?" action={<Link to="/app/deliveries" className={textLinkClass}>Track deliveries</Link>} />
            <ul className="grid gap-px border border-steel-300 bg-steel-300 dark:border-steel-800 dark:bg-steel-800 lg:grid-cols-3">
              {incomingBookings.map((booking) => {
                const dispatched = dispatchedBookings.some((item) => item.id === booking.id);
                const verified = dataset.verifications.some((item) => item.bookingId === booking.id);
                const chip = bookingChip(booking.status, dispatched);
                const receiver = dataset.receivers.find((item) => item.id === booking.receiverId);
                const material = dataset.materials.find((item) => item.id === booking.materialId);
                return (
                  <li key={booking.id} className="min-w-0 bg-gray-25 dark:bg-ink-950">
                    <Link to="/app/deliveries" className="group block h-full p-5 transition-colors hover:bg-white dark:hover:bg-white/[0.03]">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="ledger-numeral text-[11px] text-steel-500 dark:text-steel-400">{booking.id}</p>
                          <h3 className="mt-1 font-archivo text-base font-bold uppercase text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t {TYPE_LABEL[material?.type ?? ""] ?? material?.type ?? "material"}</h3>
                        </div>
                        <StatusChip status={chip.status} label={chip.label} />
                      </div>
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">To {receiver?.name ?? booking.receiverId} · {dispatched ? "On the road" : verified ? "Delivered" : booking.status === "hold" ? "Slot pending" : "Slot booked"}</p>
                      <div className="mt-4"><JourneyStrip current={verified ? 4 : dispatched ? 2 : booking.status === "confirmed" ? 1 : 0} /></div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-900 underline decoration-steel-400 underline-offset-4 group-hover:text-loop-700 dark:text-white">Open delivery</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </RevealItem>
      )}

      <RevealItem className="mt-10">
        <section aria-label="Recent activity">
          <SectionHeading eyebrow="Project event log" title="Recent activity" action={<Link to="/app/audit-trail" className={textLinkClass}>View all</Link>} />
          <ul className="divide-y divide-steel-200 border border-steel-300 bg-gray-25 dark:divide-steel-800 dark:border-steel-800 dark:bg-ink-950">
            {recentEvents.length === 0 && <li className="p-4 text-sm text-gray-500 dark:text-gray-400">No activity yet.</li>}
            {recentEvents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 px-4 py-3">
                <span className="text-sm text-ink-800 dark:text-gray-200">{event.summary}</span>
                <time dateTime={event.at} className="ledger-numeral shrink-0 text-xs text-steel-500 dark:text-steel-400">{new Date(event.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</time>
              </li>
            ))}
          </ul>
        </section>
      </RevealItem>

      <RevealItem className="mt-10">
        <section aria-label="Recovery at a glance" className="border border-ink-950 bg-ink-950 p-5 text-white dark:border-black dark:bg-black sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/20 pb-4">
            <div>
              <p className="eyebrow-label text-loop-300">Recovery at a glance</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold uppercase tracking-tight text-white">Tonnage through the chain</h2>
            </div>
            <Link to="/app/reports" className="text-xs font-bold uppercase tracking-wider text-loop-300 underline underline-offset-4 hover:text-loop-200">Open reports</Link>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Surveyed", value: totalT, reached: dataset.materials.length > 0 },
              { label: "Matched", value: dataset.materials.filter((material) => activeAllocations.some((allocation) => allocation.materialId === material.id)).reduce((sum, material) => sum + material.quantityT, 0), reached: matchedCount > 0 },
              { label: "Booked", value: bookedT, reached: confirmedCount > 0 },
              { label: "Dispatched", value: dispatchedT, reached: dispatchedBookings.length > 0 },
              { label: "Verified", value: verifiedT, reached: verifiedT > 0 },
            ].map((stage) => (
              <div key={stage.label} className={cn("mt-5 border-t-2 pt-3", stage.reached ? "border-loop-400" : "border-white/20")}>
                <dd className={cn("ledger-numeral text-2xl font-bold", stage.reached ? "text-white" : "text-white/40")}><Counter value={stage.value} /><span className="ms-1 text-sm font-semibold text-white/60">t</span></dd>
                <dt className={cn("eyebrow-label mt-1", stage.reached ? "text-white/70" : "text-white/40")}>{stage.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-white/50">Live figures from the shared recovery ledger.</p>
        </section>
      </RevealItem>
    </PageMotion>
  );
}
