import { useRef } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { STORY } from "@/domain/demoData";
import { useGreenLoopStore } from "@/store/GreenLoopStore";

export default function StoryFilm() {
  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { dataset } = useGreenLoopStore();
  const material = dataset.materials.find((item) => item.id === STORY.materialAId);
  const project = dataset.projects.find((item) => item.id === material?.projectId);
  const receiver = dataset.receivers.find((item) => item.id === STORY.receiverId);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);

  return (
    <section
      ref={containerRef}
      className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-ink-950 text-white"
    >
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}
      >
        <img
          src="/images/site/hero-demolition.jpg"
          alt="Excavator sorting recovered material at a demolition site"
          fetchPriority="high"
          className="h-full min-h-[calc(100svh-72px)] w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/55 to-ink-950/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-ink-950/10" />
      </motion.div>

      <div className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-5 pb-28 pt-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-32">
        <div className="max-w-4xl">
          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow-label mb-6 flex items-center gap-3 text-white/70"
          >
            <span className="size-2 bg-loop-400" aria-hidden="true" />
            Construction material recovery · coordinated before dispatch
          </motion.p>
          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
            className="max-w-4xl text-balance font-archivo text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl lg:text-8xl"
          >
            Turn demolition waste into{" "}
            <span className="text-loop-300">planned recovery.</span>
          </motion.h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
            Survey what is on site. Match a real receiver. Reserve capacity before the truck leaves. Verify what arrived.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="/#workflow"
              className="border border-white bg-white px-5 py-3 text-theme-sm font-semibold text-ink-900 transition-colors hover:bg-gray-200"
            >
              See the recovery process
            </a>
            <Link
              to="/app/dashboard"
              className="border border-white/35 px-5 py-3 text-theme-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Enter GreenLoop
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:ms-auto">
          <div className="absolute -inset-4 border border-white/20" aria-hidden="true" />
          <div className="relative border border-white/35 bg-ink-950/80 p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <p className="eyebrow-label text-white/55">Live material record</p>
              <span className="ledger-numeral flex items-center gap-2 text-theme-xs text-loop-300">
                <span className="size-1.5 bg-loop-400" aria-hidden="true" />
                {material?.id}
              </span>
            </div>
            <div className="py-5">
              <p className="text-theme-xs uppercase tracking-[0.16em] text-white/45">Recovered material</p>
              <p className="mt-2 font-archivo text-3xl font-semibold capitalize tracking-tight text-white">
                {material?.type}
              </p>
              <p className="mt-1 text-theme-sm text-white/60">{project?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 border-y border-white/15 py-4">
              <RecordValue label="Surveyed" value={`${material?.quantityT.toFixed(1)} t`} />
              <RecordValue label="Estimated range" value={`${material?.quantityRangeT[0].toFixed(1)}–${material?.quantityRangeT[1].toFixed(1)} t`} />
              <RecordValue label="Condition" value={material?.condition ?? "—"} />
              <RecordValue label="Grade" value={material?.grade ?? "—"} />
              <RecordValue label="Confidence" value={`${Math.round((material?.confidence ?? 0) * 100)}%`} />
              <RecordValue label="Evidence" value={`${material?.evidence.length ?? 0} records`} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 text-theme-xs">
              <span className="text-white/50">Potential receiving yard</span>
              <span className="text-end font-medium text-white">{receiver?.name}</span>
            </div>
          </div>
          <p className="mt-3 text-end font-mono text-theme-xs uppercase tracking-[0.18em] text-white/50">
            Survey → passport → receiver
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-ink-950/65 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/15 px-5 sm:px-8">
          <TracePoint label="Origin" value={project?.name ?? "—"} />
          <TracePoint label="Material passport" value={material?.id ?? "—"} />
          <TracePoint label="Receiver match" value={receiver?.name ?? "—"} />
        </div>
      </div>
    </section>
  );
}

function RecordValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow-label text-white/45">{label}</p>
      <p className="ledger-numeral mt-1.5 text-sm font-medium capitalize text-white">{value}</p>
    </div>
  );
}

function TracePoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 py-3 pe-3 sm:py-4 sm:pe-6">
      <p className="eyebrow-label truncate text-white/45">{label}</p>
      <p className="mt-1 truncate text-theme-xs font-medium text-white/85 sm:text-theme-sm">{value}</p>
    </div>
  );
}
