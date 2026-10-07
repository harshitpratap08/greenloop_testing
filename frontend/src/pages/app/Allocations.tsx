import PageMeta from "@/components/common/PageMeta";
import { EmptyState } from "@/components/greenloop/AppExploration";
import StatusBadge from "@/components/greenloop/StatusBadge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { ambientMedia, materialMediaFor, receiverMediaFor } from "@/config/appMedia";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn } from "@/utils";
import { motion } from "motion/react";
import { Link } from "react-router";

export default function Allocations() {
  const { dataset } = useGreenLoopStore();
  const materialMedia = (id: string) => materialMediaFor(dataset.materials.find((material) => material.id === id)?.type ?? "");

  const materialLabel = (id: string) => {
    const material = dataset.materials.find((item) => item.id === id);
    return material ? `${material.type} (${id})` : id;
  };
  const receiverName = (id: string) => dataset.receivers.find((receiver) => receiver.id === id)?.name ?? id;
  const requestedDate = (slotId: string) => dataset.slots.find((slot) => slot.id === slotId)?.date;

  return (
    <div className="relative min-h-screen pb-16">
      <PageMeta
        title="Matches | GreenLoop"
        description="See which receivers match each material and why a destination is suitable."
      />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative mb-4 min-h-40 overflow-hidden border border-[#e5e1d8] bg-[#17291e] sm:min-h-44 dark:border-steel-800 rounded-surface"
      >
        <img src={ambientMedia.sortingFacility.src} alt={ambientMedia.sortingFacility.alt} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17291e]/95 via-[#17291e]/75 to-[#17291e]/20" aria-hidden="true" />
        <div className="relative flex min-h-40 max-w-3xl flex-col justify-end px-5 py-5 text-white sm:min-h-44 sm:px-7 sm:py-6">
          <p className="eyebrow-label text-loop-300">Provider operations</p>
          <h1 className="mt-1 font-archivo font-bold tracking-tight gl-page-title">Material matches</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/85">
            GreenLoop compares receivers that can process each material. Open a match to review the capacity, distance, and scoring details.
          </p>
        </div>
      </motion.header>

      <div className="space-y-3">
        {dataset.allocations.map((allocation, index) => {
          const media = materialMedia(allocation.materialId);
          return (
            <motion.section
              key={allocation.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.3 }}
              className="overflow-hidden border border-[#e5e1d8] bg-white dark:border-steel-800 dark:bg-white/[0.02] rounded-surface"
            >
              <div className="flex flex-wrap items-center gap-3 bg-[#f8f7f2] p-3 sm:p-3.5 dark:bg-white/[0.03]">
                <Link to={`/app/materials/${allocation.materialId}`} className="group relative size-[68px] shrink-0 overflow-hidden border border-steel-200 dark:border-steel-700" aria-label={`View passport ${allocation.materialId}`}>
                  <img src={media.src} alt={media.alt} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="ledger-numeral text-xs font-semibold text-steel-600 dark:text-steel-400">{allocation.id}</span>
                    <span className="text-steel-300 dark:text-steel-600" aria-hidden="true">·</span>
                    <Link to={`/app/materials/${allocation.materialId}`} className="truncate font-archivo text-sm font-bold capitalize text-ink-900 hover:text-loop-700 dark:text-white dark:hover:text-loop-400">
                      {materialLabel(allocation.materialId)}
                    </Link>
                    <span className="text-steel-400" aria-hidden="true">→</span>
                    <Link to="/app/market-demand?view=receivers" className="truncate text-sm font-semibold text-ink-900 hover:text-loop-700 dark:text-white dark:hover:text-loop-400">
                      {receiverName(allocation.receiverId)}
                    </Link>
                  </div>
                  <p className="mt-1.5 text-xs text-steel-600 dark:text-gray-400">
                    <span className="ledger-numeral font-bold text-ink-900 dark:text-gray-200">{allocation.requestedT.toFixed(1)} t</span> requested
                    <span className="px-1.5 text-steel-300" aria-hidden="true">·</span>
                    {requestedDate(allocation.slotId) ? <time dateTime={requestedDate(allocation.slotId)}>{requestedDate(allocation.slotId)}</time> : "Date not set"}
                  </p>
                </div>
                <StatusBadge status={allocation.status} size="md" />
              </div>

              <details className="group border-t border-steel-200 dark:border-steel-800">
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold text-ink-800 marker:hidden hover:text-loop-700 focus-visible:outline-2 focus-visible:outline-loop-600 dark:text-gray-200 dark:hover:text-loop-400 sm:px-4">
                  <span>View match details</span>
                  <span className="flex items-center gap-2 text-steel-500 dark:text-steel-400">
                    <span className="hidden sm:inline">{allocation.candidates.length} receiver{allocation.candidates.length === 1 ? "" : "s"} compared</span>
                    <svg viewBox="0 0 20 20" className="size-4 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
                  </span>
                </summary>
                <div className="border-t border-steel-200 dark:border-steel-800">
                  {allocation.holdReason && (
                    <div className="border-b border-signal-200 bg-signal-50 px-3 py-2.5 dark:border-signal-500/30 dark:bg-signal-500/10 sm:px-4">
                      <p className="text-xs leading-relaxed text-signal-900 dark:text-signal-100"><span className="font-bold uppercase tracking-wide">Hold reason:</span> {allocation.holdReason}</p>
                    </div>
                  )}

            {/* Candidate scoring table */}
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-steel-200 bg-gray-50/50 dark:border-steel-800 dark:bg-white/[0.01]">
                  <TableRow className="hover:bg-transparent">
                    <TableCell isHeader className="px-6 py-4 text-start font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Receiver</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Suitability</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Demand</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Distance</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Slot free</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Transport</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400 whitespace-nowrap">Handling</TableCell>
                    <TableCell isHeader className="px-6 py-4 text-end font-bold uppercase tracking-wider text-loop-600 dark:text-loop-500 whitespace-nowrap">Score</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-steel-100 dark:divide-steel-800">
                  {allocation.candidates.map((candidate) => (
                    <TableRow key={candidate.receiverId} className={cn("transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]", candidate.recommended && "bg-loop-50/50 dark:bg-loop-500/5")}>
                      <TableCell className="px-6 py-4 text-start">
                        <span className="flex items-center gap-3">
                          <img
                            src={receiverMediaFor(candidate.receiverId).src}
                            alt={receiverMediaFor(candidate.receiverId).alt}
                            loading="lazy"
                            className="hidden h-10 w-14 shrink-0 border border-steel-200 bg-steel-100 object-cover sm:block dark:border-steel-800 dark:bg-steel-900"
                          />
                        <span className="font-archivo text-base font-semibold text-ink-900 dark:text-white">
                          {receiverName(candidate.receiverId)}
                        </span>
                        </span>
                        {candidate.recommended && (
                          <span className="ml-3 inline-flex items-center rounded-sm bg-loop-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-loop-700 dark:bg-loop-500/20 dark:text-loop-400">
                            Recommended
                          </span>
                        )}
                      </TableCell>
                      <TableCell mono className="px-6 py-4 text-end text-sm font-medium text-steel-700 dark:text-gray-300">
                        {Math.round(candidate.suitability * 100)}%
                      </TableCell>
                      <TableCell mono className="px-6 py-4 text-end text-sm font-medium text-steel-700 dark:text-gray-300">
                        {Math.round(candidate.demand * 100)}%
                      </TableCell>
                      <TableCell mono className="px-6 py-4 text-end text-sm font-medium text-steel-700 dark:text-gray-300">
                        {candidate.distanceKm} km
                      </TableCell>
                      <TableCell mono className="px-6 py-4 text-end text-sm font-medium text-steel-700 dark:text-gray-300">
                        {candidate.availableT.toFixed(1)} t
                      </TableCell>
                      <TableCell mono className="px-6 py-4 text-end text-sm font-medium text-steel-700 dark:text-gray-300">
                        £{candidate.transportCostPerT.toFixed(2)}/t
                      </TableCell>
                      <TableCell mono className="px-6 py-4 text-end text-sm font-medium text-steel-700 dark:text-gray-300">
                        £{candidate.handlingCostPerT.toFixed(2)}/t
                      </TableCell>
                      <TableCell mono className={cn("px-6 py-4 text-end text-base font-bold", candidate.recommended ? "text-loop-600 dark:text-loop-400" : "text-ink-900 dark:text-gray-200")}>
                        {candidate.score.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

                  <ul className="grid gap-2 p-3 lg:hidden sm:grid-cols-2 sm:p-4">
                    {allocation.candidates.map((candidate) => (
                      <li key={candidate.receiverId} className={cn("min-w-0 border p-3", candidate.recommended ? "border-loop-300 bg-loop-50/50 dark:border-loop-700/60 dark:bg-loop-900/10" : "border-steel-200 bg-white dark:border-steel-800 dark:bg-white/[0.02]")}>
                        <div className="flex items-center gap-2.5">
                          <img src={receiverMediaFor(candidate.receiverId).src} alt={receiverMediaFor(candidate.receiverId).alt} loading="lazy" className="size-10 shrink-0 border border-steel-200 object-cover dark:border-steel-800" />
                          <div className="min-w-0 flex-1">
                            <Link to="/app/market-demand?view=receivers" className="block truncate text-xs font-bold text-ink-900 hover:text-loop-700 dark:text-white dark:hover:text-loop-400">{receiverName(candidate.receiverId)}</Link>
                            {candidate.recommended && <span className="mt-1 inline-flex border border-loop-200 bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-loop-800 dark:border-loop-700/50 dark:bg-loop-900/20 dark:text-loop-300">Recommended</span>}
                          </div>
                          <div className="text-end">
                            <p className="eyebrow-label text-steel-500 dark:text-steel-400">Score</p>
                            <p className={cn("ledger-numeral text-sm font-bold", candidate.recommended ? "text-loop-700 dark:text-loop-400" : "text-ink-900 dark:text-white")}>{candidate.score.toFixed(3)}</p>
                          </div>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-steel-200 pt-2.5 dark:border-steel-800 sm:grid-cols-4">
                          <CandidateMetric label="Suitability" value={`${Math.round(candidate.suitability * 100)}%`} />
                          <CandidateMetric label="Demand" value={`${Math.round(candidate.demand * 100)}%`} />
                          <CandidateMetric label="Distance" value={`${candidate.distanceKm} km`} />
                          <CandidateMetric label="Slot free" value={`${candidate.availableT.toFixed(1)} t`} />
                          <CandidateMetric label="Transport" value={`£${candidate.transportCostPerT.toFixed(2)}/t`} />
                          <CandidateMetric label="Handling" value={`£${candidate.handlingCostPerT.toFixed(2)}/t`} />
                        </dl>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-steel-200 bg-[#f8f7f2] px-3 py-2.5 dark:border-steel-800 dark:bg-white/[0.02] sm:px-4">
                    <p className="text-xs leading-relaxed text-steel-600 dark:text-steel-400">
                      Composite score: suitability 40% · demand 25% · slot availability 20% · proximity 15%. Recommended = best score among receivers whose slot fits the load.
                    </p>
                    <p className="mt-1.5 break-words text-xs text-steel-500 dark:text-steel-400">Match ID: {allocation.id} · Receiving slot: {allocation.slotId} · Capacity {allocation.capacityBeforeT.toFixed(1)} → {allocation.capacityAfterT.toFixed(1)} t free</p>
                  </div>
                </div>
              </details>
            </motion.section>
          );
        })}

        {dataset.allocations.length === 0 && (
          <EmptyState
            title="No matches yet"
            body="Find a receiver for your material to create a match."
            action={{ label: "Find receivers", to: "/app/market-demand?view=receivers" }}
          />
        )}
      </div>
    </div>
  );
}

function CandidateMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-steel-500 dark:text-steel-400">{label}</dt>
      <dd className="ledger-numeral mt-0.5 truncate text-xs font-semibold text-ink-800 dark:text-gray-200">{value}</dd>
    </div>
  );
}
