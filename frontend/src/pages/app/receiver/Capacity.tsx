import PageMeta from "@/components/common/PageMeta";
import WorkflowPageHeader from "@/components/greenloop/WorkflowPageHeader";
import Button from "@/components/ui/button/Button";
import { ambientMedia, materialMediaFor } from "@/config/appMedia";
import { useAuth } from "@/context/AuthContext.helpers";
import { slotLedger } from "@shared/domain/capacity";
import type { MaterialTypeKey } from "@shared/domain/types";
import { CalenderIcon } from "@/icons";
import { useGreenLoopStore } from "@/store/GreenLoopStore.helpers";
import { cn, formatDate } from "@/utils";
import { motion } from "motion/react";
import { useState } from "react";

export default function Capacity() {
  const { dataset, addCapacityAction, updateCapacityAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "";
  const [isAdding, setIsAdding] = useState(false);
  const [materialType, setMaterialType] = useState<MaterialTypeKey>("concrete");
  const [date, setDate] = useState("");
  const [capacityT, setCapacityT] = useState("");
  const [formError, setFormError] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editedCapacity, setEditedCapacity] = useState("");
  const [editError, setEditError] = useState("");

  const handleAddCapacity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const capacity = Number(capacityT);
    if (!date || !Number.isFinite(capacity) || capacity <= 0) {
      setFormError("Choose a date and enter capacity greater than zero.");
      return;
    }
    if (dataset.slots.some((slot) => slot.receiverId === receiverId && slot.date === date && slot.materialType === materialType)) {
      setFormError("A capacity slot already exists for this material and date.");
      return;
    }
    const facility = dataset.receivers.find((item) => item.id === receiverId);
    if (!facility) {
      setFormError("No receiving facility is configured for this workspace.");
      return;
    }
    if (!await addCapacityAction({ receiverId, date, materialType, capacityT: capacity })) return;
    setDate("");
    setCapacityT("");
    setIsAdding(false);
    setFormError("");
  };

  const slots = dataset.slots
    .filter(s => s.receiverId === receiverId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextOpenSlot = slots.find((slot) => slot.date >= new Date().toISOString().slice(0, 10));
  const nextAvailable = nextOpenSlot ? slotLedger(dataset, nextOpenSlot.id)?.available ?? 0 : 0;

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Receiving Capacity | GreenLoop" description="Set the amount of each material your facility can receive by date." />
      <WorkflowPageHeader
        title="Receiving Capacity"
        description="How much can your facility accept? Set an amount for each material and date. Bookings use this capacity so loads are not double-booked."
        status={nextOpenSlot ? `${nextAvailable.toFixed(1)} t free · ${formatDate(nextOpenSlot.date)}` : "No upcoming capacity slots"}
        action={{ label: isAdding ? "Close form" : "Add capacity", onClick: () => setIsAdding((open) => !open) }}
      />

      {/* Intake operations — the yard these slots schedule */}
      <figure className="relative mb-section h-40 w-full overflow-hidden border border-steel-200 sm:h-56 lg:h-64 dark:border-steel-800">
        <img
          src={ambientMedia.sortingFacility.src}
          alt={ambientMedia.sortingFacility.alt}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/20 to-ink-950/5" aria-hidden="true" />
        <figcaption className="absolute inset-x-0 bottom-0 px-6 pb-5 sm:px-8 sm:pb-6">
          <p className="font-archivo text-lg font-bold uppercase tracking-wide text-white sm:text-xl">Intake operations · Schedule ahead</p>
          <p className="mt-1 text-sm text-white/80">Set accurate capacity to keep your site running smoothly.</p>
        </figcaption>
      </figure>

      {isAdding && (
        <form onSubmit={handleAddCapacity} className="mb-6 grid gap-card border border-steel-200 bg-white shadow-xs sm:grid-cols-4 dark:border-steel-800 dark:bg-white/[0.02] gl-card-pad rounded-surface">
          <label className="text-sm font-medium text-steel-700 dark:text-gray-300">Material type
            <select value={materialType} onChange={(event) => setMaterialType(event.target.value as MaterialTypeKey)} className="mt-1 block w-full rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white">
              {["concrete", "brick", "steel", "timber", "plasterboard", "glass"].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-steel-700 dark:text-gray-300">Date
            <input type="date" required min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 block w-full rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white" />
          </label>
          <label className="text-sm font-medium text-steel-700 dark:text-gray-300">Available tonnes
            <input type="number" min="0.1" step="0.1" required value={capacityT} onChange={(event) => setCapacityT(event.target.value)} className="mt-1 block w-full rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white" />
          </label>
          <div className="flex flex-col justify-end gap-2">
            <Button size="md" type="submit">Save capacity</Button>
            {formError && <p role="alert" className="text-xs text-error-500">{formError}</p>}
          </div>
        </form>
      )}

      {slots.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01] rounded-surface">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">How much can your facility accept?</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            Add a date, material, and amount to make receiving capacity available to providers.
          </p>
        </div>
      ) : (
        <div className="grid gap-card sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot, i) => {
            const ledger = slotLedger(dataset, slot.id);
            if (!ledger) return null;

            const { available, reserved, slot: s } = ledger;
            const percent = Math.min(100, (reserved / s.capacityT) * 100);
            const media = materialMediaFor(s.materialType);

            return (
              <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={slot.id}
                className="flex flex-col overflow-hidden border border-steel-200 bg-white shadow-xs transition-colors hover:border-steel-400 dark:border-steel-800 dark:bg-white/[0.02] dark:hover:border-steel-600 rounded-surface"
              >
                {/* Material imagery — the commodity this slot accepts */}
                <img
                  src={media.src}
                  alt={media.alt}
                  loading="lazy"
                  className="h-32 w-full border-b border-steel-200 object-cover sm:h-36 dark:border-steel-800"
                />

                <div className="flex flex-1 flex-col gl-card-pad">
                  {/* Date, material, status */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="ledger-numeral text-sm font-semibold text-steel-500 dark:text-steel-400">{formatDate(s.date)}</p>
                      <h3 className="mt-1 font-archivo text-xl font-bold capitalize tracking-tight text-ink-900 dark:text-white sm:text-2xl">{s.materialType}</h3>
                    </div>
                    {available === 0 ? (
                      <span className="shrink-0 rounded bg-signal-50 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.06em] text-signal-700 dark:bg-signal-500/15 dark:text-signal-300">
                        Full
                      </span>
                    ) : reserved > 0 ? (
                      <span className="shrink-0 rounded bg-signal-50 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.06em] text-signal-700 dark:bg-signal-500/15 dark:text-signal-300">
                        Partial
                      </span>
                    ) : (
                      <span className="shrink-0 rounded bg-loop-50 px-2.5 py-1 font-mono text-xs font-medium uppercase tracking-[0.06em] text-loop-700 dark:bg-loop-500/15 dark:text-loop-300">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Headline metrics */}
                  <div className="mt-5 grid grid-cols-2 gap-card border-t border-steel-100 pt-5 dark:border-steel-800/60">
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Total capacity</p>
                      <p className="ledger-numeral mt-1.5 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
                        {s.capacityT.toFixed(1)} <span className="text-base font-bold text-steel-400">t</span>
                      </p>
                    </div>
                    <div>
                      <p className="eyebrow-label text-steel-500 dark:text-steel-400">Available</p>
                      <p className={cn("ledger-numeral mt-1.5 text-2xl font-bold tracking-tight", available > 0 ? "text-loop-600 dark:text-loop-400" : "text-signal-600 dark:text-signal-400")}>
                        {available.toFixed(1)} <span className="text-base font-bold text-steel-400">t</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reservation progress + management */}
                <div className="mt-auto border-t border-steel-100 dark:border-steel-800/60 gl-card-pad">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-steel-600 dark:text-gray-400">{reserved.toFixed(1)} t reserved</span>
                    <span className="ledger-numeral font-bold text-ink-900 dark:text-white">{percent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-800" role="img" aria-label={`${percent.toFixed(0)}% of this slot reserved`}>
                    <div
                      className={cn("h-full rounded-full transition-all", available === 0 ? "bg-signal-500" : "bg-loop-500")}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {editingSlotId === s.id ? (
                    <form className="mt-4 flex flex-wrap items-center gap-2" onSubmit={async (event) => {
                      event.preventDefault();
                      if (!await updateCapacityAction(s.id, Number(editedCapacity))) {
                        setEditError("Capacity must be positive and cannot be lower than booked tonnes.");
                        return;
                      }
                      setEditingSlotId(null);
                      setEditedCapacity("");
                      setEditError("");
                    }}>
                      <input aria-label="Replanned total capacity" type="number" min={reserved} step="0.1" required value={editedCapacity} onChange={(event) => setEditedCapacity(event.target.value)} className="w-28 rounded-sm border-steel-300 text-sm dark:border-steel-700 dark:bg-black dark:text-white" />
                      <Button size="sm" type="submit">Save</Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => { setEditingSlotId(null); setEditError(""); }}>Cancel</Button>
                      {editError && <p role="alert" className="basis-full text-xs text-error-500">{editError}</p>}
                    </form>
                  ) : (
                    <Button
                      size="md"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => { setEditingSlotId(s.id); setEditedCapacity(s.capacityT.toString()); setEditError(""); }}
                    >
                      Manage capacity
                    </Button>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Empty-state guidance — always actionable, never a blank wall */}
      {slots.length > 0 && !nextOpenSlot && (
        <div className="mt-10 flex flex-col items-start gap-5 border border-loop-200/70 bg-loop-50/60 sm:flex-row sm:items-center sm:justify-between dark:border-loop-500/20 dark:bg-loop-500/5 sm:p-7 gl-card-pad rounded-surface">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-loop-200 dark:bg-white/10 dark:ring-loop-500/30">
              <CalenderIcon className="size-5 text-loop-600 dark:text-loop-400" />
            </span>
            <div>
              <h2 className="font-archivo text-lg font-bold text-ink-900 dark:text-white">No upcoming capacity slots</h2>
              <p className="mt-1 max-w-xl text-sm text-steel-600 dark:text-gray-400">
                You don't have any capacity slots scheduled. Add capacity to let providers know when your facility can receive materials.
              </p>
            </div>
          </div>
          <Button size="md" className="w-full shrink-0 bg-ink-900 hover:bg-ink-800 sm:w-auto dark:bg-white dark:text-ink-900 dark:hover:bg-gray-200" onClick={() => setIsAdding(true)}>Add capacity</Button>
        </div>
      )}
    </div>
  );
}
