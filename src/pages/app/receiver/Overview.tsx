/**
 * Overview — Receiver Home.
 *
 * "I NEED MATERIAL." The mirror of the provider home: what the yard needs,
 * what providers have offered, how much intake capacity remains, what trucks
 * are inbound, and what verification awaits. Same system, opposite priorities.
 */

import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { slotLedger } from "@/domain/capacity";
import { useAuth } from "@/context/AuthContext";
import { useGreeting } from "@/components/greenloop/AppExploration";
import { formatDate } from "@/utils";
import { motion } from "motion/react";
import {
  PageMotion,
  RevealItem,
  MediaPanel,
  VideoPanel,
  StatusChip,
  JourneyStrip,
  Counter,
  type KitStatus,
} from "@/components/greenloop/kit";
import { materialMediaFor, receiverMediaFor, ambientVideo, ambientMedia } from "@/config/appMedia";
import type { DemandRecord, MaterialOffer } from "@/domain/types";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

function demandChip(status: DemandRecord["status"]): KitStatus {
  if (status === "COVERED") return "verified";
  if (status === "PARTIALLY_COVERED") return "active";
  return "available";
}

function offerChip(status: MaterialOffer["status"]): KitStatus {
  if (status === "accepted") return "confirmed";
  if (status === "declined") return "cancelled";
  return "attention";
}

