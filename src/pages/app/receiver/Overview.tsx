import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { ReactNode } from "react";
import PageMeta from "@/components/common/PageMeta";
import { PageMotion, RevealItem } from "@/components/greenloop/kit";
import { useGreeting } from "@/components/greenloop/AppExploration";
import { useAuth } from "@/context/AuthContext";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { BoxMoving, CheckCircleIcon, SearchIcon, TaskIcon, TruckDelivery } from "@/icons";
import type { MaterialPassport } from "@/domain/types";

const TYPE_LABEL: Record<string, string> = {
  concrete: "Concrete",
  brick: "Brick",
  steel: "Steel",
  timber: "Timber",
  plasterboard: "Plasterboard",
  glass: "Glass",
};

type HomeCard = {
  title: string;
  description: string;
  action: string;
  to: string;
  image: { src: string; alt: string };
};

function ActivityCard({ icon, label, value, detail, to }: { icon: ReactNode; label: string; value: string; detail: string; to: string }) {
  return (
    <Link to={to} className="group min-w-0 rounded-xl border border-[#e6e4dc] bg-white p-4 transition-colors hover:border-[#4b8b67] dark:border-white/10 dark:bg-[#17241b] dark:hover:border-[#79a88a] sm:p-5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-[#edf3ee] text-[#477e5d] dark:bg-[#263c2e] dark:text-[#a6c7ad]" aria-hidden="true">{icon}</span>
      <p className="mt-4 font-archivo text-2xl font-bold tracking-tight text-[#1e2922] dark:text-white sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[#39443c] dark:text-[#e2e7e1]">{label}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#4b805e] group-hover:text-[#2f6948]">{detail}<span aria-hidden="true">→</span></span>
    </Link>
  );
}

