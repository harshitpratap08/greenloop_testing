import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { slotLedger } from "@/domain/capacity";
import { motion } from "motion/react";
import { cn } from "@/utils";

export default function Capacity() {
  const { dataset } = useGreenLoopStore();
  const receiverId = "R-001";
  
  const slots = dataset.slots
    .filter(s => s.receiverId === receiverId)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Capacity | GreenLoop" description="Manage receiver capacity." />
      <PageBreadcrumb pageTitle="Capacity" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Site Capacity
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Manage your processing capacity limits per material to ensure you don't overbook incoming deliveries.
        </p>
      </motion.header>

      {slots.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No capacity registered</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            Define daily or weekly intake limits per material.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot, i) => {
            const ledger = slotLedger(dataset, slot.id);
            if (!ledger) return null;
            
            const { available, reserved, slot: s } = ledger;
            const percent = Math.min(100, (reserved / s.capacityT) * 100);

            return (
              <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={slot.id}
                className="flex flex-col justify-between rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400">
                        {s.date}
                      </p>
                      <h3 className="mt-1 font-archivo text-xl font-bold capitalize text-ink-900 dark:text-white">
                        {s.materialType}
                      </h3>
                    </div>
                    {available === 0 ? (
                      <span className="rounded bg-signal-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-signal-700 dark:bg-signal-900/30 dark:text-signal-400">
                        FULL
                      </span>
                    ) : reserved > 0 ? (
                      <span className="rounded bg-loop-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-loop-700 dark:bg-loop-900/30 dark:text-loop-400">
                        PARTIAL
                      </span>
                    ) : (
                      <span className="rounded bg-steel-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-steel-700 dark:bg-white/10 dark:text-steel-300">
                        AVAILABLE
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-steel-100 pt-4 dark:border-steel-800">
                    <div>
                      <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Total Capacity</p>
                      <p className="ledger-numeral mt-1 text-lg font-bold text-ink-900 dark:text-white">
                        {s.capacityT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Available</p>
                      <p className={cn("ledger-numeral mt-1 text-lg font-bold", available > 0 ? "text-loop-600 dark:text-loop-400" : "text-signal-600 dark:text-signal-400")}>
                        {available.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-steel-100 pt-4 dark:border-steel-800">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-steel-600 dark:text-gray-400">{reserved.toFixed(1)} t reserved</span>
                    <span className="text-steel-500">{percent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-800">
                    <div 
                      className={cn("h-full", percent === 100 ? "bg-signal-500" : "bg-loop-500")} 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                  <p className="mt-4 text-xs text-steel-400">Slot ID: {s.id}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
