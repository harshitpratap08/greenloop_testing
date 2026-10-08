import { cn, formatDate, formatINRPerT, materialTypeLabel } from "@/utils";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Link } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import OrderInvoiceAction from "@/components/greenloop/OrderInvoiceAction";
import OrderTracking from "@/components/greenloop/OrderTracking";
import OrderPaymentPanel from "@/components/greenloop/OrderPaymentPanel";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { useAuth } from "@/context/AuthContext.helpers";
import type { InvoiceParty } from "@/lib/orderInvoice";
import type { Booking, MaterialPassport } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

const EASE = [0.22, 1, 0.36, 1] as const;

type OrderTab = "ALL" | "ACTIVE" | "SCHEDULED" | "IN_TRANSIT" | "COMPLETED";

const TABS: { key: OrderTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "COMPLETED", label: "Completed" },
];

/* ------------------------------------------------------------------ */
/* Classification — same predicates as the previous tab filter          */
/* ------------------------------------------------------------------ */

type OrderBadgeStatus = Parameters<typeof StatusBadge>[0]["status"];

interface BookingFacts {
  booking: Booking;
  material?: MaterialPassport;
  verification: { status: string } | undefined;
  dispatched: boolean;
  tab: Exclude<OrderTab, "ALL">;
  badge: OrderBadgeStatus;
}

