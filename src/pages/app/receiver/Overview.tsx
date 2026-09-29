import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { slotLedger } from "@/domain/capacity";
import { motion } from "motion/react";

export default function Overview() {
  const { dataset } = useGreenLoopStore();
  const receiverId = "R-001"; // Using the primary demo receiver

  // Summary Metrics
  const activeDemands = dataset.demands?.filter((d) => d.receiverId === receiverId && d.status !== "PAUSED") ?? [];
  const totalDemandT = activeDemands.reduce((sum, d) => sum + d.requiredT, 0);

  const receiverSlots = dataset.slots.filter((s) => s.receiverId === receiverId);
  const totalCapacityT = receiverSlots.reduce((sum, s) => sum + s.capacityT, 0);
  const totalReservedT = receiverSlots.reduce((sum, s) => sum + (slotLedger(dataset, s.id)?.reserved ?? 0), 0);
  const availableCapacityT = Math.max(0, totalCapacityT - totalReservedT);

  const receiverBookings = dataset.bookings.filter((b) => b.receiverId === receiverId);
  const incomingRequests = receiverBookings.filter((b) => b.status === "hold");
  const materialExpected = receiverBookings.filter((b) => b.status === "confirmed");
  const expectedT = materialExpected.reduce((sum, b) => sum + b.tonnesT, 0);

  // Capacity breakdown by material
  const capacityByMaterial = receiverSlots.reduce((acc, slot) => {
    if (!acc[slot.materialType]) acc[slot.materialType] = { capacity: 0, reserved: 0 };
    acc[slot.materialType].capacity += slot.capacityT;
    acc[slot.materialType].reserved += slotLedger(dataset, slot.id)?.reserved ?? 0;
    return acc;
  }, {} as Record<string, { capacity: number; reserved: number }>);

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Receiver Overview | GreenLoop" description="Receiver operational dashboard." />
      <PageBreadcrumb pageTitle="Overview" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
        <h1 className="mt-2 font-archivo text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          Receiver Overview
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Monitor active demand, manage your available receiving capacity, and review incoming material requests.
        </p>
      </motion.header>

      {/* Summary Figures */}
      <section className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          label="Active demand" 
          value={`${totalDemandT.toFixed(1)} t`} 
          subtext={`${activeDemands.length} material requirements`} 
        />
        <SummaryCard 
          label="Available capacity" 
          value={`${availableCapacityT.toFixed(1)} t`} 
          subtext={`across ${receiverSlots.length} intake slots`} 
        />
        <SummaryCard 
          label="Incoming requests" 
          value={incomingRequests.length.toString()} 
          subtext={`${incomingRequests.reduce((sum, b) => sum + b.tonnesT, 0).toFixed(1)} t pending review`} 
        />
        <SummaryCard 
          label="Expected soon" 
          value={`${expectedT.toFixed(1)} t`} 
          subtext={`${materialExpected.length} confirmed deliveries`} 
        />
      </section>

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        {/* Capacity Snapshot */}
        <section>
          <div className="mb-6 flex items-baseline justify-between border-b border-steel-200 pb-4 dark:border-steel-800">
            <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Receiving capacity</h2>
            <Link to="/app/receiver/capacity" className="text-sm font-semibold text-loop-600 hover:text-loop-500 dark:text-loop-400">
              View all slots →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(capacityByMaterial).map(([material, stats]) => {
              const available = Math.max(0, stats.capacity - stats.reserved);
              const percent = Math.min(100, (stats.reserved / Math.max(stats.capacity, 0.1)) * 100);
              
              return (
                <div key={material} className="rounded-sm border border-steel-200 bg-white p-5 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
                  <h3 className="font-archivo text-lg font-bold capitalize text-ink-900 dark:text-white">{material}</h3>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="rounded-sm border border-steel-200 bg-steel-50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-steel-700 dark:border-steel-700 dark:bg-white/5 dark:text-steel-300">
                      {available > 0 ? `${available.toFixed(1)} t available` : "FULL · 0 t"}
                    </span>
                  </div>
                  
                  {available > 0 && stats.reserved > 0 && (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-800">
                        <div className="h-full bg-loop-500" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-medium text-steel-600 dark:text-gray-400">
                        {stats.reserved.toFixed(1)} t res
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {Object.keys(capacityByMaterial).length === 0 && (
              <p className="text-sm text-steel-500">No capacity registered.</p>
            )}
          </div>
        </section>

        {/* Attention / Action Area */}
        <section>
          <div className="mb-6 border-b border-steel-200 pb-4 dark:border-steel-800">
            <h2 className="font-archivo text-2xl font-bold text-ink-900 dark:text-white">Needs attention</h2>
          </div>
          <div className="space-y-4">
            {incomingRequests.length > 0 && (
              <div className="flex flex-col gap-3 rounded-sm border-l-4 border-signal-500 bg-signal-50 p-5 dark:border-signal-500/50 dark:bg-signal-500/10">
                <div>
                  <h3 className="font-bold text-signal-900 dark:text-signal-100">{incomingRequests.length} incoming request{incomingRequests.length === 1 ? "" : "s"} need review</h3>
                  <p className="mt-1 text-sm text-signal-800/90 dark:text-signal-200/90">
                    Review and confirm material suitable for your capacity.
                  </p>
                </div>
                <Link to="/app/receiver/incoming-requests" className="inline-block self-start rounded bg-signal-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-signal-800 dark:bg-signal-200 dark:text-signal-900">
                  Review requests
                </Link>
              </div>
            )}
            
            {expectedT > 0 && (
              <div className="flex flex-col gap-3 rounded-sm border border-steel-200 bg-white p-5 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
                <div>
                  <h3 className="font-bold text-ink-900 dark:text-white">{expectedT.toFixed(1)} t scheduled for delivery</h3>
                  <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                    Expected across {materialExpected.length} confirmed bookings.
                  </p>
                </div>
                <Link to="/app/receiver/deliveries" className="inline-block self-start rounded bg-steel-100 px-4 py-2 text-sm font-bold text-ink-900 transition-colors hover:bg-steel-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                  View deliveries
                </Link>
              </div>
            )}

            {activeDemands.length === 0 && (
              <div className="flex flex-col gap-3 rounded-sm border border-steel-200 bg-white p-5 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
                <div>
                  <h3 className="font-bold text-ink-900 dark:text-white">No active material demand</h3>
                  <p className="mt-1 text-sm text-steel-600 dark:text-gray-400">
                    Add a material requirement to tell GreenLoop what you can receive.
                  </p>
                </div>
                <Link to="/app/receiver/demand" className="inline-block self-start rounded bg-ink-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-loop-600 dark:bg-white dark:text-ink-900">
                  Add demand
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="flex flex-col justify-between rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]">
      <p className="eyebrow-label text-steel-500 dark:text-steel-400">{label}</p>
      <div className="mt-4">
        <p className="ledger-numeral text-4xl font-bold tracking-tight text-ink-900 dark:text-white">{value}</p>
        <p className="mt-2 text-sm font-medium text-steel-500 dark:text-gray-500">{subtext}</p>
      </div>
    </div>
  );
}
