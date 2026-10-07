import { computeMatch } from "@shared/domain/capacity";
import { STORY, demoDataset } from "@/domain/demoData";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import MiniLedger from "@/components/site/MiniLedger";
import { cn } from "@/utils";
import type { ReactNode } from "react";

const STEPS = [
  { id: "survey", num: "01", label: "Survey", blurb: "Walk the site. Record what can be recovered — type, tonnage range, condition, grade, evidence." },
  { id: "match", num: "02", label: "Match", blurb: "GreenLoop scores every receiver: suitability, demand, distance, slot availability, transport and handling cost." },
  { id: "reserve", num: "03", label: "Reserve", blurb: "Confirmed tonnage consumes the receiver's ledger. When the day is full, requests hold with an explicit reason." },
  { id: "verify", num: "04", label: "Verify", blurb: "The weighbridge settles it: planned against actual, accepted against rejected. Recovery, evidenced." },
] as const;

/**
 * Sticky workflow narrative — the rail pins while each stage's product-UI
 * panel passes through. All figures are engine output from the live dataset.
 */
export default function WorkflowSticky() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div id="workflow" ref={containerRef} className="relative scroll-mt-20">
      {/* Desktop: sticky rail + passing panels */}
      <div className="mx-auto hidden max-w-7xl gap-16 px-5 py-12 md:py-20 sm:px-8 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="sticky top-24 self-start">
          <p className="eyebrow-label text-steel-600 dark:text-steel-400">04 · Core workflow</p>
          <h2 className="mt-4 font-archivo text-title-md font-bold tracking-[-0.02em] text-ink-900 dark:text-white sm:text-title-lg">
            Survey. Match. Reserve. Verify.
          </h2>
          <div className="mt-10 space-y-1">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-stretch gap-0">
                <div className="relative flex w-6 justify-center">
                  <div className="absolute inset-y-0 w-px bg-steel-300 dark:bg-steel-700" aria-hidden="true" />
                  <motion.div
                    className="absolute top-0 w-px origin-top bg-ink-900 dark:bg-white"
                    style={reduceMotion ? { height: "100%" } : { scaleY: progressScale, height: `${((index + 1) / STEPS.length) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="py-5 pl-5">
                  <p className="flex items-baseline gap-3">
                    <span className="ledger-numeral text-theme-xs font-semibold text-steel-500">
                      {step.num}
                    </span>
                    <span className="font-archivo text-lg font-bold text-ink-900 dark:text-white">
                      {step.label}
                    </span>
                  </p>
                  <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-700 dark:text-gray-300">
                    {step.blurb}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12 py-12">
          <StagePanel step={0}>
            <SurveyPanel />
          </StagePanel>
          <StagePanel step={1}>
            <MatchPanel />
          </StagePanel>
          <StagePanel step={2}>
            <ReservePanel />
          </StagePanel>
          <StagePanel step={3}>
            <VerifyPanel />
          </StagePanel>
        </div>
      </div>

      {/* Mobile: stacked panels, rail hidden */}
      <div className="space-y-16 px-5 py-12 sm:px-8 lg:hidden">
        {STEPS.map((step, index) => (
          <div key={step.id}>
            <p className="flex items-baseline gap-3">
              <span className="ledger-numeral text-theme-xs font-semibold text-steel-500">{step.num}</span>
              <span className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{step.label}</span>
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-700 dark:text-gray-300">{step.blurb}</p>
            <div className="mt-6">
              {index === 0 && <SurveyPanel />}
              {index === 1 && <MatchPanel />}
              {index === 2 && <ReservePanel />}
              {index === 3 && <VerifyPanel />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StagePanel({ step, children }: { step: number; children: ReactNode }) {
  return (
    <div className="lg:min-h-[40vh]">
      <div className="mb-5 flex items-center gap-3 lg:hidden">
        <span className="ledger-numeral text-theme-xs font-semibold text-steel-500">
          {STEPS[step].num}
        </span>
        <span className="font-archivo text-base font-bold text-ink-900 dark:text-white">
          {STEPS[step].label}
        </span>
      </div>
      {children}
    </div>
  );
}

/** 01 SURVEY — a real passport card from the dataset. */
function SurveyPanel() {
  const dataset = demoDataset();
  const material = dataset.materials.find((m) => m.id === STORY.materialAId);
  if (!material) return null;
  const project = dataset.projects.find((p) => p.id === material.projectId);

  return (
    <PanelFrame route="/app/materials" title="Material passport — MP-101">
      <p className="font-archivo text-2xl font-bold capitalize text-ink-900 dark:text-white">
        {material.type}
      </p>
      <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
        {project?.name} · surveyed {material.surveyedAt.slice(0, 10)}
      </p>
      <p className="ledger-numeral mt-4 text-3xl font-bold text-ink-900 dark:text-white">
        {material.quantityT.toFixed(1)} t
      </p>
      <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
        range {material.quantityRangeT[0].toFixed(1)}–{material.quantityRangeT[1].toFixed(1)} t ·
        confidence {Math.round(material.confidence * 100)}%
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {material.evidence.map((evidence) => (
          <span
            key={evidence.ref ?? evidence.label}
            className="rounded-md border border-steel-200 bg-steel-50 px-2 py-1 text-theme-xs text-ink-800 dark:border-steel-800 dark:bg-white/5 dark:text-gray-300"
          >
            {evidence.label}
          </span>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-steel-200 pt-3 dark:border-steel-700">
        <Spec label="Condition" value={material.condition} />
        <Spec label="Grade" value={material.grade} />
        <Spec label="Status" value="passport ready" />
      </dl>
    </PanelFrame>
  );
}

/** 02 MATCH — live engine scoring for the scenario material. */
function MatchPanel() {
  const dataset = demoDataset();
  const candidates = computeMatch(dataset, STORY.materialBId);
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;
  const requestT =
    dataset.materials.find((m) => m.id === STORY.materialBId)?.quantityT ?? 0;

  return (
    <PanelFrame route="/app/allocations" title={`Matching — ${requestT.toFixed(1)} t concrete`}>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {candidates.map((candidate, index) => (
          <li key={candidate.receiverId} className="flex items-center justify-between py-3">
            <div>
              <p className="flex items-center gap-2 text-theme-sm font-medium text-ink-900 dark:text-white/90">
                {receiverName(candidate.receiverId)}
                {index === 0 && (
                  <span className="rounded bg-loop-50 px-1.5 py-0.5 text-theme-xs font-medium text-loop-700 dark:bg-loop-500/15 dark:text-loop-300">
                    recommended
                  </span>
                )}
              </p>
              <p className="ledger-numeral text-theme-xs text-gray-500 dark:text-gray-400">
                {candidate.distanceKm} km · slot free {candidate.availableT.toFixed(1)} t · £
                {candidate.transportCostPerT.toFixed(2)}/t transport
              </p>
            </div>
            <p className="ledger-numeral text-theme-sm font-bold text-ink-900 dark:text-white">
              {candidate.score.toFixed(3)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
        Composite: suitability 40% · demand 25% · slot availability 20% · proximity 15%.
      </p>
    </PanelFrame>
  );
}

/** 03 RESERVE — the live ledger mid-scenario. */
function ReservePanel() {
  const dataset = demoDataset();
  return (
    <div className="space-y-4">
      <PanelFrame route="/app/bookings" title="Reservation ledger — Sep 24">
        <MiniLedger dataset={dataset} slotId={STORY.concreteSlotSept24} />
      </PanelFrame>
      <p className="max-w-md text-theme-sm leading-6 text-ink-700 dark:text-gray-300">
        A confirmed booking is a promise the ledger keeps: the same tonnes cannot
        be promised to a second project.
      </p>
    </div>
  );
}

/** 04 VERIFY — the seeded reconciliation record. */
function VerifyPanel() {
  const dataset = demoDataset();
  const verification = dataset.verifications[0];
  if (!verification) return null;
  const acceptedPct = Math.round((verification.acceptedT / verification.actualT) * 100);

  return (
    <PanelFrame route="/app/verification" title={`Weighbridge — ${verification.loadRef}`}>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Spec label="Planned" value={`${verification.plannedT.toFixed(1)} t`} />
        <Spec label="Actual" value={`${verification.actualT.toFixed(1)} t`} />
        <Spec label="Accepted" value={`${verification.acceptedT.toFixed(1)} t`} accent />
        <Spec label="Rejected" value={`${verification.rejectedT.toFixed(1)} t`} warn />
      </dl>
      <div className="mt-4 flex h-2 w-full overflow-hidden rounded-sm bg-gray-200 dark:bg-white/10">
        <div className="bg-loop-500" style={{ width: `${acceptedPct}%` }} />
        <div className="bg-error-400" style={{ width: `${100 - acceptedPct}%` }} />
      </div>
      <p className="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
        {verification.rejectReason} · evidence: weighbridge ticket, intake photo.
      </p>
    </PanelFrame>
  );
}

function PanelFrame({
  route,
  title,
  children,
}: {
  route: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-steel-200 bg-white shadow-theme-lg dark:border-steel-700 dark:bg-gray-dark">
      <div className="flex items-center justify-between border-b border-steel-200 bg-steel-50 px-4 py-2.5 dark:border-steel-700 dark:bg-white/5">
        <span className="text-theme-xs font-medium text-ink-800 dark:text-gray-200">{title}</span>
        <span className="ledger-numeral text-theme-xs text-steel-600 dark:text-steel-400">
          {route}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Spec({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd
        className={cn(
          "ledger-numeral mt-1 text-theme-sm font-semibold capitalize",
          accent
            ? "text-loop-600 dark:text-loop-400"
            : warn
              ? "text-error-600 dark:text-error-400"
              : "text-ink-900 dark:text-white/90",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
