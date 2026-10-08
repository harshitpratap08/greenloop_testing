import Button from "@/components/ui/button/Button";
import type { Booking } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const money = (minor: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(minor / 100);

export default function OrderPaymentPanel({ booking, workspace }: { booking: Booking; workspace?: string }) {
  const { t } = useTranslation();
  const { dataset, createPaymentAttemptAction, disputePaymentAction } = useGreenLoopStore();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const payment = dataset.payments?.find(item => item.bookingId === booking.id);
  const verification = dataset.verifications.find(item => item.bookingId === booking.id);
  const receiver = workspace === "receiver";
  const canStart = receiver && booking.status === "confirmed" && booking.receiverAcceptedAt && !booking.loadRef && (!payment || payment.paymentStatus === "failed");
  const canDispute = receiver && Boolean(booking.loadRef) && Boolean(payment && ["paid", "adjustment"].includes(payment.paymentStatus) && payment.payoutStatus !== "settled");
  const start = async () => { setBusy(true); try { await createPaymentAttemptAction(booking.id); } finally { setBusy(false); } };
  const dispute = async () => { setBusy(true); try { if (await disputePaymentAction(booking.id, reason)) setReason(""); } finally { setBusy(false); } };
  const label = !payment ? "required" : payment.paymentStatus === "failed" ? "failed" : payment.paymentStatus === "pending" ? "pending" : payment.paymentStatus === "disputed" ? "disputed" : payment.payoutStatus === "settled" ? "settled" : payment.payoutStatus === "pending" ? "payoutPending" : verification ? "verified" : booking.loadRef ? "dispatched" : "held";

  return <section className="mt-card rounded-surface border border-steel-200 p-5 dark:border-steel-700" aria-label={t("orderPayment.title")}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-steel-500 dark:text-steel-400">{t("orderPayment.title")}</p><h4 className="mt-1 font-archivo text-xl font-bold text-ink-900 dark:text-white">{t(`orderPayment.status.${label}`)}</h4></div>
      {payment && <p className="font-semibold text-ink-900 dark:text-white">{money(payment.amountMinor)}</p>}
    </div>
    {!payment && <p className="mt-3 text-sm text-steel-600 dark:text-steel-400">{t("orderPayment.waiting")}</p>}
    {payment && <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
      <div><dt className="text-steel-500 dark:text-steel-400">{t("orderPayment.reference")}</dt><dd className="break-all font-mono text-xs text-ink-800 dark:text-gray-200">{payment.providerReference}</dd></div>
      {payment.acceptedT !== undefined && <div><dt className="text-steel-500 dark:text-steel-400">{t("orderPayment.acceptedValue")}</dt><dd className="text-ink-800 dark:text-gray-200">{payment.acceptedT} t · {money(payment.acceptedValueMinor)}</dd></div>}
      {payment.acceptedT !== undefined && <div><dt className="text-steel-500 dark:text-steel-400">{t("orderPayment.commission")}</dt><dd className="text-ink-800 dark:text-gray-200">{money(payment.commissionMinor)} (5%)</dd></div>}
      {payment.providerFeeMinor > 0 && <div><dt className="text-steel-500 dark:text-steel-400">{t("orderPayment.providerFee")}</dt><dd className="text-ink-800 dark:text-gray-200">{money(payment.providerFeeMinor)}</dd></div>}
      {payment.refundAmountMinor > 0 && <div><dt className="text-steel-500 dark:text-steel-400">{t("orderPayment.refund")}</dt><dd className="text-ink-800 dark:text-gray-200">{money(payment.refundAmountMinor)} · {t(`orderPayment.refundStatus.${payment.refundStatus}`)}</dd></div>}
      {workspace === "provider" && <div><dt className="text-steel-500 dark:text-steel-400">{t("orderPayment.payout")}</dt><dd className="text-ink-800 dark:text-gray-200">{money(payment.payoutAmountMinor)} · {t(`orderPayment.payoutStatus.${payment.payoutStatus}`)}</dd></div>}
    </dl>}
    {payment?.paymentStatus === "pending" && receiver && <div className="mt-4 rounded-lg border border-steel-200 bg-steel-50 p-4 dark:border-steel-700 dark:bg-steel-900/40"><p className="text-sm font-semibold text-ink-900 dark:text-white">{t("orderPayment.sandbox")}</p><p className="mt-1 break-all font-mono text-xs text-steel-600 dark:text-steel-300">{payment.qrPayload}</p><p className="mt-2 text-xs text-steel-600 dark:text-steel-400">{t("orderPayment.sandboxNote")}</p></div>}
    {canStart && <div className="mt-4"><Button size="sm" disabled={busy} onClick={start}>{busy ? t("orderPayment.starting") : payment?.paymentStatus === "failed" ? t("orderPayment.retry") : t("orderPayment.pay")}</Button></div>}
    {payment?.paymentStatus === "failed" && <p role="status" className="mt-3 text-sm text-error-700 dark:text-error-300">{t("orderPayment.failedNote")}</p>}
    {canDispute && <div className="mt-4 space-y-2 border-t border-steel-200 pt-4 dark:border-steel-700"><label className="block text-sm font-medium text-ink-900 dark:text-white" htmlFor={`payment-dispute-${booking.id}`}>{t("orderPayment.disputeLabel")}</label><textarea id={`payment-dispute-${booking.id}`} value={reason} onChange={event => setReason(event.target.value)} maxLength={1000} className="min-h-20 w-full rounded-lg border border-steel-300 bg-white p-3 text-sm text-ink-900 dark:border-steel-700 dark:bg-steel-950 dark:text-white" /><Button size="sm" disabled={busy} onClick={dispute}>{t("orderPayment.dispute")}</Button></div>}
    {payment?.paymentStatus === "disputed" && <p className="mt-3 text-sm text-warning-700 dark:text-warning-300">{t("orderPayment.disputedNote")}</p>}
  </section>;
}
