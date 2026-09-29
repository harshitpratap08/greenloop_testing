import PageMeta from "@/components/common/PageMeta";
import { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { slotLedger } from "@/domain/capacity";
import { motion } from "motion/react";
import { cn } from "@/utils";
import Button from "@/components/ui/button/Button";
import type { MaterialTypeKey } from "@/domain/types";
import { useAuth } from "@/context/AuthContext";

export default function Capacity() {
  const { dataset, addCapacityAction, updateCapacityAction } = useGreenLoopStore();
  const { user } = useAuth();
  const receiverId = user?.receiverId ?? "R-001";
  const [isAdding, setIsAdding] = useState(false);
  const [materialType, setMaterialType] = useState<MaterialTypeKey>("concrete");
  const [date, setDate] = useState("");
  const [capacityT, setCapacityT] = useState("");
  const [formError, setFormError] = useState("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editedCapacity, setEditedCapacity] = useState("");
  const [editError, setEditError] = useState("");

  const handleAddCapacity = (event: React.FormEvent<HTMLFormElement>) => {
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
    addCapacityAction({ receiverId, date, materialType, capacityT: capacity });
    setDate("");
    setCapacityT("");
    setIsAdding(false);
    setFormError("");
  };
  
  const slots = dataset.slots
    .filter(s => s.receiverId === receiverId)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="relative min-h-screen pb-24">
      <PageMeta title="Capacity | GreenLoop" description="Manage receiver capacity." />
      <PageBreadcrumb pageTitle="Capacity" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-8 border-b border-steel-200 pb-6 dark:border-steel-800"
      >
        <p className="eyebrow-label text-loop-600 dark:text-loop-400">Receiver Operations</p>
        <h1 className="mt-2 font-archivo text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">
          Site Capacity
        </h1>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-2xl text-lg text-steel-600 dark:text-gray-400">
            Manage your processing capacity limits per material to ensure you don't overbook incoming deliveries.
          </p>
          <Button size="md" onClick={() => setIsAdding((open) => !open)}>{isAdding ? "Close" : "Add Capacity"}</Button>
        </div>
      </motion.header>

      {isAdding && (
        <form onSubmit={handleAddCapacity} className="mb-6 grid gap-4 rounded-sm border border-steel-200 bg-white p-6 shadow-sm sm:grid-cols-4 dark:border-steel-800 dark:bg-white/[0.02]">
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
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-sm border border-dashed border-steel-300 bg-steel-50/50 p-8 text-center dark:border-steel-800 dark:bg-white/[0.01]">
          <h2 className="font-archivo text-xl font-bold text-ink-900 dark:text-white">No capacity registered</h2>
          <p className="mt-2 max-w-md text-steel-600 dark:text-gray-400">
            Define daily or weekly intake limits per material.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot, i) => {
            const ledger = slotLedger(dataset, slot.id);
            if (!ledger) return null;
            
            const { available, reserved, slot: s } = ledger;
            const percent = Math.min(100, (reserved / s.capacityT) * 100);

            return (
              <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={slot.id}
                className="flex flex-col justify-between rounded-sm border border-steel-200 bg-white p-6 shadow-sm dark:border-steel-800 dark:bg-white/[0.02]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-steel-500 dark:text-steel-400">
                        {s.date}
                      </p>
                      <h3 className="mt-1 font-archivo text-xl font-bold capitalize text-ink-900 dark:text-white">
                        {s.materialType}
                      </h3>
                    </div>
                    {available === 0 ? (
                      <span className="rounded bg-signal-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-signal-700 dark:bg-signal-900/30 dark:text-signal-400">
                        FULL
                      </span>
                    ) : reserved > 0 ? (
                      <span className="rounded bg-loop-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-loop-700 dark:bg-loop-900/30 dark:text-loop-400">
                        PARTIAL
                      </span>
                    ) : (
                      <span className="rounded bg-steel-100 px-2 py-1 text-xs font-bold uppercase tracking-wider text-steel-700 dark:bg-white/10 dark:text-steel-300">
                        AVAILABLE
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-steel-100 pt-4 dark:border-steel-800">
                    <div>
                      <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Total Capacity</p>
                      <p className="ledger-numeral mt-1 text-lg font-bold text-ink-900 dark:text-white">
                        {s.capacityT.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-steel-500 dark:text-gray-400">Available</p>
                      <p className={cn("ledger-numeral mt-1 text-lg font-bold", available > 0 ? "text-loop-600 dark:text-loop-400" : "text-signal-600 dark:text-signal-400")}>
                        {available.toFixed(1)} <span className="text-sm text-steel-500">t</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-steel-100 pt-4 dark:border-steel-800">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-steel-600 dark:text-gray-400">{reserved.toFixed(1)} t reserved</span>
                    <span className="text-steel-500">{percent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-800">
                    <div 
                      className={cn("h-full", percent === 100 ? "bg-signal-500" : "bg-loop-500")} 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                  <p className="mt-4 text-xs text-steel-400">Slot ID: {s.id}</p>
                  {editingSlotId === s.id ? (
                    <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={(event) => {
                      event.preventDefault();
                      if (!updateCapacityAction(s.id, Number(editedCapacity))) {
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
                  ) : <button type="button" onClick={() => { setEditingSlotId(s.id); setEditedCapacity(s.capacityT.toString()); setEditError(""); }} className="mt-3 text-xs font-semibold text-loop-600 underline dark:text-loop-400">Replan capacity</button>}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}
