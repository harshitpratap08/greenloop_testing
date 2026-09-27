import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import Section from "@/components/site/Section";
import EditorialHeading from "@/components/site/EditorialHeading";

const nodes = [
  "PROJECT",
  "MATERIALS",
  "RECEIVERS",
  "CAPACITY",
  "BOOKING",
  "VERIFICATION"
];

export default function SystemDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  return (
    <Section id="system-diagram" index="03" eyebrow="The System" className="overflow-hidden">
      <div className="mx-auto max-w-4xl text-center">
        <EditorialHeading 
          lines={[
            <>A connected loop.</>,
          ]} 
          level={2}
          className="text-center"
        />
      </div>

      <div ref={containerRef} className="relative mt-24 py-10 lg:mt-32">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-steel-200 dark:bg-steel-800" />
        
        <motion.div 
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-loop-500"
          style={{ 
            width: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]),
            transformOrigin: "left center" 
          }}
        />

        <div className="relative z-10 flex justify-between px-2 sm:px-10">
          {nodes.map((node, index) => {
            const startNode = index * (1 / (nodes.length - 1)) - 0.1;
            const endNode = index * (1 / (nodes.length - 1)) + 0.1;
            
            const opacity = useTransform(scrollYProgress, [startNode, endNode], [0.3, 1]);
            const scale = useTransform(scrollYProgress, [startNode, endNode], [0.8, 1.1]);
            const color = useTransform(scrollYProgress, [startNode, endNode], ["#9CA3AF", "#10B981"]); // gray to emerald-ish

            return (
              <div key={node} className="flex flex-col items-center">
                <motion.div 
                  className="mb-4 flex size-4 items-center justify-center rounded-full bg-ink-900 shadow-md ring-4 ring-white dark:bg-black dark:ring-gray-900"
                  style={{ scale, backgroundColor: color }}
                />
                <motion.span 
                  className="hidden text-xs font-bold tracking-widest text-ink-900 dark:text-white sm:block"
                  style={{ opacity }}
                >
                  {node}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
