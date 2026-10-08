import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import Button from "@/components/ui/button/Button";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatINR, formatINRPerT, formatDate, materialTypeLabel } from "@/utils";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { VerificationRecordCard } from "../Verification";
import ReceiverDeliveries from "./ReceiverDeliveries";

const EASE = [0.22, 1, 0.36, 1] as const;

type VerifyTab = "PENDING" | "COMPLETED" | "ALL";

const TABS: { key: VerifyTab; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETED", label: "Completed" },
  { key: "ALL", label: "All" },
];

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function HeroStatIcon({ kind }: { kind: "pending" | "completed" | "issues" }) {
  const paths = {
    pending: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11Z" /><path d="M12 10.5v5M9.5 13h5" strokeLinecap="round" /></>,
    completed: <><circle cx="12" cy="12" r="8.4" /><path d="m8.4 12.4 2.4 2.4 4.8-5.2" strokeLinecap="round" strokeLinejoin="round" /></>,
    issues: <><path d="M12 4.4 3.2 19.6h17.6L12 4.4Z" /><path d="M12 10.5v4M12 17h.01" strokeLinecap="round" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="size-5">
      {paths[kind]}
    </svg>
  );
}

function RowIcon({ kind }: { kind: "load" | "location" | "calendar" }) {
  const paths = {
    load: <><path d="M6 6h13l-1.4 7.6a1.6 1.6 0 0 1-1.6 1.4H8.7a1.6 1.6 0 0 1-1.6-1.3L5.5 4.6A1 1 0 0 0 4.5 3.8H3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.4" cy="18.6" r="1.4" /><circle cx="16.4" cy="18.6" r="1.4" /></>,
    location: <><path d="M12 21s-6.5-5.3-6.5-10.2a6.5 6.5 0 1 1 13 0C18.5 15.7 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.2" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="15.5" rx="1.8" /><path d="M8 3.5v4M16 3.5v4M4 10.5h16" strokeLinecap="round" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-3.5 shrink-0 text-steel-400 dark:text-[#7a927f]">
      {paths[kind]}
    </svg>
  );
}

function CardStat({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "positive" | "alert" }) {
  const toneClass = tone === "positive" ? "text-loop-700 dark:text-loop-400" : tone === "alert" ? "text-signal-700 dark:text-signal-400" : "text-ink-900 dark:text-white";
  return (
    <div className="min-w-0 text-end">
      <p className="text-[11px] font-medium text-steel-500 dark:text-[#a7b8ab]">{label}</p>
      <p className={cn("ledger-numeral mt-0.5 text-base font-bold", toneClass)}>{value}</p>
    </div>
  );
}

/** One load's workflow position, for the list-row status pill. */
function deliveryStage(
  verification: { status: string } | undefined,
): { label: "Ready to verify" | "Pending review" | "Accepted" | "Rejected"; tone: "green" | "amber" | "green-outline" | "red" } {
  if (verification?.status === "verified") return { label: "Accepted", tone: "green" };
  if (verification?.status === "rejected") return { label: "Rejected", tone: "red" };
  if (verification?.status === "pending") return { label: "Pending review", tone: "amber" };
  return { label: "Ready to verify", tone: "green-outline" };
}

function StagePill({ label, tone }: { label: string; tone: "green" | "amber" | "green-outline" | "red" }) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
      tone === "green" && "bg-[#dff0e2] text-[#1d4630] dark:bg-[#22402f] dark:text-[#8fe0a4]",
      tone === "green-outline" && "border border-[#b9c8ba] bg-white text-[#1d4630] dark:border-[#3c6d49] dark:bg-transparent dark:text-[#8fe0a4]",
      tone === "amber" && "bg-[#f7ecd6] text-[#8a6414] dark:bg-[#40351c] dark:text-[#e5c476]",
      tone === "red" && "bg-[#f8e4e1] text-[#9b3e35] dark:bg-[#43261f] dark:text-[#ee9d92]",
    )}>
      <span aria-hidden="true" className={cn(
        "size-2 rounded-full",
        tone === "green" && "bg-[#2fae5e]",
        tone === "green-outline" && "border border-[#2fae5e]",
        tone === "amber" && "bg-[#e0a83c]",
        tone === "red" && "bg-[#d15648]",
      )} />
      {label}
    </span>
  );
}

