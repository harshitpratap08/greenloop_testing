import CapacityBar from "@/components/greenloop/CapacityBar";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StatusBadge from "@/components/greenloop/StatusBadge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import { useGreenLoopStore } from "@/store/GreenLoopStore";

export default function Bookings() {
  const { dataset, cancelBookingAction } = useGreenLoopStore();

  const materialLabel = (id: string) => dataset.materials.find((m) => m.id === id)?.type ?? id;
  const receiverName = (id: string) => dataset.receivers.find((r) => r.id === id)?.name ?? id;
  const slotDate = (id: string) => dataset.slots.find((s) => s.id === id)?.date ?? id;
  const ledger = slotLedger(dataset, STORY.concreteSlotSept28);

  return (
    <>
      <PageMeta
        title="Bookings | GreenLoop"
        description="Capacity reservations — confirmed tonnage cannot be double-booked."
      />
      <PageBreadCrumb pageTitle="Bookings" />

      <div className="space-y-6">
        {/* Scenario slot ledger */}
        {ledger && (
          <section className="surface-card p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-ink-900 dark:text-white/90">
                  {receiverName(ledger.slot.receiverId)} — concrete intake
                </h3>
                <p className="ledger-numeral mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  {ledger.slot.date} · {ledger.slot.id}
                </p>
              </div>
              <span className="eyebrow-label text-steel-600 dark:text-steel-400">
                Live capacity ledger
              </span>
            </div>
            <CapacityBar
              capacityT={ledger.slot.capacityT}
              reservedT={ledger.reserved}
              heldT={ledger.heldT}
            />
            <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
              Confirmed tonnage consumes the slot. Cancelling a confirmed booking releases its
              tonnes and rechecks held requests automatically.
            </p>
          </section>
        )}

        {/* Reservation ledger */}
        <section className="surface-card overflow-hidden">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Booking</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Receiver</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Material</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Slot</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Tonnes</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Capacity →</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-start whitespace-nowrap">Status</TableCell>
                  <TableCell isHeader className="px-5 py-3 text-end whitespace-nowrap">Action</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {dataset.bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <span className="ledger-numeral text-theme-sm font-medium text-ink-900 dark:text-white/90">
                        {booking.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                      {receiverName(booking.receiverId)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm capitalize text-gray-700 dark:text-gray-300">
                      {materialLabel(booking.materialId)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                      <span className="ledger-numeral">{slotDate(booking.slotId)}</span>
                    </TableCell>
                    <TableCell mono className="px-5 py-4 text-end text-theme-sm font-semibold text-ink-900 dark:text-white/90">
                      {booking.tonnesT.toFixed(1)} t
                    </TableCell>
                    <TableCell mono className="px-5 py-4 text-end text-theme-xs text-gray-500 dark:text-gray-400">
                      {booking.capacityBeforeT.toFixed(1)} → {booking.capacityAfterT.toFixed(1)} t free
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <StatusBadge status={booking.status} />
                      {booking.holdReason && (
                        <span className="mt-1 block max-w-56 text-theme-xs text-signal-700 dark:text-signal-300">
                          {booking.holdReason}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end">
                      {booking.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            cancelBookingAction({
                              bookingId: booking.id,
                              reason: "Programme change — material retained on site",
                            })
                          }
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {dataset.bookings.length === 0 && (
                  <TableRow>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400" >
                      No bookings in the current state.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Scenario trail */}
        <section className="surface-card p-5 md:p-6">
          <h3 className="mb-3 text-base font-semibold text-ink-900 dark:text-white/90">
            Reservation trail
          </h3>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Use the scenario controls on the Operations page to replay the locked 15 t story —
            Project A confirms 10 t, Project B holds at 8 t with its reason, cancelling A releases
            the tonnage and auto-rechecks B to confirmed.
          </p>
        </section>
      </div>
    </>
  );
}
