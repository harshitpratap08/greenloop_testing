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

export default function Landing() {
  return (
    <>
      <PageMeta
        title="GreenLoop — Circular Construction Material Recovery"
        description="Plan where recoverable construction materials go before the truck leaves. Survey, match, reserve, verify."
      />
      <SiteNav />
      <main>
        <StoryFilm />
        <ProblemSection />
        <SystemDiagram />
        <WorkflowSticky />
        <PassportSection />
        <CapacityShowpiece />
        <VerificationSection />
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
    <Section id="problem" index="02" eyebrow="The problem" innerClassName="lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
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
  return (
    <Section
      id="passport"
      index="05"
      eyebrow="Material passport"
      innerClassName="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-16"
    >
      <div className="order-2 lg:order-1">
        <EditorialHeading
          lines={[
            <>Every tonne carries</>,
            <>its own record.</>,
          ]}
        />
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-md text-base leading-7 text-ink-700 dark:text-gray-300">
            Type, quantity range, condition, grade, source project, evidence,
            confidence, status. The passport is what makes a recovered material
            tradeable — and traceable from demolition to verified delivery.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <AppWindow
            route="/app/materials"
            title="Passport — MP-103 · reclaimed brick"
            className="mt-8"
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <PassportField label="Type" value="Brick — reclaimed, palletised" />
              <PassportField label="Source project" value="Harrow Road Demolition" />
              <PassportField label="Quantity" value="14.5 t" />
              <PassportField label="Range" value="12.0 – 17.0 t" />
              <PassportField label="Condition" value="Good" />
              <PassportField label="Grade" value="A" />
              <PassportField label="Evidence" value="Survey sheet · site photo" />
              <PassportField label="Confidence" value="90%" />
            </dl>
            <p className="mt-4 border-t border-steel-200 pt-3 text-theme-xs text-gray-500 dark:border-steel-700 dark:text-gray-400">
              Status: <span className="font-medium text-loop-700 dark:text-loop-300">passport ready</span> —
              awaiting a receiver allocation.
            </p>
          </AppWindow>
        </Reveal>
      </div>

      <div className="order-1 lg:order-2">
        <Reveal delay={0.15}>
          <Figure
            src="/images/site/brick-pallets.jpg"
            alt="Palletised reclaimed brick at a yard"
            caption="Palletised reclaimed brick — the material behind passport MP-103"
            credit="demo dataset · grade A · good condition"
            imgClassName="aspect-[3/4] lg:aspect-auto lg:h-full"
          />
        </Reveal>
      </div>
    </Section>
  );
}

function PassportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow-label text-steel-600 dark:text-steel-400">{label}</dt>
      <dd className="ledger-numeral mt-1 text-theme-sm font-medium text-ink-900 dark:text-white/90">
        {value}
      </dd>
    </div>
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
    <Section id="verification" index="09" eyebrow="Verification" band>
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
            <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-4">
              <ReconCell label="Planned" value={verification.plannedT} />
              <ReconCell label="Actual" value={verification.actualT} />
              <ReconCell label="Accepted" value={verification.acceptedT} accent />
              <ReconCell label="Rejected" value={verification.rejectedT} warn />
            </div>
            <p className="ledger-numeral mt-3 text-theme-xs text-white/40">
              {verification.loadRef} · {receiverText(verification.receiverId, dataset)} ·{" "}
              {verification.verifiedAt?.slice(0, 10)}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="rounded-lg border border-white/15 bg-white/[0.04] p-6 sm:p-8">
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
                  className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-theme-xs text-white/80"
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
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="bg-ink-900 p-4 dark:bg-black">
      <p className="eyebrow-label text-white/40">{label}</p>
      <p
        className={`ledger-numeral mt-1.5 text-xl font-bold ${
          accent ? "text-loop-400" : warn ? "text-error-300" : "text-white"
        }`}
      >
        {value.toFixed(1)} t
      </p>
    </div>
  );
}

function receiverText(id: string, dataset: ReturnType<typeof useGreenLoopStore>["dataset"]) {
  return dataset.receivers.find((r) => r.id === id)?.name ?? id;
}

// ---------------------------------------------------------------------------
// 10/11 · PLATFORM SHOWCASE — real routes in flat browser chrome
// ---------------------------------------------------------------------------

function PlatformShowcase() {
  const screens = [
    { route: "/app/dashboard", title: "Operations", text: "Live KPIs, recovery flow, receiver ledgers, holds with reasons." },
    { route: "/app/materials", title: "Materials & passports", text: "Traceable passports with quantity ranges and evidence." },
    { route: "/app/allocations", title: "Allocations", text: "Receiver scoring with the full rationale, holds included." },
    { route: "/app/bookings", title: "Bookings", text: "Reservations with before/after capacity and cancellation." },
  ];

  return (
    <Section id="platform" index="10" eyebrow="The platform" className="scroll-mt-20">
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

      <div className="mt-12 grid gap-6 md:grid-cols-2">
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