interface DeliveryRow {
  key: string;
  bookingId: string;
  booking?: { id: string; materialId: string; tonnesT: number; slotId?: string; loadRef?: string; status: string; demandId?: string; agreedPricePerT?: number };
  verification?: {
    id: string; bookingId: string; loadRef: string; materialId: string; plannedT: number; actualT: number; acceptedT: number; rejectedT: number; status: string; verifiedAt?: string;
  };
}

/* ------------------------------------------------------------------ */
/* Detail view — embedded arrival recording + pending verification +   */
/* proof records. Same components and logic as the previous page.      */
/* ------------------------------------------------------------------ */

function DeliveryDetailView({ bookingId, onRecorded }: { bookingId: string; onRecorded: (message: string) => void }) {
  const { t } = useTranslation();
  const { dataset, verifyLoadAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "";

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [acceptedT, setAcceptedT] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const pendingVerifications = dataset.verifications.filter(v => v.receiverId === receiverId && v.bookingId === bookingId && v.status === "pending");
  const completedRecords = dataset.verifications.filter(v => v.receiverId === receiverId && v.bookingId === bookingId && v.status !== "pending");

  return (
    <>
      <ReceiverDeliveries embedded bookingId={bookingId} onRecorded={() => onRecorded(t("receiverDelivery.arrivalRecorded"))} />

      {pendingVerifications.length === 0 && completedRecords.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center border border-steel-200 bg-white/55 px-6 py-12 text-center dark:border-steel-800 dark:bg-white/[0.02] sm:min-h-[340px] rounded-surface">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white sm:text-2xl">Nothing to check on this load yet</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">Record the arrival above once the truck reaches your gate; verification opens from there.</p>
        </div>
      ) : (
        <div className="grid gap-card">
          {pendingVerifications.map(vr => (
            <PendingCheckCard
              key={vr.id}
              verification={vr}
              verifying={verifyingId === vr.id}
              onStart={() => { setVerifyingId(vr.id); setAcceptedT(vr.actualT.toString()); setRejectReason(""); }}
              onCancel={() => setVerifyingId(null)}
              acceptedT={acceptedT}
              setAcceptedT={setAcceptedT}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              saving={saving}
              setSaving={setSaving}
              verifyLoadAction={verifyLoadAction}
              onDone={(message) => { setVerifyingId(null); onRecorded(message); }}
            />
          ))}
        </div>
      )}

      {completedRecords.length > 0 && (
        <section className="mt-6 space-y-4">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{t("receiverDelivery.savedProof")}</h2>
          {completedRecords.map(record => <VerificationRecordCard key={record.id} verification={record} />)}
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Pending verification card — identical form logic to the previous    */
/* page: accepted quantity input, rejection reason, confirm action.    */
/* ------------------------------------------------------------------ */

function PendingCheckCard({
  verification: vr,
  verifying,
  onStart,
  onCancel,
  acceptedT,
  setAcceptedT,
  rejectReason,
  setRejectReason,
  saving,
  setSaving,
  verifyLoadAction,
  onDone,
}: {
  verification: { id: string; bookingId: string; loadRef: string; materialId: string; plannedT: number; actualT: number; acceptedT: number; rejectedT: number; status: string; evidence: { ref?: string; label: string }[] };
  verifying: boolean;
  onStart: () => void;
  onCancel: () => void;
  acceptedT: string;
  setAcceptedT: (value: string) => void;
  rejectReason: string;
  setRejectReason: (value: string) => void;
  saving: boolean;
  setSaving: (value: boolean) => void;
  verifyLoadAction: (id: string, acceptedT: number, rejectedT: number, reason: string) => Promise<boolean>;
  onDone: (message: string) => void;
}) {
  const { dataset } = useGreenLoopStore();
  const booking = dataset.bookings.find(b => b.id === vr.bookingId);
  const material = dataset.materials.find(m => m.id === vr.materialId);
  const offer = booking?.demandId ? dataset.offers?.find((item) => item.demandId === booking.demandId && item.passportId === vr.materialId) : undefined;
  const unitPrice = booking?.agreedPricePerT ?? offer?.agreedPricePerT ?? offer?.pricePerT ?? material?.pricePerT;
  const varianceNum = vr.actualT - vr.plannedT;

  const acceptedNum = Number(acceptedT) || 0;
  const rejectedNum = Math.max(0, vr.actualT - acceptedNum);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-steel-200 bg-white transition-colors hover:border-loop-500 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-loop-400 rounded-surface"
    >
      <div className="grid gap-card md:grid-cols-[1fr_auto] gl-card-pad">
        <div>
          <div className="flex items-center gap-3">
            <StatusBadge status="pending" size="sm" />
            <p className="text-sm font-medium text-steel-500 dark:text-steel-400">{vr.loadRef}</p>
          </div>
          {vr.evidence.filter(evidence => evidence.ref?.startsWith("/api/uploads/")).map(evidence => (
            <a key={evidence.ref} href={evidence.ref} target="_blank" rel="noreferrer" className="mt-3 block text-sm text-loop-700 underline dark:text-loop-300">View ticket: {evidence.label}</a>
          ))}

          <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-3 sm:mt-6 sm:gap-x-8">
            <p className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{material?.type} · {vr.plannedT.toFixed(1)} t expected, {vr.actualT.toFixed(1)} t arrived</p>
            <p className="basis-full text-sm font-semibold text-loop-700 dark:text-loop-300">{unitPrice !== undefined ? `${formatINRPerT(unitPrice)} · ${formatINR(unitPrice * vr.acceptedT)} accepted value` : "Price on request"}</p>
            <div className="text-xs text-steel-500"><span className="mt-1 block">Load: {vr.loadRef} · Booking: {booking?.id} · Variance: {varianceNum > 0 ? "+" : ""}{varianceNum.toFixed(1)} t</span></div>
          </div>

          <div className="mt-5 border border-steel-100 bg-[#f7f7f3] p-3 sm:mt-6 sm:p-4 dark:border-steel-800 dark:bg-white/5 rounded-surface">
            <div className="grid grid-cols-1 gap-detail divide-y divide-steel-200 sm:grid-cols-3 sm:gap-4 sm:divide-y-0 sm:divide-x dark:divide-steel-800">
              <div>
                <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Expected</p>
                <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">{vr.plannedT.toFixed(1)} <span className="text-sm text-steel-500">t</span></p>
              </div>
              <div className="pt-3 sm:pl-4 sm:pt-0">
                <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Arrived</p>
                <p className="ledger-numeral mt-1 text-xl font-bold text-ink-900 dark:text-white">{vr.actualT.toFixed(1)} <span className="text-sm text-steel-500">t</span></p>
              </div>
              <div className="pt-3 sm:pl-4 sm:pt-0">
                <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Difference</p>
                <p className={cn(
                  "ledger-numeral mt-1 text-xl font-bold",
                  varianceNum > 0 ? "text-loop-600 dark:text-loop-400" : varianceNum < 0 ? "text-signal-600 dark:text-signal-400" : "text-ink-900 dark:text-white",
                )}>{varianceNum > 0 ? "+" : ""}{varianceNum.toFixed(1)} <span className="text-sm text-steel-500">t</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-steel-100 pt-6 md:w-64 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-steel-800">
          {verifying ? (
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
                {rejectedNum > 0 && <p className="mt-1 text-xs text-signal-600 dark:text-signal-400">{rejectedNum.toFixed(1)} t will be marked as rejected.</p>}
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
                    onDone(`${acceptedNum.toFixed(1)} t accepted.`);
                  } finally { setSaving(false); }
                }}
              >
                Confirm accepted
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
            </div>
          ) : (
            <Button size="md" className="min-h-11 w-full" onClick={onStart}>Check &amp; accept</Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Detail view wrapper with the success banner                          */
/* ------------------------------------------------------------------ */

function DeliveryDetailScreen({ bookingId }: { bookingId: string }) {
  const { t } = useTranslation();
  const [successMessage, setSuccessMessage] = useState("");
  return (
    <div className="mx-auto max-w-app pb-16">
      <PageMeta title="Delivery details | GreenLoop" description="Record arrival, confirm accepted quantity and review delivery proof." />

      <div className="mx-auto max-w-app px-4 pt-6 sm:px-card xl:px-section">
        <Link
          to="/app/receiver/verification"
          className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-steel-600 transition hover:text-[#315c3d] dark:text-gray-300 dark:hover:text-[#8fe0a4]"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="M19 12H5m6 6-6-6 6-6" /></svg>
          {t("verificationCards.details") === "Details" ? "Back to verification" : "Back to verification"}
        </Link>
        <WorkflowPageHeader
          title="Verify & Accept Delivery"
          description="Compare the expected quantity with the received quantity and confirm how much you accept."
          status="Delivery detail"
        />
      </div>

      {successMessage && <p role="status" className="mx-auto mb-5 max-w-app border-l-4 border-loop-500 bg-loop-50 px-4 py-3 text-sm font-medium text-loop-800 sm:mx-auto dark:bg-loop-500/10 dark:text-loop-200">{successMessage}</p>}

      <div className="mx-auto max-w-app px-4 pb-4 sm:px-card xl:px-section">
        <DeliveryDetailView bookingId={bookingId} onRecorded={(message) => { setSuccessMessage(message); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page — cinematic hero + pill tabs + compact delivery rows      */
/* ------------------------------------------------------------------ */

/**
 * Receiver Verification (Check & Accept).
 *
 * The list keeps only the essentials — stage pill, material/project line and
 * one "View delivery →" action. The full flow (record arrival, confirm
 * accepted quantity, evidence, proof, event trail) opens in the delivery
 * detail view `/app/receiver/verification?booking=<bookingId>`, which re-uses
 * the same ReceiverDeliveries and verification logic untouched.
 */
export default function ReceiverVerification() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const receiverId = user?.receiverId ?? "";
  const [searchParams] = useSearchParams();
  const bookingParam = searchParams.get("booking") ?? undefined;

  const [activeTab, setActiveTab] = useState<VerifyTab>("PENDING");
  const [search, setSearch] = useState("");

  /* -------------------------------------------------------------- */
  /* Delivery detail screen (?booking=)                              */
  /* -------------------------------------------------------------- */
  if (bookingParam) return <DeliveryDetailScreen bookingId={bookingParam} />;

  const incomingBookings = dataset.bookings.filter(b => b.receiverId === receiverId && b.status === "confirmed" && b.loadRef && !dataset.verifications.some(v => v.bookingId === b.id));
  const records = dataset.verifications.filter(v => v.receiverId === receiverId);
  const pendingRecords = records.filter(v => v.status === "pending");
  const completedRecords = records.filter(v => v.status !== "pending");
  const issueCount = completedRecords.filter(record => record.rejectedT > 0).length;

  const rows: DeliveryRow[] = [
    ...incomingBookings.map(booking => ({ key: `bk-${booking.id}`, bookingId: booking.id, booking })),
    ...pendingRecords.map(verification => ({ key: `pend-${verification.id}`, bookingId: verification.bookingId, verification })),
    ...completedRecords.map(verification => ({ key: `done-${verification.id}`, bookingId: verification.bookingId, verification })),
  ];

  const counts: Record<VerifyTab, number> = {
    PENDING: incomingBookings.length + pendingRecords.length,
    COMPLETED: completedRecords.length,
    ALL: rows.length,
  };

  const filteredRows = rows.filter(({ booking, verification }) => {
    const tabOk = activeTab === "ALL"
      ? true
      : activeTab === "PENDING"
        ? !verification
        : Boolean(verification);
    if (!tabOk) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    const material = dataset.materials.find(m => m.id === (booking?.materialId ?? verification?.materialId));
    const project = material && dataset.projects.find(p => p.id === material.projectId);
    const provider = dataset.transactionContacts?.find(c => c.materialId === (booking?.materialId ?? verification?.materialId))?.organization;
    return `${material?.type ?? ""} ${project?.name ?? ""} ${provider ?? ""} ${verification?.loadRef ?? booking?.loadRef ?? ""} ${booking?.id ?? ""}`.toLowerCase().includes(query);
  });

  return (
    <div className="pb-16">
      <PageMeta title="Check & Accept | GreenLoop" description="Compare expected and received quantities, then confirm accepted material." />

      {/* ---------------------------------------------------------- */}
      {/* Cinematic hero — Check & Accept                             */}
      {/* ---------------------------------------------------------- */}
      <section className="relative isolate" aria-labelledby="check-accept-title">
        <div className="relative h-[300px] overflow-hidden sm:h-[330px] lg:h-[350px]">
          <img
            src={ambientMedia.weighbridge.src}
            alt={ambientMedia.weighbridge.alt}
            className={`absolute inset-0 size-full object-cover ${reduceMotion ? "" : "motion-safe:animate-gl-hero-zoom"}`}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0a1c10]/82 via-[#0a1c10]/55 to-[#0a1c10]/10" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#f6f5f0] to-transparent dark:from-[#101913]" />

          <motion.div
            className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col justify-center px-5 sm:px-9 lg:px-12 xl:px-16"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8e5d9] backdrop-blur-sm sm:text-xs">Receiver Operations</p>
            <h1 id="check-accept-title" className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-[3.5rem]">
              Verifi<span className="text-[#6ee584]">cation</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">Verify deliveries and confirm received quantities from providers.</p>

            <dl className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              {([
                { kind: "pending", value: counts.PENDING.toLocaleString("en-IN"), label: "Pending" },
                { kind: "completed", value: counts.COMPLETED.toLocaleString("en-IN"), label: "Completed" },
                { kind: "issues", value: issueCount.toLocaleString("en-IN"), label: "Issues" },
              ] as const).map((stat) => (
                <div key={stat.label} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#b9d8bf]">
                    <HeroStatIcon kind={stat.kind} />
                  </span>
                  <div>
                    <dd className="ledger-numeral font-archivo text-lg font-bold leading-5 text-white">{stat.value}</dd>
                    <dt className="text-xs leading-4 text-white/70">{stat.label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Tabs + search + compact delivery cards                      */}
      {/* ---------------------------------------------------------- */}
      <div className="mx-auto max-w-app px-4 pt-6 sm:px-card xl:px-section">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px",
                  active
                    ? "border-[#315b3c] bg-[#0f2d1c] text-white shadow-[0_4px_12px_rgba(15,45,28,0.28)] dark:border-[#527e5c] dark:bg-[#2c4233]"
                    : "border-[#e3e3d9] bg-white/85 text-[#4f5b51] hover:border-[#b9c8ba] hover:bg-[#f1f5ef] hover:text-[#315c3d] dark:border-steel-700 dark:bg-[#17251d] dark:text-gray-300 dark:hover:bg-[#2c4233]/50 dark:hover:text-white",
                )}
              >
                {tab.label}
                <span className={cn("ledger-numeral rounded-full px-1.5 py-0.5 text-xs", active ? "bg-white/15 text-[#cfe6d3]" : "bg-[#eef2ec] text-[#5c6a5f] dark:bg-white/10 dark:text-gray-300")}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
          <label className="relative ms-auto hidden min-w-0 sm:block sm:w-60 lg:w-72">
            <span className="sr-only">Search deliveries</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-steel-400"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search material, project or provider…"
              className="h-10 w-full rounded-full border border-[#e3e3d9] bg-white/85 ps-9 pe-3 text-sm text-ink-900 outline-none transition focus:border-loop-500 focus:ring-2 focus:ring-loop-500/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white"
            />
          </label>
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-steel-300 bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02]">
            <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">
              {counts.ALL ? "No deliveries match this view" : "No loads pending verification"}
            </h2>
            <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">
              {counts.ALL ? "Try a different tab or clear the search." : "When you receive material deliveries, they will appear here for final reconciliation."}
            </p>
          </div>
        ) : (
          <motion.section
            aria-label="Deliveries"
            className="flex flex-col gap-4"
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {filteredRows.map(({ booking, verification, bookingId }) => {
              const material = dataset.materials.find(m => m.id === (booking?.materialId ?? verification?.materialId));
              const project = material && dataset.projects.find(p => p.id === material.projectId);
              const media = materialMediaFor(material?.type ?? "concrete");
              const stage = deliveryStage(verification);
              const plannedT = verification?.plannedT ?? booking?.tonnesT ?? 0;
              const slotDate = booking ? dataset.slots.find(s => s.id === booking.slotId)?.date : undefined;
              const offer = booking?.demandId ? dataset.offers?.find((item) => item.demandId === booking.demandId && item.passportId === booking.materialId) : undefined;
              const unitPrice = booking?.agreedPricePerT ?? offer?.agreedPricePerT ?? offer?.pricePerT ?? material?.pricePerT;
              return (
                <motion.article
                  key={verification ? `vr-${verification.id}` : `bk-${booking?.id}`}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4, ease: EASE }}
                  whileHover={reduceMotion ? undefined : { y: -3 }}
                  className="group/card flex min-w-0 items-stretch overflow-hidden rounded-2xl border border-[#e7e4db] bg-white p-3 shadow-[0_2px_10px_rgba(26,42,31,0.05)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(26,42,31,0.12)] dark:border-steel-800 dark:bg-[#17251d] sm:p-3.5"
                >
                  <div className="relative aspect-[4/3] w-24 shrink-0 self-stretch overflow-hidden rounded-xl sm:aspect-auto sm:w-32">
                    <img src={media.src} alt={media.alt} loading="lazy" className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-[900ms] group-hover/card:scale-[1.06]" />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a1c10]/30 via-transparent to-transparent" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2 ps-3.5 sm:ps-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <h2 className="inline-flex items-baseline gap-2 font-archivo text-base font-bold capitalize text-ink-900 dark:text-white sm:text-lg">
                        {material?.type ?? "Material"}
                      </h2>
                      <StagePill label={stage.label} tone={stage.tone} />
                    </div>
                    <div className="grid content-start gap-1 sm:grid-cols-2 lg:grid-cols-3">
                      <span className="flex min-w-0 items-start gap-1.5 text-xs text-steel-600 dark:text-[#a7b8ab]">
                        <RowIcon kind="load" />
                        <span className="min-w-0 truncate">{project?.name ?? "Provider delivery"} · Load {verification?.loadRef ?? booking?.loadRef ?? "—"}</span>
                      </span>
                      <span className="flex min-w-0 items-start gap-1.5 text-xs text-steel-600 dark:text-[#a7b8ab]">
                        <RowIcon kind="location" />
                        <span className="min-w-0 truncate">{project?.location ?? "Your facility"} · {materialTypeLabel(material?.type ?? "unknown")}</span>
                      </span>
                      <span className="flex min-w-0 items-start gap-1.5 text-xs text-steel-600 dark:text-[#a7b8ab]">
                        <RowIcon kind="calendar" />
                        <span className="min-w-0 truncate">{unitPrice !== undefined ? `${formatINRPerT(unitPrice)}` : "Price on request"}{slotDate ? ` · ${formatDate(slotDate)}` : verification?.verifiedAt ? ` · ${formatDate(verification.verifiedAt.slice(0, 10))}` : ""}</span>
                      </span>
                    </div>
                  </div>

                  {/* Metrics + CTA */}
                  <div className="flex w-40 shrink-0 flex-col items-end justify-between gap-2 ps-2 sm:w-52 sm:ps-3">
                    <div className="grid w-full grid-cols-2 gap-x-3">
                      <CardStat label="Expected" value={`${plannedT.toFixed(1)} t`} />
                      {verification ? (
                        <CardStat label="Accepted" value={`${verification.acceptedT.toFixed(1)} t`} tone={verification.status === "rejected" ? "alert" : "positive"} />
                      ) : (
                        <CardStat label="Received" value="—" />
                      )}
                    </div>
                    <Link
                      to={`/app/receiver/verification?booking=${encodeURIComponent(bookingId)}`}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[#12291a] px-3.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(18,41,26,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1c3d27] dark:bg-[#315b3c] dark:hover:bg-[#3c6d49]"
                    >
                      View delivery
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 transition-transform duration-300 group-hover/card:translate-x-1"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </motion.section>
        )}
      </div>
    </div>
  );
}
