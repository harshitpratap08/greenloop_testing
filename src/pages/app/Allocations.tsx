import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { motion } from "motion/react";
import { cn } from "@/utils";
import { EmptyState } from "@/components/greenloop/AppExploration";
import { materialMediaFor, receiverMediaFor } from "@/config/appMedia";

export default function Allocations() {
  const { dataset } = useGreenLoopStore();
  const materialMedia = (id: string) => materialMediaFor(dataset.materials.find((m) => m.id === id)?.type ?? "");

  const materialLabel = (id: string) => {
    const material = dataset.materials.find((m) => m.id === id);
    return material ? `${material.type} (${id})` : id;
  };
  const receiverName = (id: string) =>
    dataset.receivers.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta
        title="Matches | GreenLoop"
        description="See which receivers match each material and why a destination is suitable."
      />
      <PageBreadCrumb pageTitle="Matches" />

      {/* Hero Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10 border-b border-steel-300 pb-8 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Provider operations</p>
        <h1 className="mt-4 font-archivo text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          Material matches
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-steel-600 dark:text-gray-400">
          GreenLoop compares receivers that can process each material. Open a match to review the capacity, distance, and scoring details.
        </p>
      </motion.header>

      <div className="space-y-8">
        {dataset.allocations.map((allocation, index) => (
          <motion.section 
            key={allocation.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="overflow-hidden rounded-sm border border-steel-200 bg-white shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-steel-200 bg-gray-50 px-6 py-5 dark:border-steel-800 dark:bg-black/20">
              <img
                src={materialMedia(allocation.materialId).src}
                alt={materialMedia(allocation.materialId).alt}
                loading="lazy"
                className="h-16 w-24 shrink-0 border border-steel-200 bg-steel-100 object-cover dark:border-steel-800 dark:bg-steel-900"
              />
              <div>
                <h3 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">
                  <span className="ledger-numeral text-steel-500 dark:text-steel-400">{allocation.id}</span>
                  <span className="mx-3 text-steel-300 dark:text-steel-600">|</span>
                  <span className="capitalize">{materialLabel(allocation.materialId)}</span>
                  <span className="mx-2 text-steel-400 dark:text-steel-500">→</span> 
                  {receiverName(allocation.receiverId)}
                </h3>
                <p className="mt-2 text-sm font-medium text-steel-600 dark:text-gray-400">
                  <span className="font-bold text-ink-900 dark:text-gray-200">{allocation.requestedT.toFixed(1)} t</span> requested · {dataset.slots.find((slot) => slot.id === allocation.slotId)?.date ?? "Date not set"}
                </p>
              </div>
              <StatusBadge status={allocation.status} size="md" />
            </div>

            <details className="border-t border-steel-200 dark:border-steel-800">
              <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-ink-800 dark:text-gray-200">View match details ▾</summary>
              <div className="border-t border-steel-200 dark:border-steel-800">
            {allocation.holdReason && (
              <div className="border-b border-signal-200 bg-signal-50 px-6 py-4 dark:border-signal-500/30 dark:bg-signal-500/10">
                <p className="text-sm text-signal-900 dark:text-signal-100">
                  <span className="font-bold uppercase tracking-wider">Hold Reason:</span> {allocation.holdReason}
                </p>
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

            <div className="bg-gray-50 px-6 py-4 dark:bg-black/20">
              <p className="text-xs font-medium text-steel-500 dark:text-gray-500">
                Composite score: suitability 40% · demand 25% · slot availability 20% · proximity 15%. Recommended = best score among receivers whose slot fits the load.
              </p>
              <p className="mt-2 text-xs text-steel-500">Match ID: {allocation.id} · Receiving slot: {allocation.slotId} · Capacity {allocation.capacityBeforeT.toFixed(1)} → {allocation.capacityAfterT.toFixed(1)} t free</p>
            </div>
              </div>
            </details>
          </motion.section>
        ))}

        {dataset.allocations.length === 0 && (
          <EmptyState 
            title="No matches yet"
            body="Find a receiver for your material to create a match."
            action={{ label: "Find receivers", to: "/app/receivers" }}
          />
        )}
      </div>
    </div>
  );
}
