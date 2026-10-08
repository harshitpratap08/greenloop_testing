import Button from "@/components/ui/button/Button";
import type { Booking } from "@shared/domain/types";
import { CheckCircleIcon, TruckDelivery } from "@/icons";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatStamp } from "@/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function OrderTracking({ booking, workspace }: { booking: Booking; workspace?: string }) {
  const { t } = useTranslation();
  const { dataset, updateDeliveryAction, dispatchAction } = useGreenLoopStore();
  const payment = dataset.payments?.find(item => item.bookingId === booking.id);
  const [saving, setSaving] = useState(false);
  const events = dataset.events.filter(event => event.subjectIds.includes(booking.id)).sort((a, b) => a.at.localeCompare(b.at));
  const eventFor = (kind: string) => events.find(event => event.kind === kind);
  const booked = eventFor("request.accepted") ?? eventFor("offer.accepted");
  const ready = eventFor("delivery.ready");
  const picked = eventFor("delivery.picked-up");
  const dispatched = eventFor("load.dispatched");
  const arrived = eventFor("delivery.arrived");
  const received = eventFor("delivery.received");
  const verification = dataset.verifications.find(record => record.bookingId === booking.id);
  const inTransit = Boolean(dispatched || booking.loadRef);
  const delivered = Boolean(verification || received);
  const cancelled = booking.status === "cancelled";
  const steps = [
    { key: "booked", complete: Boolean(booking.receiverAcceptedAt), at: booking.receiverAcceptedAt, actor: booked?.actor.name },
    { key: "pendingPickup", complete: Boolean(ready), at: ready?.at, actor: ready?.actor.name },
    { key: "picked", complete: Boolean(picked), at: picked?.at, actor: picked?.actor.name },
    { key: "inTransit", complete: inTransit, at: dispatched?.at, actor: dispatched?.actor.name },
    { key: "destination", complete: Boolean(arrived || delivered), at: arrived?.at ?? received?.at, actor: arrived?.actor.name ?? received?.actor.name },
    { key: "delivered", complete: delivered, at: received?.at, actor: received?.actor.name },
  ];
  const current = steps.reduce((last, step, index) => step.complete ? index : last, -1);
  const status = cancelled ? "cancelled" : current < 0 ? "awaitingAcceptance" : steps[current].key;
  const nextStage = inTransit ? "arrived" : picked ? null : ready ? "picked-up" : "ready";
  const canUpdate = workspace === "provider" && booking.status === "confirmed" && Boolean(booking.receiverAcceptedAt) && !delivered && !arrived;
  const run = async (action: () => Promise<boolean>) => {
    if (saving) return;
    setSaving(true);
    try { await action(); } finally { setSaving(false); }
  };

  return <section className="mt-card overflow-hidden rounded-surface border border-steel-200 dark:border-steel-700" aria-label={t("orderTracking.title")}>
    <div className="bg-ink-900 px-5 py-4 text-white dark:bg-loop-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{t("orderTracking.title")}</p>
      <h4 className="mt-1 font-archivo text-2xl font-bold">{t(`orderTracking.${status}`)}</h4>
      {booking.loadRef && <p className="mt-1 text-xs text-white/80">{t("orderTracking.loadRef")}: {booking.loadRef}</p>}
    </div>
    <div className="space-y-card gl-card-pad">
      <div className="overflow-x-auto pt-1 pb-3">
      <ol className="grid min-w-4xl grid-cols-6">
        {steps.map((step, index) => <li key={step.key} aria-current={index === current && !cancelled ? "step" : undefined} className="relative flex min-w-0 flex-col items-center gap-3 text-center">
          {index < steps.length - 1 && <span aria-hidden="true" className={cn("absolute start-1/2 top-4 h-0.5 w-full", step.complete && steps[index + 1].complete ? "bg-orange-500" : "bg-steel-200 dark:bg-steel-700")} />}
          <span className={cn("relative z-1 flex size-8 shrink-0 items-center justify-center rounded-full", step.complete ? "bg-orange-500 text-white" : "bg-steel-100 text-steel-500 dark:bg-steel-800 dark:text-steel-400", index === current && !cancelled && "ring-2 ring-orange-300 ring-offset-2 dark:ring-offset-steel-900")}>
            {step.complete ? index === 5 ? <TruckDelivery className="size-4" /> : <CheckCircleIcon className="size-5" /> : <span className="text-xs">{index + 1}</span>}
          </span>
          <div className="w-full min-w-0 px-2">
            <p className={cn("text-sm font-semibold", step.complete ? "text-ink-900 dark:text-white" : "text-steel-500 dark:text-steel-400")}>{t(`orderTracking.${step.key}`)}</p>
            {step.at ? <>
              <time dateTime={step.at} className="mt-1 block text-xs text-steel-500 dark:text-steel-400">{formatStamp(step.at)}</time>
              {step.actor && <p title={step.actor} className="mt-1 truncate text-xs text-steel-500 dark:text-steel-400">{step.actor}</p>}
            </> : <p className="mt-1 text-xs text-steel-500 dark:text-steel-400">{t(step.complete || index < current ? "orderTracking.notRecorded" : "orderTracking.waiting")}</p>}
          </div>
        </li>)}
      </ol>
      </div>
      <div className="space-y-4 border-t border-steel-200 pt-5 dark:border-steel-700">
        <p className="text-sm text-steel-600 dark:text-steel-400">{t("orderTracking.explanation")}</p>
        {canUpdate && <div className="space-y-3">
          {nextStage && <Button size="sm" disabled={saving} onClick={() => run(() => updateDeliveryAction(booking.id, nextStage))}>{t(`orderTracking.action.${nextStage}`)}</Button>}
          {!inTransit && picked && <div className="space-y-2"><Button size="sm" disabled={saving || !payment || payment.paymentStatus !== "paid" || payment.payoutStatus !== "held"} onClick={() => run(() => dispatchAction({ bookingId: booking.id }))}>{t("orderTracking.action.dispatch")}</Button>{(!payment || payment.paymentStatus !== "paid") && <p className="text-xs text-warning-700 dark:text-warning-300">{t("orderTracking.dispatchPaymentRequired")}</p>}</div>}
        </div>}
        {workspace === "receiver" && inTransit && !delivered && !cancelled && <Link to={`/app/receiver/verification?booking=${encodeURIComponent(booking.id)}`} className="inline-flex rounded-lg bg-loop-600 px-4 py-3 text-sm font-semibold text-white hover:bg-loop-700 dark:bg-loop-700">{t("orderTracking.recordArrival")}</Link>}
        {delivered && <p className="rounded-lg bg-loop-50 p-3 text-sm text-loop-800 dark:bg-loop-900 dark:text-loop-200">{t(verification?.status === "pending" ? "orderTracking.verificationPending" : verification?.status === "rejected" ? "orderTracking.verificationRejected" : verification?.status === "verified" ? "orderTracking.verificationComplete" : "orderTracking.verificationPending")}</p>}
        <details className="text-sm text-steel-600 dark:text-steel-400">
          <summary className="cursor-pointer font-semibold">{t("orderTracking.history")}</summary>
          <ul className="mt-3 space-y-3">{events.map(event => <li key={event.id}><p>{event.summary}</p><time dateTime={event.at} className="text-xs">{formatStamp(event.at)} · {event.actor.name}</time></li>)}</ul>
        </details>
      </div>
    </div>
  </section>;
}
