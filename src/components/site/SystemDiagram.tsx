import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import Section from "@/components/site/Section";
import EditorialHeading from "@/components/site/EditorialHeading";

const stages = ["SURVEY", "MATCH", "RESERVE", "VERIFY"];

function SystemStage({ stage, index, progress }: { stage: string; index: number; progress: MotionValue<number> }) {
  const threshold = index / (stages.length - 1);
  const textOpacity = useTransform(progress, [threshold - 0.1, threshold], [0.4, 1]);
  const dotColor = useTransform(progress, [threshold - 0.1, threshold], ["#374151", "#4ade80"]);

  return (
    <li className={`flex flex-col gap-4 ${index === stages.length - 1 ? "items-end text-end" : "items-start text-start"}`}>
      <motion.span className="z-10 flex size-4 items-center justify-center rounded-full ring-8 ring-ink-900" style={{ backgroundColor: dotColor }} aria-hidden="true" />
      <motion.span className="eyebrow-label text-loop-300" style={{ opacity: textOpacity }}>{stage}</motion.span>
    </li>
  );
}

export default function SystemDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <Section id="system-diagram" index="03" eyebrow="The system" band className="overflow-hidden" innerClassName="py-12 md:py-20">
      <div className="grid items-end gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <EditorialHeading
          lines={[<>The material moves.</>, <>The record moves with it.</>]}
          band
        />
        <p className="max-w-lg text-base leading-7 text-white/65 lg:justify-self-end">
          From the first site survey to the final weighbridge ticket, every handoff connects physical material to a confirmed destination.
        </p>
      </div>

      <div ref={containerRef} className="relative mt-16 py-2 sm:mt-24">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/20" aria-hidden="true" />
        <motion.div
          className="absolute start-0 top-1/2 h-0.5 -translate-y-1/2 bg-loop-400"
          style={{ width: progressWidth }}
          aria-hidden="true"
        />
        <ol className="relative grid grid-cols-4">
          {stages.map((stage, index) => (
            <SystemStage key={stage} stage={stage} index={index} progress={scrollYProgress} />
          ))}
        </ol>
      </div>
      <p className="mt-12 border-t border-white/15 pt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
        Site survey <span aria-hidden="true">/</span> receiver capacity <span aria-hidden="true">/</span> verified delivery
      </p>
    </Section>
  );
}