export default function Overview() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const greeting = useGreeting();
  const receiverId = user?.receiverId ?? "";
  const receiverData = dataset.receivers.find((r) => r.id === receiverId);

  // Capacity across every slot this receiver manages.
  const receiverSlots = dataset.slots.filter((s) => s.receiverId === receiverId).sort((a, b) => a.date.localeCompare(b.date));
  const totalCapacityT = receiverSlots.reduce((sum, s) => sum + s.capacityT, 0);
  const totalReservedT = receiverSlots.reduce((sum, s) => sum + (slotLedger(dataset, s.id)?.reserved ?? 0), 0);
  const totalHeldT = receiverSlots.reduce((sum, s) => sum + (slotLedger(dataset, s.id)?.heldT ?? 0), 0);
  const availableCapacityT = Math.max(0, totalCapacityT - totalReservedT);

  const receiverBookings = dataset.bookings.filter((b) => b.receiverId === receiverId);
  const activeBookings = receiverBookings.filter((b) => b.status === "confirmed");
  const inTransit = activeBookings.filter(
    (b) => b.loadRef && dataset.events.some((e) => e.kind === "load.dispatched" && e.subjectIds.includes(b.id)),
  );
  const deliveredIds = new Set(dataset.verifications.map((v) => v.bookingId));
  const awaitingCheck = inTransit.filter((b) => !deliveredIds.has(b.id));

  const demands = (dataset.demands ?? []).filter((d) => d.receiverId === receiverId);
  const openDemands = demands.filter((d) => d.status !== "PAUSED" && d.status !== "COVERED");
  const pendingOffers = (dataset.offers ?? []).filter((o) => o.status === "pending");
  const verifiedT = dataset.verifications.filter((v) => v.receiverId === receiverId && v.status === "verified").reduce((s, v) => s + v.acceptedT, 0);
  const receivedT = dataset.verifications.filter((v) => v.receiverId === receiverId).reduce((s, v) => s + v.actualT, 0);
  const acceptedT = dataset.verifications.filter((v) => v.receiverId === receiverId).reduce((s, v) => s + v.acceptedT, 0);
  const latestVerification = [...dataset.verifications].sort((a, b) => (b.verifiedAt ?? "").localeCompare(a.verifiedAt ?? ""))[0];

  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <PageMotion className="mx-auto max-w-[1200px] pb-24">
      <PageMeta title="Receiver Home | GreenLoop" description="Demands, provider offers, yard capacity, inbound loads and verification — the receiving side of the network." />

      {/* ============================================================ */}
      {/* HERO — the receiving yard in operation                        */}
      {/* ============================================================ */}
      <RevealItem>
        <header className="grid overflow-hidden border border-steel-200 bg-ink-950 shadow-sm dark:border-steel-800 lg:grid-cols-[1fr_1.45fr]">
          <div className="flex flex-col justify-center gap-6 p-6 sm:p-8">
            <div>
              <p className="eyebrow-label text-loop-400">Receiving operations · {receiverData?.name ?? "Facility"}</p>
              <h1 className="mt-3 font-archivo text-3xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl">
                Material wanted
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} — what the yard needs, what providers are offering, and what trucks are due at the gate.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
              <div>
                <dd className="ledger-numeral text-2xl font-bold text-white">
                  <Counter value={availableCapacityT} />
                  <span className="text-sm font-semibold text-white/60"> t</span>
                </dd>
                <dt className="eyebrow-label mt-1 text-white/50">Free intake</dt>
              </div>
              <div>
                <dd className="ledger-numeral text-2xl font-bold text-loop-300">
                  <Counter value={verifiedT} />
                  <span className="text-sm font-semibold text-white/60"> t</span>
                </dd>
                <dt className="eyebrow-label mt-1 text-white/50">Verified in</dt>
              </div>
              <div>
                <dd className="ledger-numeral text-2xl font-bold text-white">{pendingOffers.length}</dd>
                <dt className="eyebrow-label mt-1 text-white/50">Offers waiting</dt>
              </div>
              <dt className="sr-only">Facility</dt>
              <dd className="sr-only">{receiverData?.name}</dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Link to="/app/receiver/capacity" className="inline-flex min-h-11 items-center border border-white/40 px-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10">
                Manage capacity
              </Link>
              <Link to="/app/receiver/demand" className="inline-flex min-h-11 items-center border border-white/40 px-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10">
                Review offers
              </Link>
            </div>
            <p className="ledger-numeral text-xs text-white/50">
              {receiverData?.location ?? "Yard"} · intake {receiverSlots.length > 0 ? `${formatDate(receiverSlots[0].date)}` : "slots to plan"}
            </p>
          </div>
          <VideoPanel
            video={ambientVideo.receiving}
            aspect="min-h-[280px] lg:min-h-[420px] h-full"
            scrim="bg-gradient-to-t from-ink-950/60 via-ink-950/10 to-ink-950/30"
            caption={`${receiverData?.name ?? "Receiving yard"} · live intake`}
          />
        </header>
      </RevealItem>

      {/* ============================================================ */}
      {/* MATERIAL WE NEED — the yard's live demand                     */}
      {/* ============================================================ */}
      <RevealItem className="mt-6">
        <section aria-label="Material we need">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Published demand</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Material we need</h2>
            </div>
            <Link to="/app/receiver/demand" className="text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
              Manage demands
            </Link>
          </div>
          {openDemands.length > 0 ? (
            <ul className="grid gap-5 lg:grid-cols-2">
              {openDemands.slice(0, 4).map((demand) => (
                <li key={demand.id}>
                  <Link
                    to="/app/receiver/demand"
                    className="group grid border border-steel-200 bg-white shadow-sm transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white sm:grid-cols-[0.9fr_1.1fr]"
                  >
                    <MediaPanel
                      media={materialMediaFor(demand.materialType)}
                      aspect="h-full min-h-[160px]"
                      scrim="bg-gradient-to-t from-ink-950/60 via-transparent to-transparent"
                      className="border-0 border-b border-steel-200 sm:border-b-0 sm:border-e dark:border-steel-800"
                      caption={`${TYPE_LABEL[demand.materialType] ?? demand.materialType} wanted`}
                    />
                    <div className="flex flex-col justify-center p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-archivo text-xl font-bold uppercase tracking-tight text-ink-900 dark:text-white">
                          {TYPE_LABEL[demand.materialType] ?? demand.materialType}
                        </p>
                        <StatusChip status={demandChip(demand.status)} label={demand.status === "PARTIALLY_COVERED" ? "Part covered" : "Open"} />
                      </div>
                      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                        <span className="ledger-numeral text-2xl font-bold text-loop-700 dark:text-loop-400">{demand.requiredT.toFixed(1)} t</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">needed by {demand.period}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Receiving at {receiverData?.name}</p>
                      <span className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 group-hover:text-loop-600 dark:text-white">
                        View request
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border border-steel-200 bg-white p-6 text-sm text-gray-500 dark:border-steel-800 dark:bg-white/[0.02] dark:text-gray-400">
              No open demand — publish what the yard needs to attract provider offers.
            </p>
          )}
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* OFFERS FROM PROVIDERS                                         */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Offers from providers">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Incoming material</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Offers from providers</h2>
            </div>
            <Link to="/app/receiver/demand" className="text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
              Review offers
            </Link>
          </div>
          {pendingOffers.length > 0 ? (
            <ul className="grid gap-5 lg:grid-cols-2">
              {pendingOffers.slice(0, 4).map((offer) => {
                const passport = dataset.materials.find((m) => m.id === offer.passportId);
                const project = passport ? dataset.projects.find((p) => p.id === passport.projectId) : undefined;
                return (
                  <li key={offer.id}>
                    <div className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] sm:grid-cols-[0.9fr_1.1fr]">
                      <MediaPanel
                        media={materialMediaFor(passport?.type ?? "")}
                        aspect="h-full min-h-[160px]"
                        scrim="bg-gradient-to-t from-ink-950/60 via-transparent to-transparent"
                        className="border-0 border-b border-steel-200 sm:border-b-0 sm:border-e dark:border-steel-800"
                        caption={passport ? `${TYPE_LABEL[passport.type] ?? passport.type} offered` : "Material offered"}
                      />
                      <div className="flex flex-col justify-center p-5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="ledger-numeral text-2xl font-bold text-ink-900 dark:text-white">{offer.offeredQuantityT.toFixed(1)} t</p>
                          <StatusChip status={offerChip(offer.status)} label="Pending review" />
                        </div>
                        <p className="mt-1 font-archivo text-base font-bold uppercase text-ink-900 dark:text-white">
                          {TYPE_LABEL[passport?.type ?? ""] ?? passport?.type ?? "Material"}
                        </p>
                        <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                          {project?.name ?? "Provider project"} · {passport ? `${passport.condition} condition` : "passport on file"}
                        </p>
                        <div className="mt-4 flex items-center gap-3">
                          <Link
                            to="/app/receiver/demand"
                            className="inline-flex min-h-9 items-center bg-ink-900 px-4 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-loop-700 dark:bg-white dark:text-ink-900"
                          >
                            Review offer
                          </Link>
                          {passport && (
                            <Link to={`/app/materials/${passport.id}`} className="text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
                              View passport
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="border border-steel-200 bg-white p-6 text-sm text-gray-500 dark:border-steel-800 dark:bg-white/[0.02] dark:text-gray-400">
              No offers waiting — open demand is visible to providers across the network.
            </p>
          )}
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* CAPACITY — the yard ledger                                    */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Yard capacity">
          <div className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Intake ledger</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Receiving capacity</h2>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                <div>
                  <p className="ledger-numeral text-4xl font-bold text-ink-900 dark:text-white">
                    <Counter value={totalCapacityT} />
                    <span className="text-sm font-semibold text-steel-500"> t total</span>
                  </p>
                  <p className="eyebrow-label mt-1 text-steel-500 dark:text-steel-400">Across {receiverSlots.length} planned slots</p>
                </div>
                <div>
                  <p className="ledger-numeral text-4xl font-bold text-loop-600 dark:text-loop-400">
                    <Counter value={availableCapacityT} />
                    <span className="text-sm font-semibold text-steel-500"> t free</span>
                  </p>
                  <p className="eyebrow-label mt-1 text-steel-500 dark:text-steel-400">{totalHeldT > 0 ? `${totalHeldT.toFixed(1)} t held for review` : "Nothing on hold"}</p>
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {receiverSlots.slice(0, 3).map((slot) => {
                  const ledger = slotLedger(dataset, slot.id);
                  return (
                    <div key={slot.id}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink-900 dark:text-white">
                          {formatDate(slot.date)} · {TYPE_LABEL[slot.materialType] ?? slot.materialType}
                        </p>
                        <span className="ledger-numeral text-xs text-gray-500 dark:text-gray-400">
                          {ledger?.available.toFixed(1) ?? "0.0"} t free of {slot.capacityT.toFixed(1)} t
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-sm bg-steel-100 dark:bg-steel-900">
                        <motion.div
                          className="h-full bg-loop-600 dark:bg-loop-400"
                          initial={reduce ? false : { width: 0 }}
                          animate={{ width: `${Math.min(100, (((ledger?.reserved ?? 0) + (ledger?.heldT ?? 0)) / Math.max(slot.capacityT, 0.0001)) * 100)}%` }}
                          transition={{ duration: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to="/app/receiver/capacity" className="mt-6 inline-block text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
                Manage intake slots
              </Link>
            </div>
            <MediaPanel
              media={receiverMediaFor(receiverId)}
              aspect="min-h-[240px] lg:min-h-[320px] h-full"
              scrim="bg-gradient-to-t from-ink-950/55 via-transparent to-transparent"
              className="border-0 border-t border-steel-200 lg:border-s lg:border-t-0 dark:border-steel-800"
              caption={`${receiverData?.name ?? "The yard"} · stockpiles and intake bays`}
            />
          </div>
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* INBOUND — what trucks are arriving                            */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Inbound loads">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Due at the gate</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Inbound loads</h2>
            </div>
            <Link to="/app/receiver/deliveries" className="text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
              Delivery board
            </Link>
          </div>
          {activeBookings.length > 0 ? (
            <ul className="grid gap-5 lg:grid-cols-3">
              {activeBookings.slice(0, 3).map((booking) => {
                const dispatched = inTransit.some((b) => b.id === booking.id);
                const verified = deliveredIds.has(booking.id);
                const material = dataset.materials.find((m) => m.id === booking.materialId);
                const project = dataset.projects.find((p) => p.id === material?.projectId);
                const chip: KitStatus = verified ? "verified" : dispatched ? "active" : "confirmed";
                return (
                  <li key={booking.id}>
                    <Link
                      to={dispatched && !verified ? "/app/receiver/verification" : "/app/receiver/deliveries"}
                      className="group block border border-steel-200 bg-white p-5 transition-colors hover:border-ink-900 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-archivo text-base font-bold uppercase text-ink-900 dark:text-white">
                          <span className="ledger-numeral me-2 text-xs text-steel-400">{booking.id}</span>
                          {booking.tonnesT.toFixed(1)} t {TYPE_LABEL[material?.type ?? ""] ?? material?.type}
                        </p>
                        <StatusChip status={chip} label={verified ? "Received" : dispatched ? "In transit" : "Booked"} />
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                        From {project?.name ?? "provider project"} · {booking.slotId.includes("-") ? booking.slotId.split("-").slice(-2).join(" ") : booking.slotId}
                      </p>
                      <div className="mt-4">
                        <JourneyStrip current={verified ? 4 : dispatched ? 2 : 1} />
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-ink-900 underline underline-offset-4 group-hover:text-loop-600 dark:text-white">
                        {dispatched && !verified ? "Check delivery" : "Open delivery"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="border border-steel-200 bg-white p-6 text-sm text-gray-500 dark:border-steel-800 dark:bg-white/[0.02] dark:text-gray-400">
              Nothing inbound yet — accept a request or an offer to fill the yard.
            </p>
          )}
          {awaitingCheck.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-signal-300 bg-signal-50 p-4 dark:border-signal-500/40 dark:bg-signal-500/10">
              <p className="text-sm font-semibold text-signal-800 dark:text-signal-200">
                {awaitingCheck.length} load{awaitingCheck.length === 1 ? "" : "s"} arrived and awaiting weighbridge check.
              </p>
              <Link to="/app/receiver/verification" className="inline-flex min-h-10 items-center bg-ink-900 px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-loop-700 dark:bg-white dark:text-ink-900">
                Check &amp; accept
              </Link>
            </div>
          )}
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* VERIFICATION — the latest receiving record                    */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Verification">
          <div className="grid border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02] lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="eyebrow-label text-steel-500 dark:text-steel-400">Check &amp; accept</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Latest verification</h2>
              {latestVerification ? (
                <>
                  <dl className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
                    {[
                      { label: "Expected", value: latestVerification.plannedT },
                      { label: "Received", value: latestVerification.actualT },
                      { label: "Accepted", value: latestVerification.acceptedT },
                      { label: "Variance", value: latestVerification.actualT - latestVerification.acceptedT },
                    ].map((row) => (
                      <div key={row.label}>
                        <dd className="ledger-numeral text-2xl font-bold text-ink-900 dark:text-white">
                          <Counter value={row.value} />
                          <span className="text-sm font-semibold text-steel-500"> t</span>
                        </dd>
                        <dt className="eyebrow-label mt-1 text-steel-500 dark:text-steel-400">{row.label}</dt>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {latestVerification.loadRef} · {TYPE_LABEL[dataset.materials.find((m) => m.id === latestVerification.materialId)?.type ?? ""] ?? "material"} · {latestVerification.status === "verified" ? "verified recovery" : latestVerification.status}
                  </p>
                  <Link to="/app/receiver/verification" className="mt-5 inline-block text-sm font-semibold text-ink-900 underline underline-offset-4 hover:text-loop-600 dark:text-white">
                    Open check &amp; accept
                  </Link>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">No verification records yet — they appear as loads arrive at the weighbridge.</p>
              )}
            </div>
            <MediaPanel
              media={ambientMedia.inspectionWorker}
              aspect="min-h-[240px] lg:min-h-[320px] h-full"
              scrim="bg-gradient-to-t from-ink-950/55 via-transparent to-transparent"
              className="border-0 border-t border-steel-200 lg:border-s lg:border-t-0 dark:border-steel-800"
              caption="Every load inspected before acceptance"
            />
          </div>
        </section>
      </RevealItem>

      {/* ============================================================ */}
      {/* RECEIVING PERFORMANCE                                         */}
      {/* ============================================================ */}
      <RevealItem className="mt-12">
        <section aria-label="Receiving performance" className="bg-ink-950 p-6 sm:p-8 dark:bg-black/40">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow-label text-loop-400">Receiving performance</p>
              <h2 className="mt-1 font-archivo text-2xl font-bold tracking-tight text-white">What the yard has taken in</h2>
            </div>
            <Link to="/app/reports" className="text-sm font-semibold text-loop-300 underline underline-offset-4 hover:text-loop-200">
              Open reports
            </Link>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-white/15 pt-6 sm:grid-cols-4">
            {[
              { label: "Received", value: receivedT, reached: receivedT > 0 },
              { label: "Accepted", value: acceptedT, reached: acceptedT > 0 },
              { label: "Awaiting check", value: awaitingCheck.reduce((s, b) => s + b.tonnesT, 0), reached: awaitingCheck.length > 0 },
              { label: "Verified recovery", value: verifiedT, reached: verifiedT > 0 },
            ].map((stage) => (
              <div key={stage.label} className={`border-t-2 pt-3 ${stage.reached ? "border-loop-400" : "border-white/15"}`}>
                <dd className={`ledger-numeral text-2xl font-bold ${stage.reached ? "text-white" : "text-white/40"}`}>
                  <Counter value={stage.value} />
                  <span className="text-sm font-semibold text-white/60"> t</span>
                </dd>
                <dt className={`eyebrow-label mt-1 ${stage.reached ? "text-white/70" : "text-white/40"}`}>{stage.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-white/50">The provider sees the same tonnage — one shared ledger across the network.</p>
        </section>
      </RevealItem>
    </PageMotion>
  );
}
