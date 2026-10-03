import { useRef, type MouseEvent } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import { STORY, demoDataset } from "@/domain/demoData";

export default function StoryFilm() {
  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const dataset = demoDataset();
  
  const material = dataset.materials.find((item) => item.id === STORY.materialAId);
  const project = dataset.projects.find((item) => item.id === material?.projectId);
  const receiver = dataset.receivers.find((item) => item.id === STORY.receiverId);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.12]);

  // Mouse tracking for subtle 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { damping: 30, stiffness: 200 });

  function handleMouseMove(e: MouseEvent) {
    if (!containerRef.current || reduceMotion) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(xPct);
    mouseY.set(yPct);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-ink-950 text-white perspective-[1000px]"
    >
      <motion.div
        className="absolute inset-0 -z-10"
        style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}
      >
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          poster="/images/site/hero-demolition.jpg" 
          className="h-full min-h-[calc(100svh-72px)] w-full object-cover object-center opacity-40" 
        >
          <source src="/videos/hero-demolition.mp4" type="video/mp4" />
          <img 
            src="/images/site/hero-demolition.jpg" 
            alt="Demolition site fallback" 
            className="h-full min-h-[calc(100svh-72px)] w-full object-cover object-center opacity-40" 
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/70 to-ink-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/10" />
      </motion.div>

      <div className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-5 pb-28 pt-20 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-32">
        <div className="max-w-4xl z-10">
          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow-label mb-6 flex items-center gap-3 text-white/70"
          >
            <span className="size-2 bg-loop-400" aria-hidden="true" />
            Live material coordination
          </motion.p>
          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
            className="max-w-4xl text-balance font-archivo text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-7xl lg:text-8xl"
          >
            Turn demolition waste into{" "}
            <span className="text-loop-300 drop-shadow-md">planned recovery.</span>
          </motion.h1>
          <motion.p 
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-7 max-w-xl text-base leading-7 text-white/80 sm:text-lg drop-shadow-sm"
          >
            Survey what is on site. Match a real receiver. Reserve capacity before the truck leaves. Verify what arrived.
          </motion.p>
          <motion.div 
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="/#workflow"
              className="border border-white/35 px-5 py-3 text-theme-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 backdrop-blur-sm"
            >
              See the recovery process
            </a>
            <Link
              to="/sign-up"
              className="border border-white bg-white px-5 py-3 text-theme-sm font-semibold text-ink-900 transition-colors hover:bg-gray-200"
            >
              Create account
            </Link>
            <Link
              to="/sign-in"
              className="px-5 py-3 text-theme-sm font-semibold text-white transition-colors hover:text-gray-300"
            >
              Sign in
            </Link>
          </motion.div>
        </div>

        <motion.div 
          className="relative mx-auto w-full max-w-md lg:ms-auto z-10"
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          {/* Layered borders for depth */}
          <div className="absolute -inset-4 border border-white/10 transform-gpu translate-z-[-20px] rounded-xl" aria-hidden="true" />
          <div className="absolute -inset-2 border border-white/20 transform-gpu translate-z-[-10px] rounded-xl" aria-hidden="true" />
          
          <div className="relative rounded-xl border border-white/40 bg-ink-950/60 p-5 shadow-2xl backdrop-blur-xl sm:p-6 transform-gpu translate-z-[10px]">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <p className="eyebrow-label text-white/55">Live material record</p>
              <span className="ledger-numeral flex items-center gap-2 text-theme-xs font-medium text-loop-300">
                <span className="size-1.5 animate-pulse bg-loop-400" aria-hidden="true" />
                {material?.id}
              </span>
            </div>
            
            <div className="py-5">
              <p className="text-theme-xs uppercase tracking-[0.16em] text-white/45">Recovered material</p>
              <p className="mt-2 font-archivo text-4xl font-semibold capitalize tracking-tight text-white drop-shadow-md">
                {material?.type}
              </p>
              <p className="mt-1 text-theme-sm text-white/60">{project?.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-5 gap-y-5 border-y border-white/15 py-4">
              <RecordValue label="Surveyed" value={`${material?.quantityT.toFixed(1)} t`} highlight />
              <RecordValue label="Estimated range" value={`${material?.quantityRangeT[0].toFixed(1)}–${material?.quantityRangeT[1].toFixed(1)} t`} />
              <RecordValue label="Condition" value={material?.condition ?? "—"} />
              <RecordValue label="Grade" value={material?.grade ?? "—"} />
              <RecordValue label="Confidence" value={`${Math.round((material?.confidence ?? 0) * 100)}%`} highlight />
              <RecordValue label="Evidence" value={`${material?.evidence.length ?? 0} records`} />
            </div>
            
            <div className="mt-4 flex items-center justify-between gap-4 text-theme-xs rounded bg-white/5 p-3">
              <span className="text-white/50">Potential receiving yard</span>
              <span className="text-end font-medium text-white">{receiver?.name}</span>
            </div>
          </div>
          
          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 transform-gpu translate-z-[20px]">
            Survey → passport → receiver
          </p>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-ink-950/80 backdrop-blur-md z-20">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/10 px-5 sm:px-8">
          <TracePoint label="Origin" value={project?.name ?? "—"} delay={0.6} />
          <TracePoint label="Material passport" value={material?.id ?? "—"} delay={0.7} />
          <TracePoint label="Receiver match" value={receiver?.name ?? "—"} delay={0.8} />
        </div>
      </div>
    </section>
  );
}

function RecordValue({ label, value, highlight = false }: { label: string; value: string, highlight?: boolean }) {
  return (
    <div>
      <p className="eyebrow-label text-white/45">{label}</p>
      <p className={`ledger-numeral mt-1.5 text-sm font-medium capitalize ${highlight ? "text-loop-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function TracePoint({ label, value, delay }: { label: string; value: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="min-w-0 py-3 pe-3 sm:py-4 sm:pe-6"
    >
      <p className="eyebrow-label truncate text-white/45">{label}</p>
      <p className="mt-1 truncate text-theme-xs font-medium text-white/85 sm:text-theme-sm">{value}</p>
    </motion.div>
  );
}
