import PageMeta from "@/components/common/PageMeta";
import { useAuth } from "@/context/AuthContext.helpers";
import { slotMatchesDemandPeriod } from "@shared/domain/capacity";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate, formatINR, formatINRPerT, materialTypeLabel } from "@/utils";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";

export default function NegotiationPage() {
  const { t } = useTranslation();
  const { offerId = "" } = useParams();
  const { user } = useAuth();
  const { dataset, sendNegotiationMessageAction, proposeFinalTermsAction, approveFinalTermsAction } = useGreenLoopStore();
  const offer = dataset.offers?.find(item => item.id === offerId);
  const demand = dataset.demands.find(item => item.id === offer?.demandId);
  const material = dataset.materials.find(item => item.id === offer?.passportId);
  const conversation = dataset.negotiations?.find(item => item.offerId === offerId);
  const proposal = conversation?.proposals.at(-1);
  const slot = dataset.slots.find(item => item.id === proposal?.slotId);
  const isProvider = user?.activeWorkspace === "provider";
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const compatibleSlots = useMemo(() => dataset.slots.filter(item => item.receiverId === demand?.receiverId && item.materialType === material?.type && item.date >= new Date().toISOString().slice(0, 10) && demand && slotMatchesDemandPeriod(item, demand.period)).sort((a, b) => a.date.localeCompare(b.date)), [dataset.slots, demand, material]);

  if (!offer || !demand || !material || !conversation) return <main className="mx-auto max-w-3xl p-8"><PageMeta title={`${t("negotiation.title")} | GreenLoop`} description={t("negotiation.subtitle")} /><h1 className="font-archivo text-2xl font-bold">{t("negotiation.unavailable")}</h1><Link className="mt-4 inline-block underline" to="/app/market-demand">{t("negotiation.back")}</Link></main>;

  const canPropose = offer.status === "pending" && (isProvider || user?.activeWorkspace === "receiver");
  const approvedByMe = isProvider ? Boolean(proposal?.providerApprovedAt) : Boolean(proposal?.receiverApprovedAt);
  const awaitingMe = proposal?.status === (isProvider ? "awaiting_provider_approval" : "awaiting_receiver_approval");
  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    const ok = await sendNegotiationMessageAction(offerId, message.trim());
    if (ok) setMessage("");
  };
  const submitProposal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantityT = Number(form.get("quantityT"));
    const pricePerT = Number(form.get("pricePerT"));
    const slotId = String(form.get("slotId") ?? "");
    if (!(quantityT > 0) || !(pricePerT > 0) || !slotId || !demand.location) return;
    const ok = await proposeFinalTermsAction(offerId, { quantityT, pricePerT, destination: demand.location, slotId });
    if (ok) setNotice(t("negotiation.proposalSent"));
  };
  const approve = async () => {
    if (!proposal) return;
    const result = await approveFinalTermsAction(offerId, proposal.id);
    if (result?.capacityIssue) setNotice(result.capacityIssue);
    else if (result?.status === "confirmed") setNotice(t("negotiation.confirmed"));
    else if (result) setNotice(t("negotiation.approvalSaved"));
  };
  const statusLabel = t(`negotiation.status.${conversation.status}`);
  const initialSlotId = proposal?.slotId ?? compatibleSlots[0]?.id ?? "";

  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <PageMeta title={`${t("negotiation.title")} | GreenLoop`} description={t("negotiation.subtitle")} />
    <Link to={isProvider ? "/app/market-demand" : "/app/receiver/demand"} className="text-sm text-steel-600 hover:underline dark:text-gray-300">← {t("negotiation.back")}</Link>
    <header className="mt-5 flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow-label text-steel-500">{t("negotiation.offerSummary")}</p><h1 className="mt-1 font-archivo text-3xl font-bold text-ink-900 dark:text-white">{materialTypeLabel(material.type)} · {offer.offeredQuantityT.toFixed(1)} t</h1><p className="mt-1 text-sm text-steel-600 dark:text-gray-300">{t("negotiation.receiver")}: {demand.location} · {t("negotiation.neededBy")}: {formatDate(demand.period)}</p></div><span className="rounded-full border border-steel-300 px-3 py-1 text-sm font-semibold dark:border-steel-700">{statusLabel}</span></header>
    {offer.auctionId && <p className="mt-4 rounded-lg border border-loop-300 bg-loop-50 px-4 py-3 text-sm text-loop-900 dark:border-loop-800 dark:bg-loop-950 dark:text-loop-100">{t("auctions.negotiationContext", { price: offer.pricePerT ? formatINRPerT(offer.pricePerT) : t("auctions.pricePending") })} <Link to={isProvider ? "/app/auctions" : "/app/receiver/providers"} className="ms-1 font-semibold underline">{t("auctions.viewAuction")}</Link></p>}

    <p className="mt-5 border-s-4 border-loop-600 bg-loop-50 px-4 py-3 text-sm text-loop-900 dark:bg-loop-900/20 dark:text-loop-100">{t("negotiation.chatNotice")}</p>
    {notice && <p role="status" className="mt-3 rounded-md bg-steel-100 px-4 py-3 text-sm dark:bg-white/10">{notice}</p>}

    <section className="mt-6 rounded-lg border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-gray-dark" aria-labelledby="chat-title">
      <h2 id="chat-title" className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{t("negotiation.chat")}</h2>
      <div className="mt-4 flex max-h-80 min-h-32 flex-col gap-3 overflow-y-auto rounded-md bg-gray-50 p-4 dark:bg-gray-900">
        {conversation.messages.length === 0 ? <p className="m-auto text-sm text-steel-500">{t("negotiation.noMessages")}</p> : conversation.messages.map(item => <article key={item.id} className={`max-w-[85%] rounded-lg border border-steel-200 bg-white px-3 py-2 dark:border-steel-700 dark:bg-gray-dark ${item.senderRole === (isProvider ? "provider" : "receiver") ? "self-end" : "self-start"}`}><p className="text-xs font-semibold text-steel-600 dark:text-gray-300">{item.senderName} · {formatDate(item.createdAt)}</p><p className="mt-1 whitespace-pre-wrap text-sm text-ink-900 dark:text-white">{item.body}</p></article>)}
      </div>
      {offer.status === "pending" && <form onSubmit={submitMessage} className="mt-3 flex gap-2"><label className="sr-only" htmlFor="negotiation-message">{t("negotiation.messagePlaceholder")}</label><input id="negotiation-message" value={message} onChange={event => setMessage(event.target.value)} maxLength={4000} placeholder={t("negotiation.messagePlaceholder")} className="min-w-0 flex-1 rounded-md border border-steel-300 bg-white px-3 py-2 text-sm dark:border-steel-700 dark:bg-gray-900"/><button className="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-ink-900">{t("negotiation.send")}</button></form>}
    </section>

    <section className="mt-6 rounded-lg border border-steel-200 bg-white p-5 dark:border-steel-800 dark:bg-gray-dark" aria-labelledby="terms-title">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 id="terms-title" className="font-archivo text-xl font-bold text-ink-900 dark:text-white">{t("negotiation.finalTerms")}</h2><p className="mt-1 text-sm text-steel-600 dark:text-gray-300">{proposal ? `${t("negotiation.version")} ${proposal.version} · ${t(`negotiation.status.${proposal.status}`)}` : t("negotiation.noTerms")}</p></div>{proposal && <span className="text-xs text-steel-500">{t("negotiation.proposedBy", { role: t(`negotiation.roles.${proposal.proposedBy}`) })}</span>}</div>
      {proposal && <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[
        [t("negotiation.quantity"), `${proposal.quantityT.toFixed(2)} t`], [t("negotiation.price"), formatINRPerT(proposal.pricePerT)], [t("negotiation.total"), formatINR(proposal.quantityT * proposal.pricePerT)], [t("negotiation.destination"), proposal.destination], [t("negotiation.receivingSlot"), slot ? formatDate(slot.date) : proposal.slotId],
      ].map(([label, value]) => <div key={label} className="rounded-md bg-gray-50 p-3 dark:bg-gray-900"><dt className="text-xs text-steel-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-ink-900 dark:text-white">{value}</dd></div>)}</dl>}
      {proposal && <div className="mt-4 flex flex-wrap gap-3 text-sm">{(["provider", "receiver"] as const).map(role => <span key={role} className={`rounded-full px-3 py-1 ${proposal[`${role}ApprovedAt`] ? "bg-loop-100 text-loop-800 dark:bg-loop-900/40 dark:text-loop-200" : "bg-steel-100 text-steel-700 dark:bg-steel-800 dark:text-gray-200"}`}>{t(`negotiation.roles.${role}`)}: {proposal[`${role}ApprovedAt`] ? t("negotiation.approved") : t("negotiation.awaiting")}</span>)}</div>}
      {proposal && awaitingMe && !approvedByMe && <button type="button" onClick={approve} className="mt-4 rounded-md bg-loop-800 px-5 py-3 text-sm font-bold text-white hover:bg-loop-700">{t("negotiation.approve")}</button>}
      {canPropose && <details className="mt-5 border-t border-steel-200 pt-4 dark:border-steel-700"><summary className="cursor-pointer text-sm font-semibold text-loop-800 dark:text-loop-300">{t("negotiation.proposeChange")}</summary><form key={proposal?.id ?? offer.id} onSubmit={submitProposal} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">{t("negotiation.quantity")}<input name="quantityT" type="number" min="0.01" max={Math.min(material.quantityT, demand.requiredT)} step="0.01" required defaultValue={proposal?.quantityT ?? offer.offeredQuantityT} className="mt-1 w-full rounded-md border border-steel-300 bg-white px-3 py-2 dark:border-steel-700 dark:bg-gray-900" /></label>
        <label className="text-sm">{t("negotiation.price")}<input name="pricePerT" type="number" min="0.01" step="0.01" required defaultValue={proposal?.pricePerT ?? offer.counters?.at(-1)?.pricePerT ?? offer.pricePerT ?? ""} className="mt-1 w-full rounded-md border border-steel-300 bg-white px-3 py-2 dark:border-steel-700 dark:bg-gray-900" /></label>
        <label className="text-sm">{t("negotiation.destination")}<input readOnly value={demand.location} className="mt-1 w-full rounded-md border border-steel-300 bg-gray-100 px-3 py-2 dark:border-steel-700 dark:bg-gray-800" /></label>
        <label className="text-sm">{t("negotiation.receivingSlot")}<select name="slotId" required defaultValue={initialSlotId} className="mt-1 w-full rounded-md border border-steel-300 bg-white px-3 py-2 dark:border-steel-700 dark:bg-gray-900"><option value="">{t("negotiation.chooseSlot")}</option>{compatibleSlots.map(item => <option key={item.id} value={item.id}>{formatDate(item.date)} · {item.capacityT} t</option>)}</select></label>
        <button className="rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-ink-900 sm:col-span-2">{t("negotiation.submitTerms")}</button>
      </form></details>}
      <details className="mt-5 border-t border-steel-200 pt-4 dark:border-steel-700"><summary className="cursor-pointer text-sm font-semibold">{t("negotiation.history")}</summary><ol className="mt-3 space-y-3">{[...conversation.proposals].reverse().map(item => <li key={item.id} className="border-s-2 border-steel-300 ps-3 text-sm dark:border-steel-700"><p className="font-semibold">{t("negotiation.version")} {item.version} · {t(`negotiation.status.${item.status}`)}</p><p className="text-steel-600 dark:text-gray-300">{item.quantityT.toFixed(2)} t · {formatINRPerT(item.pricePerT)} · {item.destination} · {dataset.slots.find(day => day.id === item.slotId)?.date ?? item.slotId}</p><p className="text-xs text-steel-500">{formatDate(item.createdAt)}</p></li>)}</ol></details>
    </section>
  </main>;
}
