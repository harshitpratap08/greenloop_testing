import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import VerificationDetails from "@/components/greenloop/VerificationDetails";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import Button from "@/components/ui/button/Button";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { CheckCircleIcon, DocsIcon } from "@/icons";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatINR, formatINRPerT } from "@/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { VerificationRecordCard } from "../Verification";
import ReceiverDeliveries from "./ReceiverDeliveries";

export default function ReceiverVerification() {
  const { t } = useTranslation();
  const { dataset, verifyLoadAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "";
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking") ?? undefined;
  const records = dataset.verifications.filter(v => v.receiverId === receiverId && (!bookingId || v.bookingId === bookingId));
  const completedRecords = records.filter(v => v.status !== "pending");
  const awaitingArrival = dataset.bookings.some(b => b.receiverId === receiverId && (!bookingId || b.id === bookingId) && b.status === "confirmed" && b.loadRef && !dataset.verifications.some(v => v.bookingId === b.id));
  
  const pendingVerifications = records.filter(v => v.status === "pending");

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [acceptedT, setAcceptedT] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Check & Accept | GreenLoop" description="Compare expected and received quantities, then confirm accepted material." />
      <WorkflowPageHeader
        title="Check & Accept"
        description="Compare the expected amount with the Weighbridge Ticket. Enter how much you accept; the provider is notified when you confirm."
        status={`${pendingVerifications.length} load${pendingVerifications.length === 1 ? "" : "s"} waiting for a check`}
      />

      <figure className="relative mb-section h-48 w-full overflow-hidden rounded-lg border border-steel-200 sm:h-52 lg:h-56 dark:border-steel-800">
        <img
          src={ambientMedia.weighbridge.src}
          alt={ambientMedia.weighbridge.alt}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" aria-hidden="true" />
        <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-5 sm:px-8 sm:pb-6">
          <p className="font-archivo text-lg font-bold uppercase tracking-wide text-white sm:text-xl">Check &amp; Accept</p>
          <p className="mt-1 text-sm text-white/85">Verify deliveries and confirm received quantities.</p>
        </figcaption>
      </figure>

      {successMessage && <p role="status" className="mb-5 border-l-4 border-loop-500 bg-loop-50 px-4 py-3 text-sm font-medium text-loop-800 dark:bg-loop-500/10 dark:text-loop-200">{successMessage}</p>}
      <ReceiverDeliveries key={bookingId ?? "all"} embedded bookingId={bookingId} onRecorded={() => setSuccessMessage(t("receiverDelivery.arrivalRecorded"))} />

      {pendingVerifications.length === 0 && !awaitingArrival && completedRecords.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center border border-steel-200 bg-white/55 px-6 py-12 text-center dark:border-steel-800 dark:bg-white/[0.02] sm:min-h-[340px] rounded-surface">
          <span className="relative mb-5 flex size-16 items-center justify-center text-loop-800 dark:text-loop-300" aria-hidden="true">
            <DocsIcon className="size-12" />
            <CheckCircleIcon className="absolute -bottom-1 -end-2 size-7 rounded-full bg-white text-loop-700 dark:bg-ink-950 dark:text-loop-300" />
          </span>
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white sm:text-2xl">No loads pending verification</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            When you receive material deliveries, they will appear here for final reconciliation.
          </p>
        </div>
      ) : (
        <div className="grid gap-card">
          <AnimatePresence>
            {pendingVerifications.map(vr => {
              const booking = dataset.bookings.find(b => b.id === vr.bookingId);
              const material = dataset.materials.find(m => m.id === vr.materialId);
              const offer = booking?.demandId ? dataset.offers?.find((item) => item.demandId === booking.demandId && item.passportId === vr.materialId) : undefined;
              const unitPrice = booking?.agreedPricePerT ?? offer?.agreedPricePerT ?? offer?.pricePerT ?? material?.pricePerT;

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
                  className="border border-steel-200 bg-white transition-colors hover:border-loop-500 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-loop-400 rounded-surface"
                >
                  <VerificationDetails image={materialMediaFor(material?.type ?? "concrete").src} name={material?.type ?? ""} status={t("verificationCards.pending")}>
                  <div className="grid gap-card md:grid-cols-[1fr_auto] gl-card-pad">
                    <div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status="pending" size="sm" />
                        <p className="text-sm font-medium text-steel-500 dark:text-steel-400">{vr.loadRef}</p>
                      </div>
                      {vr.evidence.filter(evidence => evidence.ref?.startsWith("/api/uploads/")).map(evidence => (
                        <a key={evidence.ref} href={evidence.ref} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-loop-700 underline dark:text-loop-300">{t("receiverDelivery.viewTicket")}: {evidence.label}</a>
                      ))}
                      
                      <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-3 sm:mt-6 sm:gap-x-8">
                        <p className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{material?.type} · {vr.plannedT.toFixed(1)} t expected, {vr.actualT.toFixed(1)} t arrived</p>
                        <p className="basis-full text-sm font-semibold text-loop-700 dark:text-loop-300">{unitPrice !== undefined ? `${formatINRPerT(unitPrice)} · ${formatINR(unitPrice * vr.actualT)} delivered value` : "Price on request"}</p>
                        <div className="text-xs text-steel-500"><span className="mt-1 block">Load: {vr.loadRef} · Booking: {booking?.id} · Variance: {varianceNum > 0 ? "+" : ""}{varianceNum.toFixed(1)} t</span></div>
                      </div>
                      
                      <div className="mt-5 border border-steel-100 bg-[#f7f7f3] p-3 sm:mt-6 sm:p-4 dark:border-steel-800 dark:bg-white/5 rounded-surface">
                        <div className="grid grid-cols-1 gap-detail divide-y divide-steel-200 sm:grid-cols-3 sm:gap-4 sm:divide-y-0 sm:divide-x dark:divide-steel-800">
                          <div>
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected</p>
                            <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">
                              {vr.plannedT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                          <div className="pt-3 sm:pl-4 sm:pt-0">
                            <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Arrived</p>
                            <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">
                              {vr.actualT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                            </p>
                          </div>
                          <div className="pt-3 sm:pl-4 sm:pt-0">
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
                              className="mt-1 block min-h-11 w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
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
                                className="mt-1 block min-h-11 w-full rounded-sm border-steel-300 text-sm shadow-sm focus:border-loop-500 focus:ring-loop-500 dark:border-steel-700 dark:bg-black dark:text-white"
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
                            disabled={saving || !acceptedT.trim() || !Number.isFinite(Number(acceptedT)) || Number(acceptedT) < 0 || Number(acceptedT) > vr.actualT || (rejectedNum > 0 && !rejectReason.trim())}
                            onClick={async () => {
                              if (saving) return;
                              setSaving(true);
                              try {
                                if (!await verifyLoadAction(vr.id, acceptedNum, rejectedNum, rejectReason.trim())) return;
                                setSuccessMessage(`${acceptedNum.toFixed(1)} t accepted. ${t("backend.providerCanView")}`);
                                setVerifyingId(null);
                              } finally { setSaving(false); }
                            }}
                          >
                            Confirm accepted
                          </Button>
                          <Button size="sm" variant="outline" disabled={saving} onClick={() => setVerifyingId(null)}>
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
                  </VerificationDetails>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {completedRecords.length > 0 && <section className="mt-6 space-y-4">
        <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{t("receiverDelivery.savedProof")}</h2>
        {completedRecords.map(record => <VerificationRecordCard key={record.id} verification={record} />)}
      </section>}
    </div>
  );
}
