import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { STORY } from "@/domain/demoData";

export default function StoryFilm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { dataset } = useGreenLoopStore();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scene triggers - mapping scroll 0-1 to scenes
  // 0.0 - 0.15: Hero / Demolition
  // 0.15 - 0.25: Material Identified
  // 0.25 - 0.40: Passport
  // 0.40 - 0.55: Receiver Match
  // 0.55 - 0.70: Capacity / Booking
  // 0.70 - 0.85: Dispatch
  // 0.85 - 1.00: Verification

  // Background Video / Image Opacity/Scale adjustments
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.4, 0.2]);

  return (
    <div ref={containerRef} className="relative h-[600vh] w-full bg-ink-950">
      {/* Sticky Container for Video & UI Overlays */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        
        {/* Background Visuals */}
        <motion.div 
          className="absolute inset-0 z-0 h-full w-full"
          style={{ scale: bgScale, opacity: bgOpacity }}
        >
          {/* Fallback to poster if video src is empty */}
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/images/site/hero-demolition.jpg"
            className="h-full w-full object-cover"
          >
            {/* <source src="/videos/demolition-bg.mp4" type="video/mp4" /> */}
          </video>
          <div className="absolute inset-0 bg-ink-950/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
        </motion.div>

        {/* Scene 1: Hero */}
        <SceneHero progress={scrollYProgress} />

        {/* Scene 2: Material Identified */}
        <SceneMaterialIdentified progress={scrollYProgress} />

        {/* Scene 3: Passport */}
        <ScenePassport progress={scrollYProgress} dataset={dataset} />

        {/* Scene 4: Receiver Match */}
        <SceneReceiverMatch progress={scrollYProgress} dataset={dataset} />

        {/* Scene 5: Booking & Capacity */}
        <SceneBookingCapacity progress={scrollYProgress} />

        {/* Scene 6: Verification */}
        <SceneVerification progress={scrollYProgress} dataset={dataset} />

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SCENES
// ---------------------------------------------------------------------------

function SceneHero({ progress }: { progress: any }) {
  const opacity = useTransform(progress, [0, 0.08, 0.12], [1, 1, 0]);
  const y = useTransform(progress, [0, 0.12], [0, -50]);

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
      style={{ opacity, y }}
    >
      <p className="eyebrow-label mb-6 text-white/70">GreenLoop Circular OS</p>
      <h1 className="text-balance text-5xl font-semibold tracking-tight text-white md:text-7xl lg:text-8xl">
        Turn demolition waste<br/>into <span className="text-loop-400">planned recovery.</span>
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-white/80 md:text-xl">
        Match materials. Secure capacity. Verify every load.
      </p>
    </motion.div>
  );
}

function SceneMaterialIdentified({ progress }: { progress: any }) {
  const opacity = useTransform(progress, [0.12, 0.16, 0.22, 0.26], [0, 1, 1, 0]);
  const scale = useTransform(progress, [0.12, 0.22], [0.95, 1.05]);
  const y = useTransform(progress, [0.12, 0.22], [20, -20]);

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex items-center justify-center px-6"
      style={{ opacity, scale, y }}
    >
      <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-md">
        <div className="mb-3 rounded-full bg-loop-500/20 px-3 py-1 text-xs font-semibold text-loop-300 ring-1 ring-inset ring-loop-500/30">
          Material Identified
        </div>
        <h2 className="text-4xl font-bold text-white md:text-6xl">CONCRETE</h2>
        <p className="ledger-numeral mt-2 text-3xl font-medium text-loop-400">24.0 t</p>
      </div>
    </motion.div>
  );
}

function ScenePassport({ progress, dataset }: { progress: any, dataset: any }) {
  const opacity = useTransform(progress, [0.24, 0.28, 0.36, 0.40], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.24, 0.32], [40, 0]);
  
  const material = dataset.materials.find((m: any) => m.id === STORY.materialAId);

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex items-center justify-center px-6"
      style={{ opacity, y }}
    >
      <div className="w-full max-w-lg rounded-xl border border-white/15 bg-ink-950/80 p-8 shadow-2xl backdrop-blur-xl">
        <p className="eyebrow-label text-white/50">Material Passport</p>
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-white/40">Condition</p>
            <p className="mt-1 text-lg font-medium text-white capitalize">{material?.condition}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Grade</p>
            <p className="mt-1 text-lg font-medium text-white">{material?.grade}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Estimated Range</p>
            <p className="ledger-numeral mt-1 text-lg font-medium text-white">{material?.quantityRangeT[0]} – {material?.quantityRangeT[1]} t</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Confidence</p>
            <p className="ledger-numeral mt-1 text-lg font-medium text-loop-400">{material ? material.confidence * 100 : 0}%</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4 text-sm text-white/60">
          <svg className="size-5 text-loop-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Passport Ready for Allocation
        </div>
      </div>
    </motion.div>
  );
}

