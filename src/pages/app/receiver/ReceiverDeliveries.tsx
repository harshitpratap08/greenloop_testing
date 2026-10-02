import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import { materialMediaFor, ambientMedia } from "@/config/appMedia";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { formatDate } from "@/utils";
import { TruckDelivery } from "@/icons";

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
      <WorkflowPageHeader
        title="Incoming Deliveries"
        description="See what providers are sending to your facility. When a truck arrives, record the amount shown on the Weighbridge Ticket."
        status={`${expectedDeliveries.length} load${expectedDeliveries.length === 1 ? "" : "s"} expected`}
      />

      {/* Incoming deliveries — loads arriving at the intake gate */}
      <figure className="relative mb-8 h-40 w-full overflow-hidden rounded-lg border border-steel-200 sm:h-52 lg:h-60 dark:border-steel-800">
        <img
          src={ambientMedia.authTruck.src}
          alt={ambientMedia.authTruck.alt}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/25 to-ink-950/10" aria-hidden="true" />
        <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-5 sm:px-8 sm:pb-6">
          <p className="font-archivo text-lg font-bold uppercase tracking-wide text-white sm:text-xl">Incoming deliveries</p>
          <p className="mt-1 text-sm text-white/80">Track and record material deliveries to keep your facility operations accurate.</p>
        </figcaption>
      </figure>

      {expectedDeliveries.length === 0 ? (
        <div className="flex min-h-[42vh] flex-col items-center justify-center rounded-lg border border-steel-200 bg-white/70 px-6 py-14 text-center dark:border-steel-800 dark:bg-white/[0.02]">
          <span className="flex size-16 items-center justify-center rounded-full bg-loop-50 dark:bg-loop-500/10">
            <TruckDelivery className="size-8 text-loop-600 dark:text-loop-400" />
          </span>
          <h2 className="mt-5 font-archivo text-2xl font-bold text-ink-900 dark:text-white">No upcoming deliveries</h2>
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
                  className="overflow-hidden rounded-lg border border-steel-200 bg-white shadow-xs transition-colors hover:border-steel-400 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-steel-600"
                >
                  <div className="p-5 sm:p-6">
                    <div className="grid gap-6 md:grid-cols-[10rem_1fr]">
                      <img
                        src={materialMediaFor(material?.type ?? "concrete").src}
                        alt=""
                        loading="lazy"
                        className="h-28 w-full rounded-md border border-steel-200 object-cover md:h-full md:min-h-28 dark:border-steel-800"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge status="confirmed" size="sm" />
                          <p className="font-semibold text-ink-900 dark:text-white">{booking.tonnesT.toFixed(1)} t {material?.type} from {project?.name ?? "provider"}</p>
                        </div>

                        <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Material</p>
                            <p className="mt-1.5 font-semibold text-ink-900 dark:text-white capitalize">{material?.type}</p>
                          </div>
                          <div>
                            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Source project</p>
                            <p className="mt-1.5 font-semibold text-ink-900 dark:text-white">{project?.location ?? project?.name}</p>
                          </div>
                          <div>
                            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Expected date</p>
                            <p className="mt-1.5 font-semibold text-ink-900 dark:text-white">{formatDate(dataset.slots.find(s => s.id === booking.slotId)?.date ?? "")}</p>
                          </div>
                          <div>
                            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Expected amount</p>
                            <p className="ledger-numeral mt-1.5 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                              {booking.tonnesT.toFixed(1)} <span className="text-sm font-bold text-steel-400">t</span>
                            </p>
                          </div>
                        </div>
                        <details className="mt-4 text-xs text-steel-500"><summary className="cursor-pointer">View details ▾</summary><span className="mt-2 block">Booking ID: {booking.id} · Load reference: {booking.loadRef}</span></details>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-0">
                      {isReceiving ? (
                        <div className="mt-6 flex flex-col gap-3 border-t border-steel-100 pt-5 sm:flex-row sm:items-end sm:justify-end dark:border-steel-800/60">
                          <div>
                            <label className="eyebrow-label text-steel-500 dark:text-steel-400">Amount received (t)</label>
                            <input
                              type="number"
                              className="mt-1.5 block w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 sm:w-40 dark:border-steel-700 dark:bg-black dark:text-white"
                              value={actualT}
                              onChange={e => setActualT(e.target.value)}
                              placeholder={booking.tonnesT.toFixed(1)}
                              min="0"
                              step="0.1"
                            />
                          </div>
                          <div className="flex gap-3">
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
                        </div>
                      ) : (
                        <div className="mt-6 border-t border-steel-100 pt-5 dark:border-steel-800/60">
                          <Button size="md" className="min-h-11 w-full sm:w-auto" onClick={() => {
                            setReceivingId(booking.id);
                            setActualT(booking.tonnesT.toString());
                          }}>
                            Receive load
                          </Button>
                        </div>
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
