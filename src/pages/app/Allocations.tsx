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

export default function Allocations() {
  const { dataset } = useGreenLoopStore();

  const materialLabel = (id: string) => {
    const material = dataset.materials.find((m) => m.id === id);
    return material ? `${material.type} (${id})` : id;
  };
  const receiverName = (id: string) =>
    dataset.receivers.find((r) => r.id === id)?.name ?? id;

  return (
    <>
      <PageMeta
        title="Allocations | GreenLoop"
        description="Material-to-receiver allocations with scoring rationale and hold reasons."
      />
      <PageBreadCrumb pageTitle="Allocations" />

      <div className="space-y-6">
        {dataset.allocations.map((allocation) => (
          <section key={allocation.id} className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
                  <span className="ledger-numeral">{allocation.id}</span> ·{" "}
                  {materialLabel(allocation.materialId)} → {receiverName(allocation.receiverId)}
                </h3>
                <p className="ledger-numeral mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  {allocation.requestedT.toFixed(1)} t · slot {allocation.slotId} · capacity{" "}
                  {allocation.capacityBeforeT.toFixed(1)} → {allocation.capacityAfterT.toFixed(1)} t
                  free
                </p>
              </div>
              <StatusBadge status={allocation.status} />
            </div>

            {allocation.holdReason && (
              <p className="border-b border-signal-200 bg-signal-50 px-5 py-3 text-theme-sm text-ink-800 dark:border-signal-500/30 dark:bg-signal-500/10 dark:text-gray-200">
                <span className="font-semibold">Why held:</span> {allocation.holdReason}
              </p>
            )}

            {/* Candidate scoring */}
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Receiver</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Suitability</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Demand</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Distance</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Slot free</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Transport</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Handling</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Score</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {allocation.candidates.map((candidate) => (
                    <TableRow key={candidate.receiverId}>
                      <TableCell className="px-5 py-3 text-start">
                        <span className="text-theme-sm font-medium text-ink-900 dark:text-white/90">
                          {receiverName(candidate.receiverId)}
                        </span>
                        {candidate.recommended && (
                          <span className="ms-2 rounded bg-loop-50 px-1.5 py-0.5 text-theme-xs font-medium text-loop-700 dark:bg-loop-500/15 dark:text-loop-300">
                            recommended
                          </span>
                        )}
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                        {Math.round(candidate.suitability * 100)}%
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                        {Math.round(candidate.demand * 100)}%
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                        {candidate.distanceKm} km
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                        {candidate.availableT.toFixed(1)} t
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                        £{candidate.transportCostPerT.toFixed(2)}/t
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm text-gray-700 dark:text-gray-300">
                        £{candidate.handlingCostPerT.toFixed(2)}/t
                      </TableCell>
                      <TableCell mono className="px-5 py-3 text-end text-theme-sm font-semibold text-ink-900 dark:text-white/90">
                        {candidate.score.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
              Composite score: suitability 40% · demand 25% · slot availability 20% · proximity 15%.
              Recommended = best score among receivers whose slot fits the load.
            </p>
          </section>
        ))}

        {dataset.allocations.length === 0 && (
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            No allocations yet — request capacity from a receiver to create one.
          </p>
        )}
      </div>
    </>
  );
}
