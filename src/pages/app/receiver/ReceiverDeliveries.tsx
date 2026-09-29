import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { useAuth } from "@/context/AuthContext";

export default function ReceiverDeliveries() {
  const { dataset, receiveLoadAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "R-001";
  
  // Confirmed bookings that don't have a verification record yet
  const expectedDeliveries = dataset.bookings.filter((booking) =>
    booking.receiverId === receiverId && booking.status === "confirmed" && Boolean(booking.loadRef) &&
    !dataset.verifications.some((verification) => verification.bookingId === booking.id)
  );

  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [actualT, setActualT] = useState<string>("");

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Deliveries | GreenLoop" description="Incoming deliveries." />
      <PageBreadcrumb pageTitle="Deliveries" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Expected Deliveries
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Track expected material deliveries and record intake when trucks arrive at your site.
        </p>
      </motion.header>

      {expectedDeliveries.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No upcoming deliveries</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            You have no confirmed incoming material deliveries at this time.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {expectedDeliveries.map(booking => {
              const material = dataset.materials.find(m => m.id === booking.materialId);
              const project = dataset.projects.find(p => p.id === material?.projectId);
              const isReceiving = receivingId === booking.id;
              
              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={booking.id}
                  className="rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
                >
                  <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status="confirmed" size="sm" />
                        <p className="text-sm font-medium text-steel-500 dark:text-steel-400">Booking {booking.id}</p>
                      </div>
                      
                      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Material</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white capitalize">{material?.type}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Source Project</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{project?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected Date</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{dataset.slots.find(s => s.id === booking.slotId)?.date}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected Quantity</p>
                          <p className="ledger-numeral mt-1 text-2xl font-bold text-ink-900 dark:text-white">
                            {booking.tonnesT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 border-t border-steel-100 pt-6 md:w-56 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-steel-800">
                      {isReceiving ? (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-xs font-medium text-steel-500 dark:text-gray-400">Actual Received (t)</label>
                            <input 
                              type="number" 
                              className="mt-1 block w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
                              value={actualT}
                              onChange={e => setActualT(e.target.value)}
                              placeholder={booking.tonnesT.toFixed(1)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <Button
                            size="sm"
                            disabled={!actualT || !Number.isFinite(Number(actualT)) || Number(actualT) < 0}
                            onClick={() => {
                              receiveLoadAction(booking.id, Number(actualT), [{
                                kind: "weighbridge-ticket",
                                label: `Manual entry`,
                                recordedAt: new Date().toISOString()
                              }]);
                              setReceivingId(null);
                            }}
                          >
                            Confirm Intake
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReceivingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => {
                          setReceivingId(booking.id);
                          setActualT(booking.tonnesT.toString());
                        }}>
                          Receive Load
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