function SceneReceiverMatch({ progress, dataset }: { progress: any, dataset: any }) {
  const opacity = useTransform(progress, [0.38, 0.42, 0.52, 0.56], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.38, 0.46], [40, 0]);
  
  const receiver = dataset.receivers.find((r: any) => r.id === STORY.receiverId);

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6"
      style={{ opacity, y }}
    >
      <div className="mb-6 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
        3 Receivers Found
      </div>
      <div className="w-full max-w-2xl rounded-xl border border-loop-500/30 bg-loop-950/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow-label text-loop-300">Best Match</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{receiver?.name}</h3>
            <p className="mt-1 text-sm text-white/60">{receiver?.location}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-loop-400">{receiver?.distanceKm} km</p>
            <p className="text-xs text-white/50 mt-1">Route distance</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-black/20 p-3">
             <svg className="size-5 text-loop-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-white">Accepts Concrete</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-black/20 p-3">
             <svg className="size-5 text-loop-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-white">Capacity Available</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SceneBookingCapacity({ progress }: { progress: any }) {
  const opacity = useTransform(progress, [0.54, 0.58, 0.70, 0.74], [0, 1, 1, 0]);
  const y = useTransform(progress, [0.54, 0.62], [40, 0]);
  
  // Animate the bar from 15t to 5t available
  const barWidth = useTransform(progress, [0.60, 0.65], ["0%", "66%"]);
  
  return (
    <motion.div 
      className="absolute inset-0 z-10 flex items-center justify-center px-6"
      style={{ opacity, y }}
    >
      <div className="w-full max-w-xl rounded-xl border border-white/10 bg-ink-900/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Capacity Reservation</h3>
          <span className="rounded bg-loop-500/20 px-2 py-1 text-xs font-semibold text-loop-400">10 t CONFIRMED</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/60">
            <span>Riverstone Aggregates</span>
            <span>15.0 t Initial Capacity</span>
          </div>
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-loop-500"
              style={{ width: barWidth }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>10.0 t booked</span>
            <span>5.0 t remaining</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 border-t border-white/10 pt-6">
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider">Status</p>
            <p className="mt-1 text-lg font-bold text-white">LOAD-1001 DISPATCHED</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SceneVerification({ progress, dataset }: { progress: any, dataset: any }) {
  const opacity = useTransform(progress, [0.72, 0.76, 1, 1], [0, 1, 1, 1]);
  const y = useTransform(progress, [0.72, 0.80], [40, 0]);
  
  const verification = dataset.verifications[0];

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex items-center justify-center px-6 bg-ink-950/40 backdrop-blur-sm"
      style={{ opacity, y }}
    >
      <div className="w-full max-w-3xl text-center">
        <p className="eyebrow-label text-loop-400 mb-6">Verified Recovery</p>
        <h2 className="text-4xl font-bold text-white md:text-5xl mb-12">
          The cycle closes at the weighbridge.
        </h2>
        
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <p className="text-sm text-white/50 mb-2">Planned</p>
            <p className="ledger-numeral text-3xl font-bold text-white">{verification?.plannedT.toFixed(1)} t</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <p className="text-sm text-white/50 mb-2">Actual Arrived</p>
            <p className="ledger-numeral text-3xl font-bold text-white">{verification?.actualT.toFixed(1)} t</p>
          </div>
          <div className="rounded-xl border border-loop-500/30 bg-loop-900/40 p-6 backdrop-blur-md">
            <p className="text-sm text-loop-300 mb-2">Accepted Fact</p>
            <p className="ledger-numeral text-3xl font-bold text-loop-400">{verification?.acceptedT.toFixed(1)} t</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
