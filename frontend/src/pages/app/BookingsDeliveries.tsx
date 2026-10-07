import PageMeta from "@/components/common/PageMeta";
import OrderInvoiceAction from "@/components/greenloop/OrderInvoiceAction";
import OrderTracking from "@/components/greenloop/OrderTracking";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import { useAuth, type User } from "@/context/AuthContext.helpers";
import type { InvoiceParty } from "@/lib/orderInvoice";
import type { Booking } from "@shared/domain/types";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatDate, formatINRPerT, materialTypeLabel } from "@/utils";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function BookingsDeliveries() {
  const { t } = useTranslation();
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const activeWorkspace = user?.activeWorkspace;
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "SCHEDULED" | "IN_TRANSIT" | "COMPLETED">("ALL");

  const filteredBookings = useMemo(() => {
    return dataset.bookings.filter(booking => {
      const verification = dataset.verifications.find(v => v.bookingId === booking.id);
      const isVerified = verification?.status === "verified";
      const isCompleted = isVerified || verification?.status === "rejected" || booking.status === "cancelled";
      const events = dataset.events.filter(e => e.subjectIds.includes(booking.id));
      const dispatched = Boolean(booking.loadRef || events.some(e => e.kind === "load.dispatched"));
      
      switch (activeTab) {
        case "ACTIVE": return booking.status === "hold" || (booking.status === "confirmed" && !booking.slotId);
        case "SCHEDULED": return booking.status === "confirmed" && booking.slotId && !dispatched;
        case "IN_TRANSIT": return dispatched && !isCompleted;
        case "COMPLETED": return isCompleted;
        case "ALL": default: return true;
      }
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [dataset.bookings, dataset.verifications, dataset.events, activeTab]);

  return (
    <div className="mx-auto max-w-app pb-16">
      <PageMeta title="Bookings & Deliveries | GreenLoop" description="Manage accepted material transactions from booking through verified delivery." />
      
      <div className="mb-6 border border-[#e5e1d8] bg-[#192c20] text-white dark:border-steel-800 relative overflow-hidden gl-card-pad rounded-surface">
        <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/70 to-[#17291e]/15 z-0" />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c7d5c8]">GreenLoop Operations</p>
          <h1 className="mt-1.5 font-archivo font-bold tracking-tight text-white gl-page-title">{t("sidebar.items.bookings-deliveries")}</h1>
          <p className="mt-2 text-sm leading-5 text-white/85 sm:text-base sm:leading-6 max-w-2xl">Manage accepted material transactions from booking through verified delivery.</p>
        </div>
      </div>

      <div className="mb-6 flex space-x-2 border-b border-steel-200 dark:border-steel-800">
        {(["ALL", "ACTIVE", "SCHEDULED", "IN_TRANSIT", "COMPLETED"] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              activeTab === tab 
                ? "border-loop-600 text-loop-700 dark:border-loop-400 dark:text-loop-300" 
                : "border-transparent text-steel-500 hover:text-steel-800 dark:hover:text-gray-300"
            )}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="grid gap-card">
        {filteredBookings.length === 0 ? (
           <div className="text-center py-10 text-steel-500 text-sm border border-dashed border-steel-300 rounded-lg dark:border-steel-700">No transactions found for this view.</div>
        ) : (
          filteredBookings.map((booking) => (
             <TransactionCard key={booking.id} booking={booking} activeWorkspace={activeWorkspace} user={user} />
          ))
        )}
      </div>
    </div>
  );
}

function TransactionCard({ booking, activeWorkspace, user }: { booking: Booking, activeWorkspace?: string; user: User | null }) {
  const { t } = useTranslation();
  const [trackingOpen, setTrackingOpen] = useState(false);
  const { dataset, cancelBookingAction } = useGreenLoopStore();
  const material = dataset.materials.find(m => m.id === booking.materialId);
  const receiver = dataset.receivers.find(r => r.id === booking.receiverId);
  const slot = dataset.slots.find(s => s.id === booking.slotId);
  const verification = dataset.verifications.find(v => v.bookingId === booking.id);
  
  const events = dataset.events.filter(e => e.subjectIds.includes(booking.id));
  const dispatchEvent = events.find(e => e.kind === "load.dispatched");
  const dispatched = Boolean(booking.loadRef || dispatchEvent);
  const isVerified = verification?.status === "verified";
  const isFinalized = isVerified || verification?.status === "rejected";
  
  // Resolve valid status badge
  let badgeStatus: Parameters<typeof StatusBadge>[0]["status"] = booking.status;
  if (isVerified) badgeStatus = "verified";
  else if (verification?.status === "rejected") badgeStatus = "rejected";
  else if (verification?.status === "pending") badgeStatus = "pending";
  else if (dispatched) badgeStatus = "dispatched";
  else if (slot && booking.status === "confirmed") badgeStatus = "confirmed";
  
  const offer = dataset.offers?.find((item) => item.demandId === booking.demandId && item.passportId === booking.materialId);
  const unitPrice = booking.agreedPricePerT ?? offer?.agreedPricePerT ?? offer?.pricePerT ?? material?.pricePerT;

  const project = dataset.projects.find(p => p.id === material?.projectId);
  const transactionContact = dataset.transactionContacts?.find(
    (contact) =>
      contact.materialId === booking.materialId &&
      contact.receiverId === booking.receiverId,
  );
  const providerListing = dataset.providerListings?.find(
    (listing) => listing.materialId === booking.materialId,
  );
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
        organization:
          transactionContact?.organization ?? providerListing?.organization,
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
  };

  return (
    <div className="border border-steel-200 dark:border-steel-800 p-4 bg-white dark:bg-[#17251d] rounded-surface">
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-bold text-ink-900 dark:text-white flex items-center gap-2">
             <button type="button" aria-expanded={trackingOpen} aria-controls={`tracking-${booking.id}`} onClick={() => setTrackingOpen(open => !open)} className="text-start hover:underline">{booking.tonnesT} t {materialTypeLabel(material?.type || "unknown")}</button>
             <StatusBadge status={badgeStatus} />
          </h3>
          <p className="text-xs text-steel-500 mt-1">Booking: {booking.id} · Material: {material?.id}</p>
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-ink-900 dark:text-white">Other party: {activeWorkspace === "receiver" ? ("Provider") : (receiver?.name || "Receiver")}</p>
          <p className="text-xs text-steel-500 mt-1">Project/Location: {project?.name || receiver?.location}</p>
        </div>
        <div className="flex-1 min-w-[150px]">
           <p className="text-sm font-semibold text-ink-900 dark:text-white">Agreed Price: {unitPrice ? formatINRPerT(unitPrice) : "N/A"}</p>
           {slot && <p className="text-xs text-steel-500 mt-1">Scheduled: {formatDate(slot.date)}</p>}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
           <Button size="sm" variant="outline" onClick={() => setTrackingOpen(open => !open)}>{t(trackingOpen ? "orderTracking.hide" : "orderTracking.track")}</Button>
           {booking.status === "hold" && activeWorkspace === "receiver" && (
             <Button size="sm" variant="outline" onClick={() => cancelBookingAction({ bookingId: booking.id })}>Cancel Request</Button>
           )}
           {isFinalized && verification && (
             <Link to={activeWorkspace === "receiver" ? `/app/receiver/verification?booking=${encodeURIComponent(booking.id)}` : `/app/verification`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-steel-200 px-4 text-sm font-semibold hover:bg-steel-50 dark:border-steel-700 dark:hover:bg-steel-800">
               View Proof
             </Link>
           )}
           {!isFinalized && booking.status === "confirmed" && dispatched && activeWorkspace === "receiver" && (
             <Link to={`/app/receiver/verification?booking=${encodeURIComponent(booking.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-loop-600 px-4 text-sm font-semibold text-white hover:bg-loop-700">
               Verify Delivery
             </Link>
           )}
        </div>
      </div>
      <div id={`tracking-${booking.id}`}>
        {trackingOpen && (
          <>
            <OrderTracking booking={booking} workspace={activeWorkspace} />
            <OrderInvoiceAction invoice={invoice} />
          </>
        )}
      </div>
    </div>
  );
}
