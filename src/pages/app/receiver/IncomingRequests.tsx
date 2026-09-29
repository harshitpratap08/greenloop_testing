import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import Button from "@/components/ui/button/Button";
import { slotLedger } from "@/domain/capacity";

export default function IncomingRequests() {
  const { dataset, acceptRequestAction, rejectRequestAction, rescheduleRequestAction } = useGreenLoopStore();
  const receiverId = "R-001";
  
  const requests = dataset.bookings.filter(b => b.receiverId === receiverId && b.status === "hold");
  
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Incoming Requests | GreenLoop" description="Review material requests." />
      <PageBreadcrumb pageTitle="Incoming Requests" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Incoming Requests
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Review requests that exceeded your automatic capacity limits. You can manually accept them, suggest a different slot, or reject them.
        </p>
      </motion.header>

      {requests.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No incoming requests</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            When a provider requests receiving capacity and it requires manual approval, requests will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {requests.map(booking => {
              const material = dataset.materials.find(m => m.id === booking.materialId);
              const project = dataset.projects.find(p => p.id === material?.projectId);
              const slot = dataset.slots.find(s => s.id === booking.slotId);
              const ledger = slot ? slotLedger(dataset, slot.id) : null;
              
              const isRescheduling = reschedulingId === booking.id;
              
              // Find alternative slots for this material
              const alternativeSlots = dataset.slots.filter(s => s.receiverId === receiverId && s.materialType === material?.type && s.id !== slot?.id);
              
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
                        <span className="rounded-sm border border-signal-200 bg-signal-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-signal-700 dark:border-signal-500/30 dark:bg-signal-500/10 dark:text-signal-400">
                          Needs Review
                        </span>
                        <p className="text-sm font-medium text-steel-500 dark:text-steel-400">Request {booking.id}</p>
                      </div>
                      
                      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Material</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white capitalize">{material?.type}</p>
                          <p className="mt-0.5 text-sm text-steel-600 dark:text-gray-400">Passport: {material?.id}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Project</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{project?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Requested Slot</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{slot?.date}</p>
                          <p className="mt-0.5 text-sm text-signal-600 dark:text-signal-400">{booking.holdReason}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Requested Quantity</p>
                          <p className="ledger-numeral mt-1 text-2xl font-bold text-ink-900 dark:text-white">
                            {booking.tonnesT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                          </p>
                        </div>
                      </div>
                      
                      {ledger && (
                        <div className="mt-6 flex items-center gap-4 rounded bg-steel-50 px-4 py-3 text-sm dark:bg-white/5">
                          <span className="font-medium text-steel-700 dark:text-gray-300">Slot {slot?.date} Status:</span>
                          <span className="font-bold text-ink-900 dark:text-white">{ledger.available.toFixed(1)} t available</span>
                          <span className="text-steel-500">/</span>
                          <span className="text-steel-600 dark:text-gray-400">{ledger.reserved.toFixed(1)} t reserved</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-3 border-t border-steel-100 pt-6 md:w-48 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-steel-800">
                      {isRescheduling ? (
                        <div className="flex flex-col gap-3">
                          <select 
                            className="block w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
                            value={selectedSlotId}
                            onChange={e => setSelectedSlotId(e.target.value)}
                          >
                            <option value="" disabled>Select alternative slot</option>
                            {alternativeSlots.map(s => {
                              const l = slotLedger(dataset, s.id);
                              return (
                                <option key={s.id} value={s.id}>{s.date} ({l?.available.toFixed(1)}t free)</option>
                              );
                            })}
                          </select>
                          <Button size="sm" disabled={!selectedSlotId} onClick={() => {
                            rescheduleRequestAction(booking.id, selectedSlotId);
                            setReschedulingId(null);
                          }}>
                            Confirm Reschedule
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReschedulingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" onClick={() => acceptRequestAction(booking.id)}>
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReschedulingId(booking.id)}>
                            Reschedule
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            if (window.confirm("Are you sure you want to reject this request?")) {
                              rejectRequestAction(booking.id);
                            }
                          }}>
                            Reject
                          </Button>
                        </>
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