function ShortcutCard({ title, description, action, to, image }: HomeCard) {
  return (
    <Link to={to} className="group min-w-0 overflow-hidden rounded-xl border border-[#e6e4dc] bg-white transition-colors hover:border-[#4b8b67] dark:border-white/10 dark:bg-[#17241b] dark:hover:border-[#79a88a]">
      <div className="aspect-[16/9] overflow-hidden bg-[#e5e4dc]">
        <img src={image.src} alt={image.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-archivo text-lg font-bold text-[#243229] dark:text-white">{title}</h3>
        <p className="mt-1 min-h-10 text-sm leading-5 text-[#667168] dark:text-gray-300">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#477e5d]">{action}<span aria-hidden="true">→</span></span>
      </div>
    </Link>
  );
}

function MaterialResult({ material }: { material: MaterialPassport }) {
  return (
    <Link to={`/app/materials/${material.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-[#f5f6f2] dark:hover:bg-white/5">
      <img src={materialMediaFor(material.type).src} alt="" className="size-12 shrink-0 rounded-md object-cover" loading="lazy" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#243229] dark:text-white">{TYPE_LABEL[material.type] ?? material.type}</span>
        <span className="mt-0.5 block truncate text-xs text-[#748078] dark:text-gray-400">{material.id} · {material.quantityT.toFixed(1)} t · {material.condition} condition</span>
      </span>
      <span className="text-xs font-semibold text-[#477e5d]">Open <span aria-hidden="true">→</span></span>
    </Link>
  );
}

export default function Overview() {
  const { dataset } = useGreenLoopStore();
  const { user } = useAuth();
  const greeting = useGreeting();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const receiverId = user?.receiverId;
  const receiverDemandIds = useMemo(() => new Set((dataset.demands ?? []).filter((demand) => demand.receiverId === receiverId).map((demand) => demand.id)), [dataset.demands, receiverId]);
  const activeRequests = (dataset.demands ?? []).filter((demand) => demand.receiverId === receiverId && demand.status !== "PAUSED" && demand.status !== "COVERED").length;
  const pendingOffers = (dataset.offers ?? []).filter((offer) => offer.status === "pending" && receiverDemandIds.has(offer.demandId)).length;
  const dispatchedIds = new Set(dataset.events.filter((event) => event.kind === "load.dispatched").flatMap((event) => event.subjectIds));
  const receiverUpcomingDeliveries = dataset.bookings.filter((booking) => booking.receiverId === receiverId && booking.status === "confirmed" && !dispatchedIds.has(booking.id));
  const materialSourcedT = dataset.verifications.filter((verification) => verification.receiverId === receiverId && verification.status === "verified").reduce((total, verification) => total + verification.acceptedT, 0);
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return dataset.materials.filter((material) => {
      if (material.status === "verified" || material.status === "cancelled") return false;
      const project = dataset.projects.find((item) => item.id === material.projectId);
      const values = [TYPE_LABEL[material.type] ?? material.type, material.id, material.condition, project?.name ?? ""];
      if (material.type === "timber") values.push("wood");
      return values.some((value) => value.toLowerCase().includes(normalizedQuery));
    }).slice(0, 5);
  }, [dataset.materials, dataset.projects, normalizedQuery]);
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const shortcuts: HomeCard[] = [
    { title: "Find Materials", description: "Search recorded passports for material that fits your project.", action: "Browse materials", to: "/app/materials", image: materialMediaFor("brick") },
    { title: "My Requests", description: "Manage material requests and review provider offers.", action: "View requests", to: "/app/receiver/demand", image: ambientMedia.sortingFacility },
    { title: "Deliveries", description: "Follow booked and arriving loads at your facility.", action: "Track deliveries", to: "/app/receiver/deliveries", image: ambientMedia.authTruck },
    { title: "Impact", description: "Review recorded recovery and accepted material.", action: "View reports", to: "/app/reports", image: ambientMedia.inspectionWorker },
  ];

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchResults[0]) navigate(`/app/materials/${searchResults[0].id}`);
  };

  return (
    <PageMotion className="mx-auto max-w-[1440px] pb-12">
      <PageMeta title="Home | GreenLoop" description="Find recovered construction materials, manage requests, and follow deliveries to your facility." />

      <RevealItem>
        <section className="grid overflow-hidden rounded-2xl border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b] lg:grid-cols-[1.08fr_0.92fr]" aria-labelledby="receiver-home-title">
          <div className="flex flex-col items-start justify-center p-6 sm:p-9 lg:p-11">
            <p className="text-sm font-semibold text-[#54705c] dark:text-[#a6c7ad]">{greeting}{firstName ? `, ${firstName}` : ""}.</p>
            <h1 id="receiver-home-title" className="mt-3 max-w-xl font-archivo text-3xl font-bold leading-tight tracking-tight text-[#1e2922] dark:text-white sm:text-4xl lg:text-[2.75rem]">Looking for materials?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#657168] dark:text-gray-300 sm:text-base">Find the right recovered materials for your next project. Access quality construction materials and make your work more sustainable.</p>
            <form id="material-search" onSubmit={handleSearch} className="mt-6 flex w-full max-w-xl rounded-lg border border-[#d9ddd7] bg-white p-1 focus-within:border-[#548866] focus-within:ring-2 focus-within:ring-[#548866]/15 dark:border-white/15 dark:bg-[#101913]">
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search materials" placeholder="Search for materials (e.g. bricks, steel, wood...)" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#26342b] outline-none placeholder:text-[#8a938b] dark:text-white dark:placeholder:text-gray-500" />
              <button type="submit" aria-label="Search materials" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#33734f] text-white transition-colors hover:bg-[#285e40]"><SearchIcon className="size-5" /></button>
            </form>
            {normalizedQuery && (
              <div className="mt-2 w-full max-w-xl overflow-hidden rounded-lg border border-[#e6e4dc] bg-white dark:border-white/10 dark:bg-[#17241b]" aria-live="polite">
                {searchResults.length > 0 ? searchResults.map((material) => <MaterialResult key={material.id} material={material} />) : <p className="p-4 text-sm text-[#667168] dark:text-gray-300">No available material passports match that search.</p>}
              </div>
            )}
            <Link to="/app/receiver/demand" className="mt-4 text-sm font-semibold text-[#477e5d] underline decoration-[#b7cabb] underline-offset-4 hover:text-[#285e40] dark:text-[#a6c7ad]">Can’t find it? Request material <span aria-hidden="true">→</span></Link>
          </div>
          <div className="relative min-h-56 bg-[#d8d7cd] sm:min-h-72 lg:min-h-[330px]">
            <img src={ambientMedia.sortingFacility.src} alt={ambientMedia.sortingFacility.alt} fetchPriority="high" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-0 bg-[#18231c]/15" aria-hidden="true" />
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-[#17251d]/85 p-3 text-white sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-64 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Materials for what’s next</p>
              <p className="mt-1 text-sm font-medium leading-5">Quality recovered material, ready to find its next project.</p>
            </div>
          </div>
        </section>
      </RevealItem>

      <RevealItem className="mt-7">
        <section aria-labelledby="receiver-activity-title">
          <div className="mb-3">
            <h2 id="receiver-activity-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Your Activity</h2>
            <p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Requests and deliveries for your receiving workspace.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <ActivityCard icon={<TaskIcon className="size-5" />} label="Active Requests" value={String(activeRequests)} detail="Manage requests" to="/app/receiver/demand" />
            <ActivityCard icon={<BoxMoving className="size-5" />} label="Offers to Review" value={String(pendingOffers)} detail="Review offers" to="/app/receiver/demand" />
            <ActivityCard icon={<TruckDelivery className="size-5" />} label="Upcoming Deliveries" value={String(receiverUpcomingDeliveries.length)} detail="Track loads" to="/app/receiver/deliveries" />
            <ActivityCard icon={<CheckCircleIcon className="size-5" />} label="Material Sourced" value={`${materialSourcedT.toFixed(1)} t`} detail="View impact" to="/app/reports" />
          </div>
        </section>
      </RevealItem>

      <RevealItem className="mt-8">
        <section aria-labelledby="receiver-shortcuts-title">
          <div className="mb-4">
            <h2 id="receiver-shortcuts-title" className="font-archivo text-xl font-bold text-[#243229] dark:text-white">Explore GreenLoop</h2>
            <p className="mt-1 text-xs text-[#748078] dark:text-gray-400">Find material, keep requests moving, and follow each delivery.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {shortcuts.map((shortcut) => <ShortcutCard key={shortcut.title} {...shortcut} />)}
          </div>
        </section>
      </RevealItem>
    </PageMotion>
  );
}
