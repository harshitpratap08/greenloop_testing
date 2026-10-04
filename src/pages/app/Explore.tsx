import PageMeta from "@/components/common/PageMeta";
import { ProjectCard } from "@/components/greenloop/AppExploration";
import { useGreeting } from "@/components/greenloop/AppExploration.helpers";
import { PageMotion, RevealItem } from "@/components/greenloop/kit";
import { ambientMedia, materialMediaFor, projectMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { BoxMoving, CheckCircleIcon, TaskIcon, TruckDelivery } from "@/icons";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
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
      <span className="mt-auto inline-flex items-center gap-1 pt-detail text-xs font-semibold text-[#4b805e] group-hover:text-[#2f6948] dark:text-[#a6c7ad] dark:group-hover:text-white">{detail}<span aria-hidden="true">→</span></span>
    </Link>
  );
}

function ShortcutCard({ title, description, action, to, image }: HomeCard) {
  return (
    <Link to={to} className="group flex h-full min-w-0 flex-col overflow-hidden border border-[#e6e4dc] bg-white transition-colors hover:border-[#4b8b67] dark:border-white/10 dark:bg-[#17241b] dark:hover:border-[#79a88a] rounded-surface">
      <div className="aspect-golden max-h-52 shrink-0 overflow-hidden bg-[#e5e4dc]">
        <img src={image.src} alt={image.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
      </div>
      <div className="flex flex-1 flex-col gl-card-pad">
        <h3 className="font-archivo text-lg font-bold text-[#243229] dark:text-white">{title}</h3>
        <p className="mt-1 min-h-10 text-sm leading-5 text-[#667168] dark:text-gray-300">{description}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-detail text-sm font-semibold text-[#477e5d] dark:text-[#a6c7ad]">{action}<span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

export default function Explore() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const greeting = useGreeting();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const activeAllocations = dataset.allocations.filter((allocation) => allocation.status !== "cancelled");
  const activeListings = dataset.materials.filter((material) => material.status !== "verified" && material.status !== "cancelled" && material.status !== "dispatched").length;
  const pendingMatches = dataset.materials.filter((material) =>
    material.status !== "verified" && material.status !== "dispatched" &&
    !activeAllocations.some((allocation) => allocation.materialId === material.id),
  ).length;
  const activeTransactions = dataset.bookings.filter((booking) => booking.status !== "cancelled").length;
  const materialReusedT = dataset.verifications
    .filter((verification) => verification.status === "verified")
    .reduce((total, verification) => total + verification.acceptedT, 0);
  const leadProject = dataset.projects[0];
  const pendingActions = [
    ...dataset.materials.filter((material) => !activeAllocations.some((allocation) => allocation.materialId === material.id) && material.status !== "verified" && material.status !== "dispatched").map((material) => ({ id: material.id, label: `${material.quantityT.toFixed(1)} t ${material.type} is ready to offer`, to: "/app/market-demand" })),
    ...dataset.bookings.filter((booking) => booking.status === "hold").map((booking) => ({ id: booking.id, label: `${booking.tonnesT.toFixed(1)} t request is waiting on capacity`, to: "/app/bookings" })),
    ...dataset.bookings.filter((booking) => booking.status === "confirmed" && booking.receiverAcceptedAt && !booking.loadRef).map((booking) => ({ id: `dispatch-${booking.id}`, label: `${booking.tonnesT.toFixed(1)} t booking is ready to dispatch`, to: "/app/deliveries" })),
  ].slice(0, 5);
  const heroImage = leadProject ? projectMediaFor(leadProject) : ambientMedia.surveyHero;

  const shortcuts: HomeCard[] = [
    { title: "Materials", description: "Manage your listings and available materials.", action: "View materials", to: "/app/materials", image: materialMediaFor("brick") },
    { title: "Bookings", description: "Review active requests, confirmations, and transaction status.", action: "View bookings", to: "/app/bookings", image: ambientMedia.authTruck },
    { title: "Impact", description: "See the recovery recorded across your workspace.", action: "View impact", to: "/app/dashboard", image: ambientMedia.inspectionWorker },
    { title: "Recent Activity", description: "Review the latest recorded project events.", action: "View activity", to: "/app/audit-trail", image: ambientMedia.sortingFacility },
  ];

  return (
    <PageMotion className="mx-auto max-w-app pb-12">
      <PageMeta title="Home | GreenLoop" description="Offer recovered construction materials and track their journey through GreenLoop." />

      <RevealItem>
        <section className="grid overflow-hidden border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b] lg:gl-golden-columns rounded-surface" aria-labelledby="provider-home-title">
          <div className="flex flex-col items-start justify-center p-card sm:p-section">
            <p className="text-sm font-semibold text-[#54705c] dark:text-[#a6c7ad]">{greeting}{firstName ? `, ${firstName}` : ""}. Let’s give materials a second life.</p>
            <h1 id="provider-home-title" className="mt-3 max-w-xl font-archivo font-bold leading-tight tracking-tight text-[#1e2922] dark:text-white gl-page-title">Have material to give?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657168] dark:text-gray-300 sm:text-base">List your surplus construction materials and connect with builders, contractors and nearby projects that can reuse them.</p>
            <Link to="/app/materials/new" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#33734f] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#285e40] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#33734f]">Offer Material <span aria-hidden="true">→</span></Link>
          </div>
          <div className="relative min-h-56 bg-[#d8d7cd] sm:min-h-72 lg:min-h-64">
            <img src={heroImage.src} alt={heroImage.alt} fetchPriority="high" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-[#18231c]/15" aria-hidden="true" />
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-[#17251d]/85 p-3 text-white sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-64 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">GreenLoop recovery</p>
              <p className="mt-1 text-sm font-medium leading-5">Every material has a next use. Let’s make it happen.</p>
            </div>
          </div>
        </section>
      </RevealItem>

      <RevealItem className="mt-section">
        <section aria-labelledby="provider-activity-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="provider-activity-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Your Activity</h2>
              <p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Counts from current GreenLoop records.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-detail xl:grid-cols-4">
            <ActivityCard icon={<BoxMoving className="size-5" />} label="Active Listings" value={String(activeListings)} detail="View listings" to="/app/materials" />
            <ActivityCard icon={<TaskIcon className="size-5" />} label="Pending Matches" value={String(pendingMatches)} detail="Find a receiver" to="/app/market-demand?view=receivers" />
            <ActivityCard icon={<TruckDelivery className="size-5" />} label="Active Transactions" value={String(activeTransactions)} detail="Review bookings" to="/app/bookings" />
            <ActivityCard icon={<CheckCircleIcon className="size-5" />} label="Material Reused" value={`${materialReusedT.toFixed(1)} t`} detail="View impact" to="/app/dashboard" />
          </div>
        </section>
      </RevealItem>

      <RevealItem className="mt-section">
        <section aria-labelledby="provider-pending-title" className="border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b] gl-card-pad rounded-surface">
          <div className="flex items-center justify-between gap-3"><div><h2 id="provider-pending-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Pending Actions</h2><p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Work that can move your active material forward.</p></div><span className="font-archivo text-xl font-bold text-[#243229] dark:text-white">{pendingActions.length}</span></div>
          {pendingActions.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{pendingActions.map((action) => <li key={action.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f6f5f0] px-4 py-3 dark:bg-white/[0.04]"><span className="text-sm font-medium text-[#35443a] dark:text-gray-200">{action.label}</span><Link to={action.to} className="shrink-0 text-xs font-semibold text-[#477e5d] underline dark:text-[#a6c7ad]">Review</Link></li>)}</ul> : <p className="mt-4 text-sm text-[#748078] dark:text-gray-400">No pending actions. New tasks appear here when a record needs attention.</p>}
        </section>
      </RevealItem>

      <div className="mt-section grid gap-card lg:grid-cols-[1fr_1fr]">
        {leadProject && <RevealItem><section aria-labelledby="provider-project-title"><div className="mb-3"><h2 id="provider-project-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Project Overview</h2></div><ProjectCard project={leadProject} /></section></RevealItem>}
        <RevealItem><section aria-labelledby="provider-recent-title" className="border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b] gl-card-pad rounded-surface"><div className="flex items-center justify-between gap-3"><h2 id="provider-recent-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Recent Activity</h2><Link to="/app/audit-trail" className="text-xs font-semibold text-[#477e5d] underline dark:text-[#a6c7ad]">View history</Link></div>{dataset.events.length ? <ol className="mt-4 space-y-4">{dataset.events.slice(-5).reverse().map((event) => <li key={event.id} className="border-s-2 border-[#5c8967] ps-3"><p className="text-sm font-medium text-[#35443a] dark:text-gray-200">{event.summary}</p><p className="mt-1 text-xs text-[#748078] dark:text-gray-400">{event.at.slice(0, 10)} · {event.actor.name}</p></li>)}</ol> : <p className="mt-4 text-sm text-[#748078] dark:text-gray-400">New material, offer, booking, and recovery updates will appear here.</p>}</section></RevealItem>
      </div>

      <RevealItem className="mt-section">
        <section aria-labelledby="provider-shortcuts-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="provider-shortcuts-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Explore GreenLoop</h2>
              <p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Quick ways to offer material and follow its journey.</p>
            </div>
          </div>
          <div className="grid gap-card sm:grid-cols-2 xl:grid-cols-4">
            {shortcuts.map((shortcut) => <ShortcutCard key={shortcut.title} {...shortcut} />)}
          </div>
        </section>
      </RevealItem>
    </PageMotion>
  );
}
