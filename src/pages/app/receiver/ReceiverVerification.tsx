import { useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion, AnimatePresence } from "motion/react";
import Button from "@/components/ui/button/Button";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { cn } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";

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
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Check & Accept | GreenLoop" description="Compare expected and received quantities, then confirm accepted material." />
      <WorkflowPageHeader
        title="Check & Accept"
        description="Compare the expected amount with the Weighbridge Ticket. Enter how much you accept; the provider is notified when you confirm."
        status={`${pendingVerifications.length} load${pendingVerifications.length === 1 ? "" : "s"} waiting for a check`}
      />
      {successMessage && <p role="status" className="mb-5 border-l-4 border-loop-500 bg-loop-50 px-4 py-3 text-sm font-medium text-loop-800 dark:bg-loop-500/10 dark:text-loop-200">{successMessage}</p>}

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
                  className="border border-steel-200 bg-white p-6 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white"
                >
                  <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status="pending" size="sm" />
                        <p className="text-sm font-medium text-steel-500 dark:text-steel-400">{vr.loadRef}</p>
                      </div>
                      
                      <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                        <p className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{material?.type} · {vr.plannedT.toFixed(1)} t expected, {vr.actualT.toFixed(1)} t arrived</p>
                        <details className="text-xs text-steel-500"><summary className="cursor-pointer">View details ▾</summary><span className="mt-1 block">Load: {vr.loadRef} · Booking: {booking?.id} · Variance: {varianceNum > 0 ? "+" : ""}{varianceNum.toFixed(1)} t</span></details>
                      </div>
                      
                      <div className="mt-6 rounded border border-steel-100 bg-steel-50/50 p-4 dark:border-steel-800 dark:bg-white/5">
                        <div className="grid grid-cols-3 gap-4 divide-x divide-steel-200 dark:divide-steel-800">
                          <div>
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected</p>
                            <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">
                              {vr.plannedT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                          <div className="pl-4">
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Arrived</p>
                            <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">
                              {vr.actualT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                          <div className="pl-4">
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Difference</p>
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
                            <label className="text-sm font-medium text-steel-700 dark:text-gray-300">Accepted quantity (t)</label>
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
                            size="md"
                            className="min-h-11 w-full"
                            disabled={!acceptedT || isNaN(Number(acceptedT)) || Number(acceptedT) > vr.actualT || (rejectedNum > 0 && !rejectReason)} 
                            onClick={() => {
                              verifyLoadAction(vr.id, acceptedNum, rejectedNum, rejectReason);
                              setSuccessMessage(`${acceptedNum.toFixed(1)} t accepted. The provider has been notified.`);
                              setVerifyingId(null);
                            }}
                          >
                            Confirm accepted
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setVerifyingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="md" className="min-h-11 w-full" onClick={() => {
                          setSuccessMessage("");
                          setVerifyingId(vr.id);
                          setAcceptedT(vr.actualT.toString());
                          setRejectReason("");
                        }}>
                          Check & accept
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
