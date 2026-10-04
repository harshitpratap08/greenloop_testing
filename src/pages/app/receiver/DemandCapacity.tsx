import React, { useState } from "react";
import { ChevronDownIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import { slotLedger } from "@/domain/capacity";
import type { DemandRecord, GreenLoopDataset, ReceiverDaySlot } from "@/domain/types";

interface DemandCapacityProps {
  demand: DemandRecord;
  dataset: GreenLoopDataset;
  receiverId: string;
  addCapacityAction: (args: any) => Promise<ReceiverDaySlot | null>;
  updateCapacityAction: (slotId: string, capacityT: number) => Promise<boolean>;
}

export default function DemandCapacity({ demand, dataset, receiverId, addCapacityAction, updateCapacityAction }: DemandCapacityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [capacityDate, setCapacityDate] = useState("");
  const [capacityT, setCapacityT] = useState("");
  const [error, setError] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editedCapacity, setEditedCapacity] = useState("");

  const relevantSlots = dataset.slots.filter((s: ReceiverDaySlot) => s.receiverId === receiverId && s.materialType === demand.materialType).sort((a: ReceiverDaySlot, b: ReceiverDaySlot) => a.date.localeCompare(b.date));
  const availableT = relevantSlots.reduce((sum: number, slot: ReceiverDaySlot) => sum + (slotLedger(dataset, slot.id)?.available ?? 0), 0);
  
  const windowStr = relevantSlots.length > 0 
      ? `${relevantSlots[0].date} to ${relevantSlots[relevantSlots.length - 1].date}`
      : "No capacity scheduled for this request.";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const capacity = Number(capacityT);
    if (!capacityDate || !Number.isFinite(capacity) || capacity <= 0) { setError("Enter a valid date and positive capacity."); return; }
    
    const existing = relevantSlots.find((slot) => slot.date === capacityDate);
    if (existing) {
      if (!await updateCapacityAction(existing.id, existing.capacityT + capacity)) { setError("Failed to update capacity."); return; }
    } else {
      if (!await addCapacityAction({ receiverId, date: capacityDate, materialType: demand.materialType, capacityT: capacity })) { setError("Failed to add capacity."); return; }
    }
    setCapacityDate("");
    setCapacityT("");
    setError("");
  };

  return (
    <div className="mt-5 border-t border-steel-100 pt-5 dark:border-steel-800/60">
      <details className="group" open={isOpen} onToggle={(e) => setIsOpen(e.currentTarget.open)}>
        <summary className="flex cursor-pointer items-center text-sm font-semibold text-ink-900 dark:text-white hover:text-loop-600 transition-colors">
          Receiving Capacity <ChevronDownIcon className="ml-1.5 size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4 bg-steel-50/50 p-4 rounded-lg border border-steel-100 dark:bg-white/[0.02] dark:border-steel-800/60">
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div><span className="text-steel-500">Available capacity:</span> <span className="font-semibold text-ink-900 dark:text-white">{availableT.toFixed(1)}t</span></div>
            <div><span className="text-steel-500">Capacity window:</span> <span className="font-semibold text-ink-900 dark:text-white">{windowStr}</span></div>
          </div>
          
          <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-end gap-3 border-t border-steel-200 pt-4 dark:border-steel-700/60">
            <label className="text-xs font-medium text-steel-700 dark:text-gray-300">
               Date
               <input type="date" required min={new Date().toISOString().slice(0, 10)} value={capacityDate} onChange={e => setCapacityDate(e.target.value)} className="mt-1 block h-9 rounded-sm border-steel-300 text-sm dark:border-steel-700 dark:bg-black dark:text-white" />
            </label>
            <label className="text-xs font-medium text-steel-700 dark:text-gray-300">
               Capacity (t)
               <input type="number" required min="0.1" step="0.1" value={capacityT} onChange={e => setCapacityT(e.target.value)} className="mt-1 block h-9 w-24 rounded-sm border-steel-300 text-sm dark:border-steel-700 dark:bg-black dark:text-white" />
            </label>
            <Button size="sm" type="submit">Manage capacity</Button>
            {error && <span className="text-xs text-error-500">{error}</span>}
          </form>

          {relevantSlots.length > 0 && (
            <ul className="mt-4 grid gap-2">
               {relevantSlots.map((slot: ReceiverDaySlot) => {
                  const ledger = slotLedger(dataset, slot.id);
                  const isEditing = editingSlotId === slot.id;
                  return (
                    <li key={slot.id} className="flex flex-wrap items-center justify-between bg-white px-3 py-2 text-xs border border-steel-200 rounded dark:bg-[#101913] dark:border-steel-800">
                       {isEditing ? (
                         <form className="flex w-full items-center gap-2" onSubmit={async (e) => {
                           e.preventDefault();
                           await updateCapacityAction(slot.id, Number(editedCapacity));
                           setEditingSlotId(null);
                         }}>
                            <span className="font-medium text-ink-900 dark:text-white">{slot.date}</span>
                            <input type="number" className="h-7 w-20 text-xs rounded-sm border-steel-300 dark:border-steel-700 dark:bg-black dark:text-white" min={ledger?.reserved ?? 0} step="0.1" required value={editedCapacity} onChange={e => setEditedCapacity(e.target.value)} />
                            <Button size="sm" type="submit">Save</Button>
                            <Button size="sm" variant="outline" type="button" onClick={() => setEditingSlotId(null)}>Cancel</Button>
                         </form>
                       ) : (
                         <>
                           <span className="font-medium text-ink-900 dark:text-white">{slot.date}</span>
                           <div className="flex items-center gap-4">
                              <span className="text-steel-600 dark:text-gray-400">{ledger?.available.toFixed(1) ?? "0"}t free / {slot.capacityT.toFixed(1)}t total</span>
                              <button type="button" onClick={() => { setEditingSlotId(slot.id); setEditedCapacity(slot.capacityT.toString()); }} className="text-loop-600 font-semibold hover:underline dark:text-loop-400">Edit</button>
                           </div>
                         </>
                       )}
                    </li>
                  )
               })}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}