function classifyBooking(booking: Booking, isVerified: boolean, verificationStatus: string | undefined, dispatched: boolean): { tab: Exclude<OrderTab, "ALL">; badge: OrderBadgeStatus } {
  const isCompleted = isVerified || verificationStatus === "rejected" || booking.status === "cancelled";
  if (isCompleted) {
    return {
      tab: "COMPLETED",
      badge: isVerified ? "verified" : verificationStatus === "rejected" ? "rejected" : "cancelled",
    };
  }
  if (dispatched) return { tab: "IN_TRANSIT", badge: "dispatched" };
  if (booking.status === "hold") return { tab: "ACTIVE", badge: "hold" };
  if (booking.status === "confirmed" && !booking.slotId) return { tab: "ACTIVE", badge: "confirmed" };
  return { tab: "SCHEDULED", badge: "confirmed" };
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function HeroStatIcon({ kind }: { kind: "orders" | "active" | "completed" }) {
  const paths = {
    orders: <><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11Z" /><path d="M7.5 6h9V4.2A1.2 1.2 0 0 0 15.3 3H8.7a1.2 1.2 0 0 0-1.2 1.2V6Z" /><path d="M12 10.5v5M9.5 13h5" strokeLinecap="round" /></>,
    active: <><path d="M6 6h13l-1.4 7.6a1.6 1.6 0 0 1-1.6 1.4H8.7a1.6 1.6 0 0 1-1.6-1.3L5.5 4.6A1 1 0 0 0 4.5 3.8H3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.4" cy="18.6" r="1.5" /><circle cx="16.4" cy="18.6" r="1.5" /></>,
    completed: <><circle cx="12" cy="12" r="8.4" /><path d="m8.4 12.4 2.4 2.4 4.8-5.2" strokeLinecap="round" strokeLinejoin="round" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="size-5">
      {paths[kind]}
    </svg>
  );
}

function RowIcon({ kind }: { kind: "booking" | "provider" | "project" | "calendar" }) {
  const paths = {
    booking: <><rect x="5" y="4" width="14" height="17" rx="1.6" /><path d="M9 4V2.8A1.2 1.2 0 0 1 10.2 1.6h3.6A1.2 1.2 0 0 1 15 2.8V4M4 9h16M9 13h6M9 17h4" strokeLinecap="round" /></>,
    provider: <><circle cx="9.5" cy="8" r="3.2" /><path d="M3.5 19.5c.7-3.4 3-5.3 6-5.3s5.3 1.9 6 5.3M16 5.4a3.2 3.2 0 0 1 0 5.2M17.8 14.5c1.6.8 2.5 2.4 2.8 5" strokeLinecap="round" /></>,
    project: <><path d="M3 21h18M5 21V8l7-5 7 5v13" /><path d="M9.5 21v-5h5v5M9.5 12h.01M14.5 12h.01" strokeLinecap="round" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="15.5" rx="1.8" /><path d="M8 3.5v4M16 3.5v4M4 10.5h16" strokeLinecap="round" /></>,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 size-3.5 shrink-0 text-steel-400 dark:text-[#7a927f]">
      {paths[kind]}
    </svg>
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="flex min-w-0 items-start gap-1.5 text-xs text-steel-600 dark:text-[#a7b8ab]">
      {icon}
      <span className="min-w-0 truncate">{label}: <span className="font-medium text-ink-800 dark:text-[#c8d4ca]">{value}</span></span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/**
 * My Orders — accepted material transactions from booking to verified delivery.
 *
 * Visual hierarchy mirrors the Providers directory: cinematic hero, pill tabs
 * with live counts, compact horizontal order cards with material imagery and a
 * right-side details panel (tracking + invoice) that only opens when an order
 * is selected. All booking logic, tab filters, tracking and actions are
 * unchanged from the previous page.
 */
export default function BookingsDeliveries() {
  const { dataset }
  = useGreenLoopStore();
  const { user } = useAuth();
  const activeWorkspace = user?.activeWorkspace;
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<OrderTab>("ALL");
  const [search, setSearch] = useState("");
  /** materialId of the order shown in the right-side panel; one at a time. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Bumped whenever the panel is closed/moved so its next mount animates fresh. */
  const [panelEpoch, setPanelEpoch] = useState(0);

  const bookingsWithMeta = useMemo<BookingFacts[]>(() => dataset.bookings.map((booking) => {
    const material = dataset.materials.find(m => m.id === booking.materialId);
    const verification = dataset.verifications.find(v => v.bookingId === booking.id);
    const events = dataset.events.filter(e => e.subjectIds.includes(booking.id));
    const dispatched = Boolean(booking.loadRef || events.some(e => e.kind === "load.dispatched"));
    const classified = classifyBooking(booking, verification?.status === "verified", verification?.status as string | undefined, dispatched);
    return { booking, material, verification, dispatched, ...classified };
  }), [dataset.bookings, dataset.materials, dataset.verifications, dataset.events]);

  const counts = useMemo(() => {
    const map: Record<OrderTab, number> = { ALL: bookingsWithMeta.length, ACTIVE: 0, SCHEDULED: 0, IN_TRANSIT: 0, COMPLETED: 0 };
    for (const item of bookingsWithMeta) map[item.tab] += 1;
    return map;
  }, [bookingsWithMeta]);

  const visibleBookings = useMemo(() => (
    bookingsWithMeta
      .filter(({ booking, material }) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        const providerListing = dataset.providerListings?.find(l => l.materialId === booking.materialId);
        return `${material?.type ?? ""} ${booking.id} ${material?.id ?? ""} ${providerListing?.organization ?? ""} ${providerListing?.providerName ?? ""}`.toLowerCase().includes(query);
      })
      .filter(({ tab }) => activeTab === "ALL" || tab === activeTab)
      .sort((a, b) => b.booking.createdAt.localeCompare(a.booking.createdAt))
  ), [bookingsWithMeta, activeTab, search, dataset.providerListings]);

  const activeCount = counts.ACTIVE + counts.SCHEDULED + counts.IN_TRANSIT;
  const selectedFacts = selectedId ? visibleBookings.find(({ booking }) => booking.materialId === selectedId) : undefined;

  return (
    <div className="pb-16">
      <PageMeta title="My Orders | GreenLoop" description="Track accepted material transactions from booking through verified delivery." />

      {/* ---------------------------------------------------------- */}
      {/* Cinematic hero — My Orders                                  */}
      {/* ---------------------------------------------------------- */}
      <section className="relative isolate" aria-labelledby="my-orders-title">
        <div className="relative h-[300px] overflow-hidden sm:h-[330px] lg:h-[350px]">
          <img
            src={ambientMedia.authTruck.src}
            alt={ambientMedia.authTruck.alt}
            className={`absolute inset-0 size-full object-cover ${reduceMotion ? "" : "motion-safe:animate-gl-hero-zoom"}`}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-[#0a1c10]/82 via-[#0a1c10]/55 to-[#0a1c10]/10" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#f6f5f0] to-transparent dark:from-[#101913]" />

          <motion.div
            className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] flex-col justify-center px-5 pt-16 sm:px-9 sm:pt-20 lg:px-12 xl:px-16"
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8e5d9] backdrop-blur-sm sm:text-xs">{activeWorkspace === "receiver" ? "Receiver Workspace" : "Operations"}</p>
            <h1 id="my-orders-title" className="mt-4 font-archivo text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-[3.5rem]">
              My <span className="text-[#6ee584]">Orders</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">Track accepted material transactions from booking through verified delivery.</p>

            <dl className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
              {([
                { kind: "orders", value: counts.ALL.toLocaleString("en-IN"), label: "Total orders" },
                { kind: "active", value: activeCount.toLocaleString("en-IN"), label: "Active" },
                { kind: "completed", value: counts.COMPLETED.toLocaleString("en-IN"), label: "Completed" },
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
      {/* Tabs + search + order cards + sliding details panel         */}
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
            <span className="sr-only">Search orders</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-steel-400"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders…"
              className="h-10 w-full rounded-full border border-[#e3e3d9] bg-white/85 ps-9 pe-3 text-sm text-ink-900 outline-none transition focus:border-loop-500 focus:ring-2 focus:ring-loop-500/15 dark:border-steel-700 dark:bg-[#17251d] dark:text-white"
            />
          </label>
        </div>

        <div className={cn("flex items-start gap-6", selectedFacts ? "flex-col xl:flex-row" : "flex-col")}>
          {/* ------------------------------------------------------ */}
          {/* Order cards column                                     */}
          {/* ------------------------------------------------------ */}
          <div className={cn("min-w-0 flex-1", selectedFacts && "xl:max-w-[calc(100%-444px)]")}>
            {visibleBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-steel-300 bg-white/60 px-6 py-12 text-center dark:border-steel-700 dark:bg-white/[0.02]">
                <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">
                  {bookingsWithMeta.length ? "No orders match this view" : "No orders yet"}
                </h2>
                <p className="mt-2 text-sm text-steel-600 dark:text-gray-400">
                  {bookingsWithMeta.length ? "Try a different tab or clear the search." : "Accepted material transactions will appear here once a booking is confirmed."}
                </p>
              </div>
            ) : (
              <motion.section
                aria-label="My orders"
                className="flex flex-col gap-4"
                initial={reduceMotion ? false : "hidden"}
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
              >
                {visibleBookings.map((facts) => (
                  <OrderCard
                    key={facts.booking.id}
                    facts={facts}
                    activeWorkspace={activeWorkspace}
                    expanded={selectedFacts?.booking.id === facts.booking.id}
                    onToggle={() => {
                      const isOpen = selectedId === facts.booking.materialId;
                      setSelectedId(isOpen ? null : facts.booking.materialId);
                      setPanelEpoch(epoch => epoch + 1);
                    }}
                    reduceMotion={reduceMotion}
                  />
                ))}
              </motion.section>
            )}
          </div>

          {/* ------------------------------------------------------ */}
          {/* Right-side details panel — tracking + invoice          */}
          {/* ------------------------------------------------------ */}
          <AnimatePresence initial={false}>
            {selectedFacts && (
              <motion.aside
                key={`${selectedFacts.booking.id}:${panelEpoch}`}
                initial={reduceMotion ? false : { opacity: 0, x: 44 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: 44 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="relative w-full shrink-0 self-start xl:w-[420px]"
                aria-label="Order tracking and details"
              >
                <div className="xl:sticky xl:top-20">
                  <OrderDetailsPanel facts={selectedFacts} activeWorkspace={activeWorkspace} onClose={() => { setSelectedId(null); setPanelEpoch(epoch => epoch + 1); }} />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Details panel — OrderTracking + OrderInvoiceAction, exactly as before*/
/* ------------------------------------------------------------------ */

function OrderDetailsPanel({ facts, activeWorkspace, onClose }: { facts: BookingFacts; activeWorkspace?: string; onClose: () => void }) {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const { booking, material } = facts;
  const receiver = dataset.receivers.find(r => r.id === booking.receiverId);
  const project = dataset.projects.find(p => p.id === material?.projectId);
  const media = materialMediaFor(material?.type ?? "unknown");

  // Order summary data for the existing PDF action.
  const offer = dataset.offers?.find((item) => item.demandId === booking.demandId && item.passportId === booking.materialId);
  const unitPrice = booking.agreedPricePerT ?? offer?.agreedPricePerT ?? offer?.pricePerT ?? material?.pricePerT;
  const transactionContact = dataset.transactionContacts?.find(
    (contact) => contact.materialId === booking.materialId && contact.receiverId === booking.receiverId,
  );
  const providerListing = dataset.providerListings?.find((listing) => listing.materialId === booking.materialId);
  const receiverWorkspace = activeWorkspace === "receiver";
  const currentParty: InvoiceParty = {
    name: user?.name,
    organization: user?.organization,
    email: user?.email,
    phone: user?.phone,
    address: user?.location,
    taxId: user?.vat,
  };
  const provider: InvoiceParty = receiverWorkspace
    ? {
        name: transactionContact?.name ?? providerListing?.providerName,
        organization: transactionContact?.organization ?? providerListing?.organization,
        email: transactionContact?.email,
        phone: transactionContact?.phone,
        address: providerListing?.location ?? project?.location,
      }
    : currentParty;
  const invoiceReceiver: InvoiceParty = receiverWorkspace
    ? currentParty
    : {
        name: transactionContact?.name ?? receiver?.name,
        organization: transactionContact?.organization,
        email: transactionContact?.email,
        phone: transactionContact?.phone,
        address: receiver?.location,
      };
  const invoice = {
    bookingId: booking.id,
    invoiceDate: new Date(),
    orderDate: formatDate(booking.createdAt),
    loadReference: booking.loadRef,
    provider,
    receiver: invoiceReceiver,
    projectName: project?.name,
    projectLocation: project?.location,
    materialId: booking.materialId,
    materialType: materialTypeLabel(material?.type ?? "unknown"),
    quantityT: booking.tonnesT,
    unitPricePerT: unitPrice,
    payment: dataset.payments?.find(item => item.bookingId === booking.id),
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e7e4db] bg-white shadow-[0_10px_30px_rgba(26,42,31,0.1)] dark:border-steel-800 dark:bg-[#17251d]">
      {/* Slim media header with close button */}
      <div className="relative h-28">
        <img src={media.src} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover motion-safe:animate-gl-hero-zoom" loading="lazy" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a1c10]/55 via-transparent to-[#0a1c10]/10" />
        <button
          type="button"
          aria-label="Close order details"
          onClick={onClose}
          className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/40 bg-[#0d1f12]/55 text-xl leading-none text-white backdrop-blur-sm transition hover:bg-[#0d1f12]/85"
        >
          ×
        </button>
      </div>
      <div className="grid gap-4 p-4 [&>*]:col-span-full">
        <OrderTracking booking={booking} workspace={activeWorkspace} />
        <OrderPaymentPanel booking={booking} workspace={activeWorkspace} />
        <OrderInvoiceAction invoice={invoice} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Compact horizontal order card                                       */
/* ------------------------------------------------------------------ */

function OrderCard({
  facts,
  activeWorkspace,
  expanded,
  onToggle,
  reduceMotion,
}: {
  facts: BookingFacts;
  activeWorkspace?: string;
  expanded: boolean;
  onToggle: () => void;
  reduceMotion: boolean | null;
}) {
  const { t } = useTranslation();
  const { dataset, cancelBookingAction } = useGreenLoopStore();
  const { booking, material, verification, badge } = facts;
  const [cancelling, setCancelling] = useState(false);
  const runCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    try { await cancelBookingAction({ bookingId: booking.id }); } finally { setCancelling(false); }
  };
  const slot = dataset.slots.find(s => s.id === booking.slotId);
  const receiver = dataset.receivers.find(r => r.id === booking.receiverId);
  const providerListing = dataset.providerListings?.find((listing) => listing.materialId === booking.materialId);
  const media = materialMediaFor(material?.type ?? "unknown");
  const receiverWorkspace = activeWorkspace === "receiver";
  const offer = dataset.offers?.find((item) => item.demandId === booking.demandId && item.passportId === booking.materialId);
  const unitPrice = booking.agreedPricePerT ?? offer?.agreedPricePerT ?? offer?.pricePerT ?? material?.pricePerT;
  const project = dataset.projects.find(p => p.id === material?.projectId);
  const isFinalized = verification?.status === "verified" || verification?.status === "rejected";
  const otherParty = receiverWorkspace
    ? providerListing?.organization ?? "Provider"
    : receiver?.name ?? "Receiver";

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: EASE }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className={cn(
        "group/card flex min-w-0 items-stretch overflow-hidden rounded-2xl border bg-white p-3 shadow-[0_2px_10px_rgba(26,42,31,0.05)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(26,42,31,0.12)] dark:bg-[#17251d] sm:p-3.5",
        expanded ? "border-[#315b3c] ring-1 ring-[#315b3c]/25 dark:border-[#527e5c]" : "border-[#e7e4db] hover:border-[#b9c8ba] dark:border-steel-800 dark:hover:border-[#3c6d49]",
      )}
    >
      {/* Material image */}
      <div className="relative aspect-[4/3] w-24 shrink-0 self-stretch overflow-hidden rounded-xl sm:aspect-auto sm:w-32">
        <img
          src={media.src}
          alt={media.alt}
          loading="lazy"
          className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-[900ms] group-hover/card:scale-[1.06]"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a1c10]/30 via-transparent to-transparent" />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 ps-3.5 sm:ps-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className="inline-flex items-baseline gap-2 font-archivo text-base font-bold text-ink-900 dark:text-white sm:text-lg">
            {materialTypeLabel(material?.type ?? "unknown")}
            <span className="ledger-numeral text-sm font-bold text-steel-600 dark:text-[#a7b8ab] sm:text-base">{booking.tonnesT} t</span>
          </h3>
          <StatusBadge status={badge} />
        </div>
        <div className="grid content-start gap-1 sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-3">
          <DetailRow icon={<RowIcon kind="booking" />} label="Booking" value={booking.materialId} />
          <DetailRow icon={<RowIcon kind="provider" />} label="Provider" value={otherParty} />
          <DetailRow icon={<RowIcon kind="project" />} label="Project" value={project?.name ?? receiver?.location ?? "—"} />
        </div>
      </div>

      {/* Price, schedule and actions */}
      <div className="flex w-36 shrink-0 flex-col items-end justify-between gap-2 ps-2 sm:w-44 sm:ps-3">
        <div className="text-end">
          <p className="ledger-numeral font-archivo text-sm font-bold text-ink-900 dark:text-white sm:text-base">{unitPrice ? formatINRPerT(unitPrice) : "N/A"}</p>
          <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-steel-500 dark:text-[#a7b8ab]">
            <RowIcon kind="calendar" />
            {slot ? <>Scheduled {formatDate(slot.date)}</> : <>Awaiting schedule</>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={onToggle}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-[#12291a] px-3.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(18,41,26,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1c3d27] dark:bg-[#315b3c] dark:hover:bg-[#3c6d49]"
          >
            {t("orderTracking.track")}
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("size-4 transition-transform duration-300", expanded && "rotate-180")}><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {isFinalized && verification && (
            <Link
              to={receiverWorkspace ? `/app/receiver/verification?booking=${encodeURIComponent(booking.id)}` : "/app/verification"}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d7d2c7] bg-white px-3.5 text-sm font-semibold text-[#26342b] transition hover:bg-[#f1f5ef] dark:border-steel-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-[#2c4233]/50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><rect x="6" y="3.5" width="12" height="17" rx="1.6" /><path d="m9 12 2 2 4-4.5" /></svg>
              View Proof
            </Link>
          )}
          {!isFinalized && booking.status === "confirmed" && facts.dispatched && receiverWorkspace && (
            <Link
              to={`/app/receiver/verification?booking=${encodeURIComponent(booking.id)}`}
              className="inline-flex min-h-9 items-center justify-center rounded-xl bg-loop-600 px-3.5 text-sm font-semibold text-white transition hover:bg-loop-700"
            >
              Verify Delivery
            </Link>
          )}
          {booking.status === "hold" && receiverWorkspace && (
            <button
              type="button"
              disabled={cancelling}
              onClick={runCancel}
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#d7d2c7] px-3.5 text-sm font-semibold text-steel-700 transition hover:bg-steel-50 disabled:opacity-60 dark:border-steel-700 dark:text-gray-300 dark:hover:bg-steel-800/40"
            >
              {cancelling ? "Cancelling…" : "Cancel Request"}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
