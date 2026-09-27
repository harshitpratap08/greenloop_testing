import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import PageMeta from "@/components/common/PageMeta";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";
import AppWindow from "@/components/site/AppWindow";
import CapacityShowpiece from "@/components/site/CapacityShowpiece";
import EditorialHeading from "@/components/site/EditorialHeading";
import Figure from "@/components/site/Figure";
import Reveal from "@/components/site/Reveal";
import Section from "@/components/site/Section";
import WorkflowSticky from "@/components/site/WorkflowSticky";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import StoryFilm from "@/components/site/StoryFilm";
import SystemDiagram from "@/components/site/SystemDiagram";
import { Link } from "react-router";
import { STORY } from "@/domain/demoData";

export default function Landing() {
  return (
    <>
      <PageMeta
        title="GreenLoop — Circular Construction Material Recovery"
        description="Plan where recoverable construction materials go before the truck leaves. Survey, match, reserve, verify."
      />
      <SiteNav />
      <main className="dark bg-ink-950">
        <StoryFilm />
        <ProblemSection />
        <SystemDiagram />
        <WorkflowSticky />
        <PassportSection />
        <CapacityShowpiece />
        <LogisticsSection />
        <VerificationSection />
        <OperationalRecordSection />
        <PlatformShowcase />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

// ---------------------------------------------------------------------------
// 02 · PROBLEM — fragmented recovery, editorial split with annotated photo
// ---------------------------------------------------------------------------

const FRICTIONS = [
  {
    num: "a",
    text: "Quantities live in a surveyor's notebook — tonnage leaves the site uncertain, so nothing downstream can be promised.",
  },
  {
    num: "b",
    text: "Receivers publish static lists, not live capacity. Two projects can be promised the same tonnes on the same day.",
  },
  {
    num: "c",
    text: "Without weighbridge evidence, a recovered load is a claim — and claims get rejected at the gate.",
  },
];

function ProblemSection() {
  return (
    <Section id="problem" index="02" eyebrow="The problem" band innerClassName="lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 py-12 md:py-20">
      <div>
        <EditorialHeading
          lines={[
            <>Recovery fails</>,
            <>between the sites,</>,
            <>not on them.</>,
          ]}
        />
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-md text-base leading-7 text-ink-700 dark:text-gray-300">
            The materials exist. The receivers exist. What is missing is the
            connected plan — quantity, destination, capacity, and proof, in one
            loop.
          </p>
        </Reveal>
      </div>

      <div>
        <Reveal>
          <div className="relative">
            <Figure
              src="/images/site/sorting-facility.jpg"
              alt="Recovered material stockpiles at a sorting and recovery facility"
              caption="Recovery facility intake — capacity that downstream projects cannot currently see"
              credit="demo dataset · Riverstone Aggregates"
              imgClassName="aspect-[16/10]"
            />
            <ol className="mt-6 space-y-3">
              {FRICTIONS.map((friction, index) => (
                <li key={friction.num} className="flex gap-4">
                  <span className="ledger-numeral shrink-0 border border-steel-300 px-2 py-1 text-theme-xs font-semibold text-steel-600 dark:border-steel-700 dark:text-steel-400">
                    ({friction.num})
                  </span>
                  <p className="max-w-xl text-sm leading-6 text-ink-800 dark:text-gray-200">
                    {friction.text}
                    {index === 0 && (
                      <span className="ms-2 hidden lg:inline" aria-hidden="true">
                        — see (a) in the photo
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 05 · MATERIAL PASSPORT — the document, asymmetric with full-height photo
// ---------------------------------------------------------------------------

function PassportSection() {
  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const imgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const cardY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section ref={containerRef} className="relative isolate overflow-hidden bg-ink-950 py-16 md:py-24" id="passport">
      <motion.div className="absolute inset-0 -z-10" style={reduceMotion ? {} : { y: imgY }}>
        <img
          src="/images/site/brick-pallets.jpg"
          alt="Palletised reclaimed brick at a yard"
          className="h-[130%] w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950" />
      </motion.div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">
          <div className="order-2 lg:order-1 relative z-10">
            <EditorialHeading
              lines={[
                <>Every tonne carries</>,
                <>its own record.</>,
              ]}
            />
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-md text-base leading-7 text-white/80">
                Type, quantity range, condition, grade, source project, evidence,
                confidence, status. The passport is what makes a recovered material
                tradeable — and traceable from demolition to verified delivery.
              </p>
            </Reveal>
            <motion.div 
              className="mt-10 relative perspective-[1200px]"
              style={reduceMotion ? {} : { y: cardY }}
            >
              <motion.div 
                className="transform-gpu"
                style={reduceMotion ? {} : { rotateY: 8, rotateX: 5 }}
              >
                <AppWindow
                  route="/app/materials"
                  title="Passport — MP-103 · reclaimed brick"
                  className="shadow-2xl shadow-ink-950/80 border border-white/20 bg-ink-950/90 backdrop-blur-xl"
                >
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <PassportField label="Type" value="Brick — reclaimed, palletised" />
                    <PassportField label="Source project" value="Harrow Road Demolition" />
                    <PassportField label="Quantity" value="14.5 t" highlight />
                    <PassportField label="Range" value="12.0 – 17.0 t" />
                    <PassportField label="Condition" value="Good" />
                    <PassportField label="Grade" value="A" />
                    <PassportField label="Evidence" value="Survey sheet · site photo" />
                    <PassportField label="Confidence" value="90%" highlight />
                  </dl>
                  <p className="mt-4 border-t border-white/15 pt-3 text-theme-xs text-white/60">
                    Status: <span className="font-medium text-loop-300">passport ready</span> —
                    awaiting a receiver allocation.
                  </p>
                </AppWindow>
              </motion.div>
            </motion.div>
          </div>
          <div className="order-1 lg:order-2 hidden lg:block" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}

function PassportField({ label, value, highlight = false }: { label: string; value: string, highlight?: boolean }) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className={`ledger-numeral mt-1 text-theme-sm font-medium ${highlight ? "text-loop-300 drop-shadow-sm" : "text-ink-900 dark:text-white/90"}`}>
        {value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 08 · LOGISTICS — the dispatch event tied to its verified load
// ---------------------------------------------------------------------------

function LogisticsSection() {
  const { dataset } = useGreenLoopStore();
  const dispatch = dataset.events.find((event) => event.kind === "load.dispatched");
  const booking = dispatch && dataset.bookings.find((item) => dispatch.subjectIds.includes(item.id));
  const material = booking && dataset.materials.find((item) => item.id === booking.materialId);
  const receiver = booking && dataset.receivers.find((item) => item.id === booking.receiverId);
  const slot = booking && dataset.slots.find((item) => item.id === booking.slotId);
  const verification = booking && dataset.verifications.find((item) => item.bookingId === booking.id);

  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const truckX = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  if (!dispatch || !booking || !material || !receiver || !slot) return null;

  return (
    <section ref={containerRef} className="relative isolate overflow-hidden bg-ink-950 py-16 md:py-32" id="logistics">
      <motion.div className="absolute inset-0 -z-10" style={reduceMotion ? {} : { x: truckX }}>
         <img
            src="/images/site/auth-truck.jpg"
            alt="A materials truck ready for a coordinated recovery delivery"
            className="h-full w-[120%] max-w-none object-cover opacity-35"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/60 to-transparent" />
         <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950" />
      </motion.div>
      
      <div className="mx-auto max-w-7xl px-5 sm:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="max-w-xl">
            <EditorialHeading
              lines={[<>The load leaves</>, <>with a destination.</>]}
            />
            <Reveal delay={0.12}>
              <p className="mt-6 text-base leading-7 text-white/80">
                A confirmed slot connects the surveyed material to a real receiving yard. The load ID, planned tonnes and delivery evidence stay attached to that journey.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <AppWindow route="/app/deliveries" title={`Dispatch record · ${verification?.loadRef ?? STORY.loadRef}`} className="mt-10 border border-white/20 bg-ink-950/90 backdrop-blur-xl shadow-2xl shadow-ink-950/80">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <PassportField label="Material" value={`${material.type} · ${material.id}`} />
                  <PassportField label="Load reference" value={verification?.loadRef ?? STORY.loadRef} highlight />
                  <PassportField label="Dispatch tonnage" value={`${booking.tonnesT.toFixed(1)} t`} highlight />
                  <PassportField label="Receiver" value={receiver.name} />
                  <PassportField label="Reserved slot" value={slot.date} />
                  <PassportField label="Route distance" value={`${receiver.distanceKm} km`} />
                </dl>
                <div className="mt-6 pt-5 border-t border-white/10 relative overflow-hidden">
                   <div className="flex items-center justify-between text-theme-xs font-mono tracking-widest text-white/60">
                      <span>ORIGIN</span>
                      <div className="relative flex-1 mx-4 h-px bg-white/10">
                         <motion.div 
                            className="absolute inset-y-0 start-0 bg-loop-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                            style={{ width: useTransform(scrollYProgress, [0.3, 0.7], ["0%", "100%"]) }} 
                         />
                      </div>
                      <span>RECEIVER</span>
                   </div>
                </div>
                <Link
                  to="/app/verification"
                  className="mt-6 inline-flex border-b border-white/30 pb-0.5 text-theme-sm font-medium text-white transition-colors hover:border-loop-400 hover:text-loop-300"
                >
                  Follow through to verification
                </Link>
              </AppWindow>
            </Reveal>
          </div>
          <div className="mt-12 lg:mt-auto">
             <div className="backdrop-blur-md bg-ink-950/80 border border-white/20 p-5 rounded-lg flex items-center justify-between shadow-2xl">
                <div>
                  <p className="eyebrow-label text-white/50">Transit Tracking</p>
                  <p className="ledger-numeral mt-1 font-medium text-white text-xl">{verification?.loadRef ?? STORY.loadRef}</p>
                </div>
                <div className="text-right">
                  <p className="text-theme-xs text-white/50 uppercase tracking-wider">{receiver.name}</p>
                  <p className="ledger-numeral mt-1 text-loop-300 font-medium text-lg">{booking.tonnesT.toFixed(1)} t payload</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 09 · VERIFICATION — charcoal band, planned vs actual reconciliation
// ---------------------------------------------------------------------------

function VerificationSection() {
  const { dataset } = useGreenLoopStore();
  const verification = dataset.verifications[0];
  if (!verification) return null;
  const acceptedPct = Math.round((verification.acceptedT / verification.actualT) * 100);
  const rejectedPct = 100 - acceptedPct;

  return (
    <Section id="verification" index="09" eyebrow="Verification" band innerClassName="py-12 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <EditorialHeading
            band
            lines={[
              <>Planned is a claim.</>,
              <>
                <span className="text-loop-400">Accepted is a fact.</span>
              </>,
            ]}
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              Every load closes at the weighbridge. What was planned, what
              arrived, what the receiver accepted — and what was rejected, with
              the reason on the record.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-white/10 bg-white/10 sm:grid-cols-4">
              <ReconCell label="Planned" value={verification.plannedT} delay={0.1} />
              <ReconCell label="Actual" value={verification.actualT} delay={0.3} />
              <ReconCell label="Accepted" value={verification.acceptedT} accent delay={0.5} />
              <ReconCell label="Rejected" value={verification.rejectedT} warn delay={0.7} />
            </div>
            <p className="ledger-numeral mt-3 text-theme-xs text-white/40">
              {verification.loadRef} · {receiverText(verification.receiverId, dataset)} ·{" "}
              {verification.verifiedAt?.slice(0, 10)}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="rounded-sm border border-white/15 bg-white/[0.04] p-6 sm:p-8">
            <p className="eyebrow-label text-white/50">Delivery reconciliation</p>
            <div className="mt-5 flex h-4 w-full overflow-hidden rounded-sm bg-white/10">
              <div className="bg-loop-500" style={{ width: `${acceptedPct}%` }} />
              <div className="bg-error-400" style={{ width: `${rejectedPct}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-theme-xs text-white/60">
              <span className="ledger-numeral">
                accepted {verification.acceptedT.toFixed(1)} t ({acceptedPct}%)
              </span>
              <span className="ledger-numeral">
                rejected {verification.rejectedT.toFixed(1)} t
              </span>
            </div>
            <p className="mt-4 text-sm text-white/70">{verification.rejectReason}</p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {verification.evidence.map((evidence) => (
                <span
                  key={evidence.ref ?? evidence.label}
                  className="rounded-sm border border-white/20 bg-white/5 px-2 py-1 text-theme-xs text-white/80"
                >
                  {evidence.label}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function ReconCell({
  label,
  value,
  accent,
  warn,
  delay = 0,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
  delay?: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="bg-ink-900 p-4 dark:bg-black/60 backdrop-blur-sm"
    >
      <p className="eyebrow-label text-white/40">{label}</p>
      <p
        className={`ledger-numeral mt-1.5 text-xl font-bold ${
          accent ? "text-loop-400" : warn ? "text-error-400" : "text-white"
        }`}
      >
        {value.toFixed(1)} t
      </p>
    </motion.div>
  );
}

function receiverText(id: string, dataset: ReturnType<typeof useGreenLoopStore>["dataset"]) {
  return dataset.receivers.find((r) => r.id === id)?.name ?? id;
}

// ---------------------------------------------------------------------------
// 10 · OPERATIONAL RECORD — figures from the same seeded dataset
// ---------------------------------------------------------------------------

function OperationalRecordSection() {
  const { dataset } = useGreenLoopStore();
  const surveyedTonnes = dataset.materials.reduce((total, material) => total + material.quantityT, 0);
  const acceptedTonnes = dataset.verifications.reduce((total, verification) => total + verification.acceptedT, 0);
  const activeProjects = dataset.projects.filter((project) => project.status !== "complete").length;

  const metrics = [
    { label: "Material surveyed", value: `${surveyedTonnes.toFixed(1)} t` },
    { label: "Accepted at receiver", value: `${acceptedTonnes.toFixed(1)} t` },
    { label: "Active projects", value: activeProjects.toString() },
    { label: "Receiving facilities", value: dataset.receivers.length.toString() },
  ];

  return (
    <Section index="10" eyebrow="Operational record" band innerClassName="py-12 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <EditorialHeading lines={[<>Measured in tonnes.</>, <>Proven at the gate.</>]} />
          <p className="mt-5 max-w-md text-base leading-7 text-ink-700 dark:text-gray-300">
            No projected impact claims. These figures come from the same material, booking and verification records shown in the GreenLoop platform.
          </p>
        </div>
        <dl className="grid grid-cols-2 border-y border-steel-300 dark:border-steel-700 sm:grid-cols-4">
          {metrics.map((metric, index) => (
            <div key={metric.label} className={`py-5 ${index > 0 ? "border-s border-steel-300 ps-4 dark:border-steel-700 sm:ps-5" : "pe-4 sm:pe-5"}`}>
              <dt className="eyebrow-label min-h-9 text-steel-600 dark:text-steel-400">{metric.label}</dt>
              <dd className="ledger-numeral mt-2 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl">{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 11 · PLATFORM SHOWCASE — real routes in flat browser chrome
// ---------------------------------------------------------------------------

function PlatformShowcase() {
  const screens = [
    { route: "/app/dashboard", title: "Operations", text: "Live KPIs, recovery flow, receiver ledgers, holds with reasons." },
    { route: "/app/materials", title: "Materials & passports", text: "Traceable passports with quantity ranges and evidence." },
    { route: "/app/allocations", title: "Allocations", text: "Receiver scoring with the full rationale, holds included." },
    { route: "/app/bookings", title: "Bookings", text: "Reservations with before/after capacity and cancellation." },
  ];

  return (
    <Section id="platform" index="11" eyebrow="The platform" band className="scroll-mt-20" innerClassName="py-12 md:py-20">
      <EditorialHeading
        lines={[
          <>One product, not</>,
          <>a stack of spreadsheets.</>,
        ]}
      />
      <Reveal delay={0.15}>
        <p className="mt-6 max-w-lg text-base leading-7 text-ink-700 dark:text-gray-300">
          Everything on this page is the shipped interface. Open it and run the
          same scenario the marketing claims — the demo controls are on the
          dashboard.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <AppWindow route="/app/dashboard" title="Live Operations · GreenLoop" className="mt-12" bodyClassName="p-0">
          <iframe
            src="/app/dashboard"
            title="Interactive GreenLoop Operations interface"
            loading="lazy"
            className="h-[32rem] w-full border-0 bg-gray-50"
          />
        </AppWindow>
      </Reveal>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {screens.map((screen, index) => (
          <Reveal key={screen.route} delay={index * 0.06}>
            <AppWindow route={screen.route} title={screen.title}>
              <p className="text-sm leading-6 text-ink-800 dark:text-gray-200">{screen.text}</p>
              <Link
                to={screen.route}
                className="mt-4 inline-block border-b border-ink-900 pb-0.5 text-theme-sm font-medium text-ink-900 transition-colors hover:border-loop-600 hover:text-loop-700 dark:border-white dark:text-white dark:hover:border-loop-400 dark:hover:text-loop-300"
              >
                Open in the platform
              </Link>
            </AppWindow>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 12 · FINAL CTA — full-bleed yard photograph, one line
// ---------------------------------------------------------------------------

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <img
        src="/images/site/yard-wide.jpg"
        alt="Wide view of a construction materials recovery yard"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-ink-950/85" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-5 py-28 text-center sm:px-8 md:py-36">
        <EditorialHeading
          band
          level={2}
          className="[&_span.block]:text-balance"
          lines={[
            <>Know what you have.</>,
            <>Know where it can go.</>,
            <>
              Know it <span className="text-loop-400">was received.</span>
            </>,
          ]}
        />
        <Reveal delay={0.2}>
          <Link
            to="/app/dashboard"
            className="mt-10 inline-block rounded-md bg-white px-7 py-4 text-sm font-medium text-ink-900 transition-colors hover:bg-gray-200"
          >
            Enter GreenLoop
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
