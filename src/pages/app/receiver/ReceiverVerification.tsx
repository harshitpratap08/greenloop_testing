import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { cn } from "@/utils";
import { useAuth } from "@/context/AuthContext";

export default function ReceiverVerification() {
  const { dataset, verifyLoadAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "R-001";
  
  const pendingVerifications = dataset.verifications.filter(v => 
    v.receiverId === receiverId && v.status === "pending"
  );

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [acceptedT, setAcceptedT] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Verification | GreenLoop" description="Verify received materials." />
      <PageBreadcrumb pageTitle="Verification" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Verify Materials
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          Reconcile received loads, record final accepted quantities, and mark material as verified to complete the recovery loop.
        </p>
      </motion.header>

      {pendingVerifications.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No loads pending verification</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            When you receive material deliveries, they will appear here for final reconciliation.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {pendingVerifications.map(vr => {
              const booking = dataset.bookings.find(b => b.id === vr.bookingId);
              const material = dataset.materials.find(m => m.id === vr.materialId);
              
              const isVerifying = verifyingId === vr.id;
              
              // Safe math for reconciliation form
              const acceptedNum = Number(acceptedT) || 0;
              const rejectedNum = Math.max(0, vr.actualT - acceptedNum);
              const varianceNum = vr.actualT - vr.plannedT;
              
              return (
                <motion.article
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={vr.id}
                  className="rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
                >
                  <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status="pending" size="sm" />
                        <p className="text-sm font-medium text-steel-500 dark:text-steel-400">{vr.loadRef}</p>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap gap-8">
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Material</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white capitalize">{material?.type}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Booking Ref</p>
                          <p className="mt-1 font-semibold text-ink-900 dark:text-white">{booking?.id}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 rounded border border-steel-100 bg-steel-50/50 p-4 dark:border-steel-800 dark:bg-white/5">
                        <div className="grid grid-cols-3 gap-4 divide-x divide-steel-200 dark:divide-steel-800">
                          <div>
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected (Planned)</p>
                            <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">
                              {vr.plannedT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                          <div className="pl-4">
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Received (Actual)</p>
                            <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">
                              {vr.actualT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                          <div className="pl-4">
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Variance</p>
                            <p className={cn(
                              "ledger-numeral mt-1 text-xl font-bold",
                              varianceNum > 0 ? "text-loop-600 dark:text-loop-400" : varianceNum < 0 ? "text-signal-600 dark:text-signal-400" : "text-ink-900 dark:text-white"
                            )}>
                              {varianceNum > 0 ? "+" : ""}{varianceNum.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 border-t border-steel-100 pt-6 md:w-64 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-steel-800">
                      {isVerifying ? (
                        <div className="flex flex-col gap-4">
                          <div>
                            <label className="text-xs font-medium text-steel-500 dark:text-gray-400">Final Accepted Quantity (t)</label>
                            <input 
                              type="number" 
                              className="mt-1 block w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
                              value={acceptedT}
                              onChange={e => setAcceptedT(e.target.value)}
                              placeholder={vr.actualT.toFixed(1)}
                              min="0"
                              max={vr.actualT}
                              step="0.1"
                            />
                            {rejectedNum > 0 && (
                              <p className="mt-1 text-xs text-signal-600 dark:text-signal-400">
                                {rejectedNum.toFixed(1)} t will be marked as rejected.
                              </p>
                            )}
                          </div>
                          
                          {rejectedNum > 0 && (
                            <div>
                              <label className="text-xs font-medium text-steel-500 dark:text-gray-400">Reason for Rejection</label>
                              <input 
                                type="text" 
                                className="mt-1 block w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="e.g. Contamination"
                                required
                              />
                            </div>
                          )}

                          <Button 
                            size="sm" 
                            disabled={!acceptedT || isNaN(Number(acceptedT)) || Number(acceptedT) > vr.actualT || (rejectedNum > 0 && !rejectReason)} 
                            onClick={() => {
                              verifyLoadAction(vr.id, acceptedNum, rejectedNum, rejectReason);
                              setVerifyingId(null);
                            }}
                          >
                            Confirm Reconciliation
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setVerifyingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => {
                          setVerifyingId(vr.id);
                          setAcceptedT(vr.actualT.toString());
                          setRejectReason("");
                        }}>
                          Verify & Reconcile
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
