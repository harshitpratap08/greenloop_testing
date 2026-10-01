import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import { materialMediaFor } from "@/config/appMedia";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { formatDate } from "@/utils";

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
      <PageMeta title="Incoming Deliveries | GreenLoop" description="See expected loads and record their arrival." />
      <PageBreadcrumb pageTitle="Incoming Deliveries" />
      <WorkflowPageHeader
        title="Incoming Deliveries"
        description="See what providers are sending to your facility. When a truck arrives, record the amount shown on the Weighbridge Ticket."
        status={`${expectedDeliveries.length} load${expectedDeliveries.length === 1 ? "" : "s"} expected`}
      />

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
                  className="border border-steel-200 bg-white p-6 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white"
                >
                  <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    <div className="md:grid md:grid-cols-[9rem_1fr] md:gap-5">
                      <img
                        src={materialMediaFor(material?.type ?? "concrete").src}
                        alt=""
                        loading="lazy"
                        className="hidden h-28 w-full border border-steel-200 object-cover md:block dark:border-steel-800"
                      />
                      <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status="confirmed" size="sm" />
                        <p className="font-semibold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t {material?.type} from {project?.name ?? "provider"}</p>
                      </div>
                      
                      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Material</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white capitalize">{material?.type}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Source Project</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{project?.location ?? project?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected Date</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{formatDate(dataset.slots.find(s => s.id === booking.slotId)?.date ?? "")}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected amount</p>
                          <p className="ledger-numeral mt-1 text-2xl font-bold text-ink-900 dark:text-white">
                            {booking.tonnesT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                          </p>
                        </div>
                      </div>
                      <details className="mt-4 text-xs text-steel-500"><summary className="cursor-pointer">View details ▾</summary><span className="mt-2 block">Booking ID: {booking.id} · Load reference: {booking.loadRef}</span></details>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-steel-100 pt-6 md:w-56 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-steel-800">
                      {isReceiving ? (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-xs font-medium text-steel-500 dark:text-gray-400">Amount received (t)</label>
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
                            Record arrival
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReceivingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="md" className="min-h-11 w-full md:w-auto" onClick={() => {
                          setReceivingId(booking.id);
                          setActualT(booking.tonnesT.toString());
                        }}>
                          Receive load
                        </Button>
                      )}
                    </div>
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
