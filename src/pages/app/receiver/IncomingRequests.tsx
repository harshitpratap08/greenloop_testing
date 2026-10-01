import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import Button from "@/components/ui/button/Button";
import { slotLedger, slotMatchesDemandPeriod } from "@/domain/capacity";
import { useAuth } from "@/context/AuthContext";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import { materialMediaFor } from "@/config/appMedia";

export default function IncomingRequests() {
  const { dataset, acceptRequestAction, rejectRequestAction, rescheduleRequestAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "R-001";
  
  const requests = dataset.bookings.filter((booking) => booking.receiverId === receiverId &&
    ((booking.status === "hold") || (booking.status === "confirmed" && !booking.receiverAcceptedAt && !booking.loadRef && !dataset.verifications.some((item) => item.bookingId === booking.id))));
  
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Incoming Requests | GreenLoop" description="Review provider requests for receiving capacity." />
      <PageBreadcrumb pageTitle="Incoming Requests" />
      <WorkflowPageHeader
        title="Incoming Requests"
        description="Providers are asking to book space at your facility. Confirm the amount you can receive, choose another date, or decline."
        status={`${requests.length} request${requests.length === 1 ? "" : "s"} waiting for your decision`}
      />

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
              const demand = booking.demandId ? dataset.demands.find((item) => item.id === booking.demandId) : undefined;
              const ledger = slot ? slotLedger(dataset, slot.id) : null;
              const committedMaterialT = dataset.bookings.filter((item) => item.id !== booking.id && item.materialId === booking.materialId && item.status !== "cancelled")
                .reduce((total, item) => total + item.tonnesT, 0);
              const materialRemainingT = Math.max(0, (material?.quantityT ?? 0) - committedMaterialT);
              const committedDemandT = booking.demandId ? dataset.bookings.filter((item) => item.id !== booking.id && item.demandId === booking.demandId && item.status !== "cancelled")
                .reduce((total, item) => total + item.tonnesT, 0) : 0;
              const demandRemainingT = demand ? Math.max(0, demand.requiredT - committedDemandT) : Infinity;
              const confirmableT = Math.max(0, Math.min(ledger?.available ?? 0, materialRemainingT, demandRemainingT));

              const isRescheduling = reschedulingId === booking.id;
              
              // Find alternative slots for this material
              const alternativeSlots = dataset.slots.filter(s => s.receiverId === receiverId && s.materialType === material?.type && s.id !== slot?.id && (!demand || slotMatchesDemandPeriod(s, demand.period)) && (slotLedger(dataset, s.id)?.available ?? 0) >= booking.tonnesT);
              
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
                      <div className="flex items-center gap-3">
                        <span className="rounded-sm border border-signal-200 bg-signal-50 px-2 py-0.5 text-xs font-bold tracking-wider text-signal-700 dark:border-signal-500/30 dark:bg-signal-500/10 dark:text-signal-400">
                          {booking.status === "hold" ? "Waiting on Capacity" : "Needs your approval"}
                        </span>
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">{project?.name ?? "Provider"} wants {booking.tonnesT.toFixed(1)} t {material?.type ?? "material"} {slot?.date ? `on ${slot.date}` : ""}.</p>
                      </div>
                      
                      <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Material</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white capitalize">{material?.type}</p>
                          <details className="mt-1 text-xs text-steel-500"><summary className="cursor-pointer">View details ▾</summary><span className="mt-1 block">Material Passport ID: {material?.id} · Request ID: {booking.id}</span></details>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Project</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{project?.name}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Requested Slot</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{slot?.date}</p>
                          {booking.holdReason && <p className="mt-0.5 text-sm text-signal-600 dark:text-signal-400">{booking.holdReason.replaceAll("HOLD", "Waiting on Capacity")}</p>}
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
                          <span className="font-medium text-steel-700 dark:text-gray-300">Capacity on {slot?.date}:</span>
                          <span className="font-bold text-ink-900 dark:text-white">{ledger.available.toFixed(1)} t free</span>
                          {booking.status === "hold" && ledger.available < booking.tonnesT && <span className="basis-full text-signal-700 dark:text-signal-300">You have {ledger.available.toFixed(1)} t free; this request is for {booking.tonnesT.toFixed(1)} t.</span>}
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
                            Confirm new date
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setReschedulingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          {booking.receiverAcceptedAt ? (
                            <p className="text-sm font-medium text-steel-600 dark:text-gray-400">Offer accepted. Waiting on capacity.</p>
                          ) : (
                            <Button size="sm" disabled={booking.status === "hold" && confirmableT <= 0} onClick={() => acceptRequestAction(booking.id, booking.status === "hold" && confirmableT < booking.tonnesT ? confirmableT : undefined)}>
                              {booking.status === "confirmed" ? "Confirm request" : booking.status === "hold" && confirmableT < booking.tonnesT ? `Confirm ${confirmableT.toFixed(1)} t` : "Confirm request"}
                            </Button>
                          )}
                          {booking.status === "hold" && <Button size="sm" variant="outline" disabled={alternativeSlots.length === 0} onClick={() => setReschedulingId(booking.id)}>
                            Propose another date
                          </Button>}
                          <Button size="sm" variant="outline" onClick={() => rejectRequestAction(booking.id)}>
                            Decline
                          </Button>
                        </>
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
