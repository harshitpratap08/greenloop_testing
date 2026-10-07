import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import AnimatedConnector from "@/components/site/AnimatedConnector";
import { CapacityBar } from "@/components/site/CapacityAnimation";
import CapacityAnimation from "@/components/site/CapacityAnimation";
import Counter from "@/components/site/Counter";
import MaterialPassportReveal from "@/components/site/MaterialPassportReveal";
import NetworkFlow from "@/components/site/NetworkFlow";
import ScrollReveal from "@/components/site/ScrollReveal";
import SiteFooter from "@/components/site/SiteFooter";
import SiteNav from "@/components/site/SiteNav";
import VideoBackground from "@/components/site/VideoBackground";
import WorkflowSequence from "@/components/site/WorkflowSequence";
import { siteVideos } from "@/config/siteMedia";

const providerSteps = ["Survey", "Material Passport", "Find Receiver", "Request Capacity", "Book", "Send Load", "Verify"];
const receiverSteps = ["Material Request", "Receive Offers", "Review Passport", "Accept", "Capacity", "Receive", "Verify"];
const workflowSteps = ["Survey", "Passport", "Match", "Capacity", "Book", "Send", "Receive", "Verify"];
const networkStages = [
  { title: "Capacity", detail: "Check available tonnes for the intake date." },
  { title: "Booking", detail: "Reserve a receiving slot for the load." },
  { title: "Delivery", detail: "Send the load to the receiving facility." },
  { title: "Verified recovery", detail: "Record received and accepted quantities." },
];
const problemPoints = [
  "Quantities are uncertain",
  "Suitable receivers are unclear",
  "Capacity is limited by date",
  "Arrivals compete for space",
  "Delivery evidence can be incomplete",
  "Accepted quantities can differ",
];
const matchFactors = ["SUITABILITY", "DISTANCE", "DEMAND", "STORAGE", "CAPACITY", "DATE"];

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const [siteTheme, setSiteTheme] = useState<"light" | "dark">(() =>
    window.localStorage.getItem("greenloop.site-theme") === "light" ? "light" : "dark",
  );
  const toggleSiteTheme = () => {
    const nextTheme = siteTheme === "light" ? "dark" : "light";
    window.localStorage.setItem("greenloop.site-theme", nextTheme);
    setSiteTheme(nextTheme);
  };

  return (
    <div data-site-theme={siteTheme} className={`public-site min-h-screen overflow-x-clip ${siteTheme === "dark" ? "bg-ink-950 text-white" : "bg-gray-50 text-ink-900"}`}>
      <PageMeta
        title="GreenLoop — The operating layer for construction material recovery"
        description="Connect recovered construction materials with organizations that need them. Coordinate demand, receiving capacity, bookings, delivery, and verification in one network."
      />
      <SiteNav theme={siteTheme} onToggleTheme={toggleSiteTheme} />
      <main>
        {/* 01 · HERO — the physical world happening behind the coordination layer */}
        <HeroBeat />
        {/* 02 · TWO WORLDS — provider site and receiver facility converge */}
        <TwoWorldsBeat />
        {/* 03 · MATERIAL PASSPORT — physical pile becomes a digital record */}
        <PassportBeat />
        {/* 04 · GREENLOOP MATCH — the living coordination system */}
        <MatchBeat />
        {/* 05 · THE GAP BETWEEN SITES — the problem, on real footage */}
        <ProblemBeat />
        {/* 06 · CAPACITY — a live receiving day, not a dashboard */}
        <CapacitySceneBeat />
        {/* 07 · TWO-PROJECT CAPACITY STORY — scroll-driven simulation */}
        <CapacityAnimation video={siteVideos.capacity} />
        {/* 08 · BOOKING → DELIVERY — the load moves */}
        <DeliveryBeat />
        {/* 09 · VERIFICATION — proof, recorded */}
        <VerificationBeat />
        {/* 10 · ONE NETWORK — everything connects */}
        <NetworkBeat />
      </main>
      <SiteFooter />
    </div>
  );

  // ───────────────────────────────────────────────────────────────────────────

  function HeroBeat() {
    const ref = useRef<HTMLDivElement>(null);
    const scroll = useScroll({ target: ref, offset: ["start start", "end start"] });
    const videoY = useTransform(scroll.scrollYProgress, [0, 1], ["0%", "22%"]);
    const videoScale = useTransform(scroll.scrollYProgress, [0, 1], [1, 1.12]);
    const contentY = useTransform(scroll.scrollYProgress, [0, 1], ["0%", "-14%"]);
    const contentOpacity = useTransform(scroll.scrollYProgress, [0, 0.75], [1, 0]);

    return (
      <section ref={ref} className="relative h-[130vh]" aria-label="GreenLoop introduction">
        <div className="sticky top-0 flex min-h-screen items-center overflow-hidden">
          {/* Cinematic footage, drifting behind the interface */}
          <motion.div className="absolute inset-0" style={reduceMotion ? undefined : { y: videoY, scale: videoScale }}>
            <VideoBackground
              video={siteVideos.hero}
              videoClassName="brightness-[0.72] contrast-[0.9] saturate-[0.85]"
              overlayClassName="bg-linear-to-r from-ink-950/90 via-ink-950/75 to-ink-950/65"
            />
          </motion.div>
          <motion.div
            className="relative mx-auto grid w-full max-w-app items-center gap-section px-5 py-24 sm:px-section lg:gl-golden-columns"
            style={reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }}
          >
            <div className="max-w-3xl">
              <motion.p
                className="eyebrow-label flex items-center gap-3 text-white/65"
                {...entrance(reduceMotion, 0)}
              >
                <span className="size-2 bg-loop-400" aria-hidden="true" />
                Construction material recovery network
              </motion.p>
              <motion.h1
                className="mt-7 font-archivo text-5xl font-bold leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-8xl"
                {...entrance(reduceMotion, 0.12)}
              >
                GREEN<span className="text-loop-400">LOOP</span>
              </motion.h1>
              <motion.p
                className="mt-6 max-w-2xl font-archivo text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl"
                {...entrance(reduceMotion, 0.24)}
              >
                The operating layer for construction material recovery.
              </motion.p>
              <motion.p
                className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg"
                {...entrance(reduceMotion, 0.36)}
              >
                Connect recovered materials with the organizations that need them — while coordinating capacity, bookings, delivery and verification.
              </motion.p>
              <motion.div className="mt-9 flex flex-wrap gap-3" {...entrance(reduceMotion, 0.48)}>
                <a href="#network" className="inline-flex min-h-12 items-center justify-center bg-loop-500 px-6 text-sm font-bold text-ink-950 transition-colors hover:bg-loop-400">Explore GreenLoop</a>
                <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center border border-white/35 px-6 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10">See how it works</a>
              </motion.div>
            </div>

            {/* Live coordination readout */}
            <motion.div
              className="relative mx-auto w-full max-w-lg lg:ms-auto"
              {...entrance(reduceMotion, 0.6)}
            >
              <div className="absolute -inset-3 border border-white/[0.08]" aria-hidden="true" />
              <div className="relative rounded-surface border border-white/10 bg-ink-950/90 gl-card-pad shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <p className="eyebrow-label text-white/55">One network · two sides</p>
                  <span className="ledger-numeral text-xs text-loop-300">GREENLOOP</span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-6 sm:gap-4">
                  <div className="border border-white/15 bg-white/[0.04] p-3 sm:p-4">
                    <p className="eyebrow-label text-white/45">Provider</p>
                    <p className="mt-2 font-archivo text-base font-semibold sm:text-lg">Material</p>
                    <p className="ledger-numeral mt-1 text-xs text-white/55">15 t concrete</p>
                  </div>
                  <MatchPulse reduceMotion={reduceMotion} />
                  <div className="border border-white/15 bg-white/[0.04] p-3 sm:p-4">
                    <p className="eyebrow-label text-white/45">Receiver</p>
                    <p className="mt-2 font-archivo text-base font-semibold sm:text-lg">Demand</p>
                    <p className="ledger-numeral mt-1 text-xs text-white/55">50 t requested</p>
                  </div>
                </div>
                <div className="border-t border-white/15 pt-4">
                  <div className="relative flex items-center justify-between gap-3 text-xs text-white/60">
                    <span>DEMAND</span>
                    <span className="h-px flex-1 bg-white/20" />
                    <span className="text-loop-300">CAPACITY-AWARE MATCH</span>
                    <span className="relative h-px flex-1 bg-white/20">
                      {!reduceMotion && (
                        <motion.span
                          className="absolute -top-[3px] size-1.5 bg-loop-300"
                          animate={{ left: ["0%", "96%"], opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span>DELIVERY</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/70">Material, receiving space and a real delivery plan — connected before the load moves.</p>
                </div>
              </div>
              <p className="mt-4 text-end font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Material → GreenLoop → Receiver</p>
            </motion.div>
          </motion.div>

          {/* Scroll instruction — the transition cue */}
          <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center" aria-hidden="true">
            <motion.span
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50"
              animate={reduceMotion ? undefined : { y: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
              transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              Scroll · the story loads below
            </motion.span>
          </div>
        </div>
      </section>
    );
  }

  function TwoWorldsBeat() {
    return (
      <section id="product" className="relative scroll-mt-24 border-b border-white/10 bg-ink-950">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="mb-12 max-w-3xl">
            <ScrollReveal>
              <p className="eyebrow-label text-loop-300">One network. Two sides.</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Different work. A shared recovery flow.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Providers structure available material. Receivers describe what they need and when they can take it. GreenLoop coordinates the steps between them.</p>
            </ScrollReveal>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Provider world — slides in from the inline start */}
            <ScrollReveal direction="start" distance={64}>
              <article id="providers" className="group relative scroll-mt-24 overflow-hidden border border-white/15">
                <div className="absolute inset-0" aria-hidden="true">
                  <VideoBackground
                    video={siteVideos.providerWorld}
                    objectPosition="center 30%"
                    overlayClassName="bg-gradient-to-t from-ink-950 via-ink-950/78 to-ink-950/45"
                  />
                </div>
                <div className="relative p-5 sm:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-4">
                    <h3 className="font-archivo text-2xl font-bold sm:text-3xl">I have material.</h3>
                    <span className="eyebrow-label text-white/50">Provider workflow</span>
                  </div>
                  <WorkflowSequence steps={providerSteps} accent="loop" className="mt-5 min-h-[21rem]" />
                  <Link to="/sign-up" className="mt-6 inline-flex min-h-11 items-center border border-white/25 bg-ink-950/70 px-4 text-sm font-semibold transition-colors hover:border-loop-300 hover:bg-loop-500/10">
                    I have material<span className="ms-3 text-loop-300" aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            </ScrollReveal>

            {/* Receiver world — slides in from the inline end */}
            <ScrollReveal direction="end" distance={64}>
              <article id="receivers" className="group relative scroll-mt-24 overflow-hidden border border-white/15">
                <div className="absolute inset-0" aria-hidden="true">
                  <VideoBackground
                    video={siteVideos.receiverWorld}
                    overlayClassName="bg-gradient-to-t from-ink-950 via-ink-950/78 to-ink-950/45"
                  />
                </div>
                <div className="relative p-5 sm:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/10 pb-4">
                    <h3 className="font-archivo text-2xl font-bold sm:text-3xl">I need material.</h3>
                    <span className="eyebrow-label text-white/50">Receiver workflow</span>
                  </div>
                  <WorkflowSequence steps={receiverSteps} accent="steel" className="mt-5 min-h-[21rem]" />
                  <Link to="/sign-up" className="mt-6 inline-flex min-h-11 items-center border border-white/25 bg-ink-950/70 px-4 text-sm font-semibold transition-colors hover:border-loop-300 hover:bg-loop-500/10">
                    I need material<span className="ms-3 text-loop-300" aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          </div>

          {/* The two worlds connect through GreenLoop */}
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-3" aria-hidden="true">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Provider site</span>
            <AnimatedConnector orientation="horizontal" className="h-8 flex-1" />
            <span className="border border-loop-400/50 bg-loop-500/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-loop-300">GreenLoop</span>
            <AnimatedConnector orientation="horizontal" className="h-8 flex-1" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Receiver gate</span>
          </div>
        </div>
      </section>
    );
  }

  function PassportBeat() {
    return (
      <section className="relative border-b border-steel-200 bg-gray-50 site-dark:border-white/10 site-dark:bg-ink-950">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="mb-10 max-w-3xl">
            <ScrollReveal>
              <p className="eyebrow-label text-loop-300">Material Passport</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Your material’s digital record.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600 site-dark:text-white/65">A Material Passport brings the basic facts, condition and supporting evidence together so both sides can make a grounded decision.</p>
            </ScrollReveal>
          </div>
          <MaterialPassportReveal video={siteVideos.passport}>
            <PassportCard />
          </MaterialPassportReveal>
        </div>
      </section>
    );
  }

  function PassportCard() {
    const records: Array<[string, string]> = [
      ["Condition", "Good"],
      ["Evidence", "Site photos · survey sheet"],
      ["Location", "Harrow Road"],
      ["Status", "Ready to match"],
    ];
    return (
      <div className="border border-steel-200 bg-white site-dark:border-white/15 site-dark:bg-[#1a1e1a]/95">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-steel-200 p-5 site-dark:border-white/10">
          <div>
            <p className="eyebrow-label text-steel-500 site-dark:text-white/45">Material Passport · MP-014</p>
            <h3 className="mt-2 font-archivo text-2xl font-bold text-ink-900 site-dark:text-white">Concrete</h3>
            <p className="mt-1 text-sm text-steel-600 site-dark:text-white/55">Harrow Road · Site evidence attached</p>
          </div>
          <p className="ledger-numeral text-3xl font-semibold text-loop-700 site-dark:text-loop-300">15 t</p>
        </div>
        <div className="grid grid-cols-2 gap-4 p-5 text-sm">
          {records.map(([label, value]) => (
            <div key={label} className="border-s border-steel-200 ps-3 site-dark:border-white/15">
              <p className="eyebrow-label text-steel-500 site-dark:text-white/40">{label}</p>
              <p className="mt-1 text-sm font-medium text-ink-800 site-dark:text-white/85">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function MatchBeat() {
    return (
      <section id="network" className="relative scroll-mt-24 overflow-hidden border-b border-white/10 bg-ink-950">
        {/* Ambient sorted-material footage behind the system */}
        <div className="absolute inset-0 opacity-35" aria-hidden="true">
          <VideoBackground
            video={siteVideos.match}
            overlayClassName="bg-gradient-to-b from-ink-950 via-ink-950/70 to-ink-950"
          />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <ScrollReveal>
              <p className="eyebrow-label text-loop-300">The coordination layer</p>
              <h2 className="mt-4 max-w-xl font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Recovery is a chain. GreenLoop keeps it connected.</h2>
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <p className="max-w-2xl text-base leading-7 text-white/65">Material supply and receiver demand meet through a capacity-aware match. From there, a dated booking connects the load to delivery and evidence of what was accepted.</p>
            </ScrollReveal>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            {/* Material + demand travel into the match */}
            <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <FlowInput label="Provider supply" title="MATERIAL" detail="Recovered material, recorded and ready to place." />
              <span className="hidden h-px w-full sm:block" aria-hidden="true">
                <AnimatedConnector orientation="horizontal" className="mx-auto h-8 max-w-16" drawSpeed={0.4} />
              </span>
              <FlowInput label="Receiver need" title="DEMAND" detail="Material needed, with a date and receiving location." />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-6">
              <AnimatedConnector className="mx-auto h-12" />
              <AnimatedConnector className="mx-auto h-12" />
            </div>

            <div className="border border-loop-400/50 bg-loop-500/10 px-5 py-5 text-center backdrop-blur-sm sm:px-8">
              <p className="eyebrow-label text-loop-300">The connection</p>
              <h3 className="mt-2 font-archivo text-xl font-bold tracking-wide text-white sm:text-2xl">GREENLOOP MATCH</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/65">Connect suitable material and demand, then check that a real receiving slot can fit the load.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Matching factors">
                {matchFactors.map((factor, index) => (
                  <motion.span
                    key={factor}
                    className="border border-white/15 bg-ink-950/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-white/70"
                    {...(reduceMotion
                      ? {}
                      : {
                          initial: { opacity: 0, y: 8 },
                          whileInView: { opacity: 1, y: 0 },
                          viewport: { once: true, margin: "-40px" },
                          transition: { duration: 0.4, delay: 0.15 + index * 0.14 },
                        })}
                  >
                    {factor}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-6">
              <AnimatedConnector className="mx-auto h-12" />
              <AnimatedConnector className="mx-auto h-12" />
            </div>

            <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="border border-white/15 bg-white/[0.03] p-4 sm:p-5">
                <p className="eyebrow-label text-white/45">Evaluated result</p>
                <h3 className="mt-2 font-archivo text-lg font-bold tracking-wide text-white">RECEIVING SLOT</h3>
                <p className="mt-1 text-sm leading-5 text-white/55">A dated slot at a facility that can take the load.</p>
              </div>
              <span className="hidden justify-self-center font-archivo text-2xl text-loop-300 sm:block" aria-hidden="true">→</span>
              <ol className="grid gap-3 sm:grid-cols-2" aria-label="What happens after a match">
                {networkStages.map((stage, index) => (
                  <li key={stage.title} className="relative border border-white/15 bg-white/[0.03] p-4">
                    <p className="ledger-numeral text-xs text-loop-300">0{index + 1}</p>
                    <h4 className="mt-2 font-archivo text-sm font-bold uppercase tracking-wide text-white">{stage.title}</h4>
                    <p className="mt-1 text-xs leading-5 text-white/55">{stage.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="mt-5 text-center text-xs text-white/45">One connected process from supply and demand to verified recovery.</p>
          </div>
        </div>
      </section>
    );
  }

  function ProblemBeat() {
    return (
      <section id="how-it-works" className="relative scroll-mt-24 overflow-hidden border-b border-white/10">
        <VideoBackground
          video={siteVideos.problem}
          objectPosition="center 35%"
          overlayClassName="bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/55"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <ScrollReveal>
              <p className="eyebrow-label text-signal-300">The gap between sites</p>
              <h2 className="mt-4 max-w-xl font-archivo text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Recovery fails between the sites, not on them.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/70">Material may exist. Demand may exist. But moving one to the other takes coordination that a listing alone cannot provide.</p>
              <p className="mt-7 border-l-2 border-loop-400 pl-4 font-archivo text-xl font-semibold text-white">GreenLoop coordinates the movement.</p>
            </ScrollReveal>
          </div>
          <div className="flex flex-col justify-center">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {problemPoints.map((point, index) => (
                <motion.li
                  key={point}
                  className="flex items-center gap-4 bg-ink-950/40 py-4 backdrop-blur-[2px]"
                  {...(reduceMotion
                    ? {}
                    : {
                        initial: { opacity: 0, x: 28 },
                        whileInView: { opacity: 1, x: 0 },
                        viewport: { once: true, margin: "-60px" },
                        transition: { duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] as const },
                      })}
                >
                  <span className="ledger-numeral text-xs text-signal-300">{String(index + 1).padStart(2, "0")}</span>
                  <span className="h-px w-6 bg-signal-300/50" aria-hidden="true" />
                  <span className="text-base text-white/85">{point}</span>
                  <span className="ms-auto font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">off-site</span>
                </motion.li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Six failure points — all between the pickup and the intake.</p>
          </div>
        </div>
      </section>
    );
  }

  function CapacitySceneBeat() {
    return (
      <section className="relative overflow-hidden border-b border-white/10">
        <VideoBackground
          video={siteVideos.capacity}
          overlayClassName="bg-gradient-to-b from-ink-950 via-ink-950/60 to-ink-950"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <ScrollReveal>
              <p className="eyebrow-label text-signal-300">Capacity-aware by design</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">A match isn’t enough.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/70">A receiver may want the material but not have enough room that day. GreenLoop checks the dated capacity before the booking is confirmed.</p>
              <p className="mt-5 text-sm leading-6 text-white/55">If the full amount will not fit, providers can book the available tonnes, try another receiver, or choose another date.</p>
            </ScrollReveal>
          </div>
          <ScrollReveal direction="end" distance={56}>
            <div className="border border-white/15 bg-ink-950/85 p-5 backdrop-blur-sm sm:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="eyebrow-label text-white/45">Receiving slot · Tuesday</p>
                  <h3 className="mt-2 font-archivo text-xl font-bold">Riverstone Aggregates</h3>
                </div>
                <span className="border border-signal-300/40 bg-signal-300/10 px-2 py-1 text-xs font-bold text-signal-200">WAITING ON CAPACITY</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="border-l-2 border-white/20 pl-4">
                  <p className="eyebrow-label text-white/45">Requested</p>
                  <p className="ledger-numeral mt-2 text-3xl font-semibold">8 t</p>
                </div>
                <div className="border-l-2 border-loop-400 pl-4">
                  <p className="eyebrow-label text-white/45">Available</p>
                  <p className="ledger-numeral mt-2 text-3xl font-semibold text-loop-300">5 t</p>
                </div>
              </div>
              <CapacityBar total={8} confirmed={5} held={0} availableValue={3} />
              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/sign-up" className="inline-flex min-h-11 items-center bg-loop-500 px-4 text-sm font-bold text-ink-950 hover:bg-loop-400">Book 5 t</Link>
                <Link to="/sign-up" className="inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold hover:bg-white/10">Another receiver</Link>
                <Link to="/sign-up" className="inline-flex min-h-11 items-center border border-white/25 px-4 text-sm font-semibold hover:bg-white/10">Another date</Link>
              </div>
              <p className="mt-4 text-xs text-white/45">The remaining 3 t stays visible to book elsewhere.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  function DeliveryBeat() {
    const stops = ["PROJECT", "TRUCK", "RECEIVING FACILITY"];
    const statusRail = ["BOOKED", "DISPATCHED", "IN TRANSIT", "RECEIVED"];
    return (
      <section className="relative overflow-hidden border-b border-white/10">
        <VideoBackground
          video={siteVideos.delivery}
          objectPosition="center 40%"
          overlayClassName="bg-gradient-to-b from-ink-950 via-ink-950/72 to-ink-950"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <ScrollReveal>
                <p className="eyebrow-label text-loop-300">One connected physical + digital workflow</p>
                <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">From request to verified recovery.</h2>
                <p className="mt-5 max-w-md text-base leading-7 text-white/65">A request becomes an offer. An offer becomes a capacity-checked booking. A delivered load closes with the quantity the receiver actually accepts.</p>
              </ScrollReveal>
            </div>

            <div>
              {/* Route: project → truck → receiving facility */}
              <div className="border border-white/15 bg-ink-950/80 p-5 backdrop-blur-sm sm:p-6" aria-label="Delivery route">
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  {stops.map((stop, index) => (
                    <div key={stop} className="flex flex-1 items-center gap-2">
                      <span className="w-full border border-white/15 bg-white/[0.04] px-3 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/75">
                        {stop}
                      </span>
                      {index < stops.length - 1 && (
                        <AnimatedConnector orientation="horizontal" className="hidden h-8 w-14 shrink-0 sm:block" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-4" aria-label="Load progress">
                  {statusRail.map((status, index) => (
                    <div key={status} className="relative">
                      <div className="h-px w-full bg-white/15" aria-hidden="true">
                        <motion.div
                          className="h-px origin-left bg-loop-400 rtl:origin-right"
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.6, delay: 0.2 + index * 0.35 }}
                        />
                      </div>
                      <span
                        className="absolute -top-1 left-0 size-2 border border-ink-950 bg-loop-300"
                        style={reduceMotion ? { insetInlineStart: index === 3 ? "calc(100% - 8px)" : `${index * 33.3}%` } : undefined}
                        aria-hidden="true"
                      >
                        {!reduceMotion && (
                          <motion.span
                            className="absolute inset-0 bg-loop-300"
                            animate={{ opacity: [0, 1] }}
                            transition={{ delay: 0.2 + index * 0.35, duration: 0.3 }}
                          />
                        )}
                      </span>
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">{status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational timeline — preserved story rows */}
              <div className="mt-6 border-y border-white/15">
                <StoryRow number="01" title="A receiver asks" detail="Riverstone needs 50 t of concrete." state="MATERIAL REQUEST" />
                <StoryRow number="02" title="A provider offers" detail="15 t from a Material Passport, with site evidence." state="OFFER SENT" />
                <StoryRow number="03" title="The receiver accepts" detail="The offer is reviewed and receiving capacity is checked." state="CAPACITY CONFIRMED" />
                <StoryRow number="04" title="The load moves" detail="A dated booking connects the material to delivery." state="BOOKING · ON THE ROAD" />
                <StoryRow number="05" title="Recovery is verified" detail="The receiver records actual and accepted tonnes." state="EVIDENCE RECORDED" last />
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <div key={step} className="bg-ink-950/90 p-4 sm:p-5">
                <p className="ledger-numeral text-xs text-loop-300">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-archivo text-sm font-bold uppercase tracking-wide">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function VerificationBeat() {
    return (
      <section className="relative overflow-hidden border-b border-white/10">
        <VideoBackground
          video={siteVideos.verification}
          overlayClassName="bg-gradient-to-r from-ink-950/95 via-ink-950/80 to-ink-950/45"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1fr_1fr] lg:items-center">
          <ScrollReveal>
            <p className="eyebrow-label text-loop-300">Verification</p>
            <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">The load closes as evidence.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/70">Weight at the gate, received quantity, accepted quantity — the physical process becomes an auditable digital record.</p>
          </ScrollReveal>
          <ScrollReveal direction="end" distance={56}>
            <div className="border border-white/15 bg-ink-950/85 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <p className="eyebrow-label text-white/45">Recovery record · MP-014</p>
                <span className="border border-loop-400/60 bg-loop-500/15 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-loop-300">VERIFIED</span>
              </div>
              <div className="divide-y divide-white/10">
                <VerificationRow label="Load dispatched" detail="Booking GL-0917 · Tuesday slot" />
                <VerificationRow label="Weight at gate" detail={<><Counter value={14.8} decimals={1} suffix=" t" className="text-xl font-semibold" /><span className="ms-2 text-white/45">weighbridge</span></>} />
                <VerificationRow label="Received quantity" detail={<><Counter value={14.6} decimals={1} suffix=" t" className="text-xl font-semibold" /><span className="ms-2 text-white/45">checked on intake</span></>} />
                <VerificationRow label="Accepted quantity" detail={<><Counter value={14.6} decimals={1} suffix=" t" className="text-xl font-semibold text-loop-300" /><span className="ms-2 text-white/45">matches offer 15 t</span></>} />
              </div>
              <p className="border-t border-white/10 px-5 py-4 text-sm text-white/70">
                <span className="size-2 me-2 inline-block bg-loop-400" aria-hidden="true" />
                Recovery confirmed — the tonnes are out of the waste stream and on the record.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    );
  }

  function VerificationRow({ label, detail }: { label: string; detail: ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="eyebrow-label text-white/50">{label}</p>
        <div className="text-white/85">{detail}</div>
      </div>
    );
  }

  function NetworkBeat() {
    return (
      <section id="about" className="relative scroll-mt-24 overflow-hidden bg-gray-50 text-ink-900 site-dark:bg-ink-950 site-dark:text-white">
        <div className="absolute inset-0 opacity-[0.12] site-dark:opacity-[0.18]" aria-hidden="true">
          <VideoBackground video={siteVideos.match} overlayClassName="bg-white/50 site-dark:bg-ink-950/70" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-24">
          <div className="mb-14 max-w-3xl">
            <ScrollReveal>
              <p className="eyebrow-label text-loop-300">The whole system</p>
              <h2 className="mt-4 font-archivo text-4xl font-bold tracking-tight sm:text-5xl">Every stage, one connected network.</h2>
            </ScrollReveal>
          </div>
          <ScrollReveal direction="none">
            <NetworkFlow />
          </ScrollReveal>

          <div className="mt-16 grid gap-8 border-t border-steel-200 pt-10 site-dark:border-white/10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow-label text-loop-300">GreenLoop · construction recovery infrastructure</p>
              <h3 className="mt-4 max-w-3xl font-archivo text-3xl font-bold leading-tight sm:text-4xl">Providers turn recovered material into structured supply. Receivers express demand and available capacity. GreenLoop connects the movement between them.</h3>
              <p className="mt-4 text-sm text-steel-600 site-dark:text-white/55">Coordination for material, demand, capacity, booking, delivery and verification — not another standalone listing.</p>
            </div>
            <Link to="/sign-up" className="inline-flex min-h-12 items-center justify-center bg-loop-500 px-6 text-sm font-bold text-ink-950 hover:bg-loop-400">Create account</Link>
          </div>
        </div>
      </section>
    );
  }
}/* ── Shared helpers ─────────────────────────────────────────────────────── */

function entrance(reduceMotion: boolean | null, delay: number) {
  return reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 26 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
      };
}

function MatchPulse({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <span className="relative flex size-8 items-center justify-center text-loop-400" aria-hidden="true">
      {reduceMotion ? (
        <span className="font-archivo text-lg">→</span>
      ) : (
        <motion.span
          className="font-archivo text-lg"
          animate={{ x: [0, 3, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          →
        </motion.span>
      )}
      <span className="absolute inset-0 border border-loop-400/25" />
    </span>
  );
}

function FlowInput({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <div className="min-h-28 border border-white/15 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
      <p className="eyebrow-label text-white/45">{label}</p>
      <h3 className="mt-2 font-archivo text-lg font-bold tracking-wide text-white">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-white/55">{detail}</p>
    </div>
  );
}

function StoryRow({ number, title, detail, state, last = false }: { number: string; title: string; detail: string; state: string; last?: boolean }) {
  return (
    <div className={`grid gap-3 px-1 py-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center ${last ? "" : "border-b border-white/10"}`}>
      <span className="ledger-numeral text-xs text-loop-300">{number}</span>
      <div>
        <h3 className="font-archivo text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/55">{detail}</p>
      </div>
      <span className="w-fit border border-white/15 px-2 py-1 font-mono text-[10px] tracking-wide text-white/55">{state}</span>
    </div>
  );
}
