import PageMeta from "@/components/common/PageMeta";
import { useGreeting } from "@/components/greenloop/AppExploration.helpers";
import { PageMotion, RevealItem } from "@/components/greenloop/kit";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { BoxMoving, CheckCircleIcon, TaskIcon } from "@/icons";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { formatDate, materialTypeLabel } from "@/utils";
import type { ReactNode } from "react";
import { Link } from "react-router";

type HomeCard = {
  title: string;
  description: string;
  action: string;
  to: string;
  image: { src: string; alt: string };
};

function ActivityCard({ icon, label, value, detail, to }: { icon: ReactNode; label: string; value: string; detail: string; to: string }) {
  return (
    <Link to={to} className="group flex h-full min-w-0 flex-col border border-[#e6e4dc] bg-white transition-colors hover:border-[#4b8b67] dark:border-white/10 dark:bg-[#17241b] dark:hover:border-[#79a88a] gl-card-pad rounded-surface">
      <span className="flex size-9 items-center justify-center rounded-lg bg-[#edf3ee] text-[#477e5d] dark:bg-[#263c2e] dark:text-[#a6c7ad]" aria-hidden="true">{icon}</span>
      <p className="mt-4 font-archivo text-2xl font-bold tracking-tight text-[#1e2922] dark:text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#39443c] dark:text-[#e2e7e1]">{label}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-detail text-xs font-semibold text-[#4b805e] group-hover:text-[#2f6948]">{detail}<span aria-hidden="true">→</span></span>
    </Link>
  );
}

function ShortcutCard({ title, description, action, to, image }: HomeCard) {
  return (
    <Link to={to} className="group flex h-full min-w-0 flex-col overflow-hidden border border-[#e6e4dc] bg-white transition-colors hover:border-[#4b8b67] dark:border-white/10 dark:bg-[#17241b] dark:hover:border-[#79a88a] rounded-surface">
      <div className="aspect-golden max-h-52 shrink-0 overflow-hidden bg-[#e5e4dc]"><img src={image.src} alt={image.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" /></div>
      <div className="flex flex-1 flex-col gl-card-pad"><h3 className="font-archivo text-lg font-bold text-[#243229] dark:text-white">{title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-[#667168] dark:text-gray-300">{description}</p><span className="mt-auto inline-flex items-center gap-1 pt-detail text-sm font-semibold text-[#477e5d]">{action}<span aria-hidden="true">→</span></span></div>
    </Link>
  );
}

export default function Overview() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const greeting = useGreeting();
  const receiverId = user?.receiverId ?? "";
  const receiverDemands = dataset.demands.filter((demand) => demand.receiverId === receiverId && demand.status !== "PAUSED");
  const demandIds = new Set(receiverDemands.map((demand) => demand.id));
  const pendingOffers = (dataset.offers ?? []).filter((offer) => offer.status === "pending" && demandIds.has(offer.demandId)).length;
  const confirmedBookings = dataset.bookings.filter((booking) => booking.receiverId === receiverId && booking.status === "confirmed");
  const requestedT = receiverDemands.reduce((total, demand) => total + demand.requiredT, 0);
  const receivedT = dataset.verifications.filter((record) => record.receiverId === receiverId && record.status === "verified").reduce((total, record) => total + record.acceptedT, 0);
  const remainingT = Math.max(0, requestedT - confirmedBookings.filter((booking) => booking.demandId).reduce((total, booking) => total + booking.tonnesT, 0));
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const relatedBookingIds = new Set(dataset.bookings.filter((booking) => booking.receiverId === receiverId).map((booking) => booking.id));
  const events = dataset.events.filter((event) => event.subjectIds.some((id) => id === receiverId || demandIds.has(id) || relatedBookingIds.has(id))).slice(-5).reverse();

  const shortcuts: HomeCard[] = [
    { title: "Find Providers", description: "Browse real material listings and compare availability before requesting a load.", action: "Browse providers", to: "/app/receiver/providers", image: materialMediaFor("brick") },
    { title: "Request Material", description: "Publish the material, amount, and date your facility needs.", action: "Create request", to: "/app/receiver/demand", image: ambientMedia.sortingFacility },
    { title: "Receiver Inventory", description: "Review material already received and verified at your facility.", action: "View inventory", to: "/app/receiver/inventory", image: ambientMedia.inspectionWorker },
  ];

  return (
    <PageMotion className="mx-auto max-w-app pb-12">
      <PageMeta title="Receiver Home | GreenLoop" description="Manage material requests, follow demand coverage, and review receiver activity." />
      <RevealItem>
        <section className="grid overflow-hidden border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b] lg:gl-golden-columns rounded-surface" aria-labelledby="receiver-home-title">
          <div className="flex flex-col items-start justify-center p-card sm:p-section">
            <p className="text-sm font-semibold text-[#54705c] dark:text-[#a6c7ad]">{greeting}{firstName ? `, ${firstName}` : ""}.</p>
            <h1 id="receiver-home-title" className="mt-3 max-w-xl font-archivo font-bold leading-tight tracking-tight text-[#1e2922] dark:text-white gl-page-title">Source recovered material for your next project.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657168] dark:text-gray-300 sm:text-base">Publish what your facility needs, review provider offers, and follow demand through delivery and verification.</p>
            <Link to="/app/receiver/demand" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#33734f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#285e40]">Request Material <span aria-hidden="true">→</span></Link>
            <Link to="/app/receiver/providers" className="mt-3 text-sm font-semibold text-[#477e5d] underline underline-offset-4 dark:text-[#a6c7ad]">Browse Providers</Link>
          </div>
          <div className="relative min-h-56 bg-[#d8d7cd] sm:min-h-72 lg:min-h-64">
            <img src={ambientMedia.sortingFacility.src} alt={ambientMedia.sortingFacility.alt} className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-[#18231c]/15" aria-hidden="true" />
            <div className="absolute inset-s-4 bottom-4 rounded-lg bg-[#17251d]/85 p-3 text-white sm:inset-s-auto sm:inset-e-5 sm:bottom-5 sm:max-w-64 sm:p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Demand, matched to supply</p><p className="mt-1 text-sm font-medium leading-5">Track what is requested, received, and still needed.</p></div>
          </div>
        </section>
      </RevealItem>

      <RevealItem className="mt-section">
        <section aria-labelledby="receiver-activity-title">
          <div className="mb-3"><h2 id="receiver-activity-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Your Activity</h2><p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Requests and verified material for your receiving workspace.</p></div>
          <div className="grid grid-cols-2 gap-detail xl:grid-cols-4">
            <ActivityCard icon={<TaskIcon className="size-5" />} label="Active Requests" value={String(receiverDemands.length)} detail="Manage requests" to="/app/receiver/demand" />
            <ActivityCard icon={<BoxMoving className="size-5" />} label="Offers to Review" value={String(pendingOffers)} detail="Review offers" to="/app/receiver/demand" />
            <ActivityCard icon={<CheckCircleIcon className="size-5" />} label="Remaining Demand" value={`${remainingT.toLocaleString("en-IN")} t`} detail="Review progress" to="/app/receiver/demand" />
            <ActivityCard icon={<BoxMoving className="size-5" />} label="Material Received" value={`${receivedT.toLocaleString("en-IN")} t`} detail="View inventory" to="/app/receiver/inventory" />
          </div>
        </section>
      </RevealItem>

      <RevealItem className="mt-section">
        <section aria-labelledby="demand-progress-title">
          <div className="mb-4"><h2 id="demand-progress-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Demand Progress</h2><p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Coverage is calculated from confirmed bookings.</p></div>
          {receiverDemands.length ? <ul className="grid gap-detail md:grid-cols-2">
            {receiverDemands.slice(0, 4).map((demand) => {
              const covered = dataset.bookings.filter((booking) => booking.demandId === demand.id && booking.status === "confirmed").reduce((total, booking) => total + booking.tonnesT, 0);
              const remaining = Math.max(0, demand.requiredT - covered);
              const percent = demand.requiredT ? Math.min(100, Math.round((covered / demand.requiredT) * 100)) : 0;
              return <li key={demand.id} className="border border-[#e6e4dc] bg-white p-4 dark:border-white/10 dark:bg-[#17241b] rounded-surface"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-[#243229] dark:text-white">{materialTypeLabel(demand.materialType)}</h3><p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Needed by {formatDate(demand.period)} · {demand.location}</p></div><span className="font-archivo text-lg font-bold text-[#243229] dark:text-white">{percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e9ece6] dark:bg-white/10"><div className="h-full rounded-full bg-[#5c8967]" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-xs text-[#748078] dark:text-gray-400"><span>{covered.toLocaleString("en-IN")} t received of {demand.requiredT.toLocaleString("en-IN")} t</span><span>{remaining.toLocaleString("en-IN")} t remaining</span></div></li>;
            })}
          </ul> : <div className="rounded-xl border border-dashed border-[#cbd4ca] px-5 py-8 text-sm text-[#667168] dark:border-white/15 dark:text-gray-300">No material requests yet. Create a request to start matching with providers.</div>}
        </section>
      </RevealItem>

      <div className="mt-section grid gap-card lg:gl-golden-columns">
        <RevealItem>
          <section aria-labelledby="receiver-shortcuts-title"><div className="mb-4"><h2 id="receiver-shortcuts-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Quick Actions</h2></div><div className="grid gap-card sm:grid-cols-2 xl:grid-cols-3">{shortcuts.map((shortcut) => <ShortcutCard key={shortcut.title} {...shortcut} />)}</div></section>
        </RevealItem>
        <RevealItem>
          <section aria-labelledby="receiver-recent-activity-title" className="border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b] gl-card-pad rounded-surface"><div className="flex items-center justify-between gap-3"><h2 id="receiver-recent-activity-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Recent Activity</h2><Link to="/app/audit-trail" className="text-xs font-semibold text-[#477e5d] underline dark:text-[#a6c7ad]">View history</Link></div>{events.length ? <ol className="mt-4 space-y-4">{events.map((event) => <li key={event.id} className="border-s-2 border-[#5c8967] ps-3"><p className="text-sm font-medium text-[#35443a] dark:text-gray-200">{event.summary}</p><p className="mt-1 text-xs text-[#748078] dark:text-gray-400">{formatDate(event.at)}</p></li>)}</ol> : <p className="mt-4 text-sm text-[#748078] dark:text-gray-400">New request, offer, delivery, and verification updates will appear here.</p>}</section>
        </RevealItem>
      </div>
    </PageMotion>
  );
}
