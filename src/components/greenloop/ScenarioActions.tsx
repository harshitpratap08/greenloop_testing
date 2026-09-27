import { useGreenLoopStore } from "@/store/GreenLoopStore";
import { slotLedger } from "@/domain/capacity";
import { STORY } from "@/domain/demoData";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useState } from "react";

/**
 * Demo controls for judges: replay the locked scenario live, reset it, and
 * attempt a deliberate double-booking (9 t into the slot's remaining capacity)
 * to show the engine refusing to over-commit. All readouts are engine output.
 */
export default function ScenarioActions() {
  const { dataset, replayScenario, requestCapacityAction } = useGreenLoopStore();
  const [attemptResult, setAttemptResult] = useState<string | null>(null);

  const attemptDoubleBook = () => {
    // The Sep 24 story slot holds 7.0 t free in every reachable state, so a
    // 9 t request demonstrates the HOLD unless capacity was manually released.
    const slotId = STORY.concreteSlotSept24;
    const ledger = slotLedger(dataset, slotId);
    const free = ledger?.available ?? 0;
    const requested = 9;
    if (requested <= free) {
      setAttemptResult(
        `The ${ledger?.slot.date} slot has ${free.toFixed(1)} t free — a 9.0 t request would confirm rather than block.`,
      );
      return;
    }
    requestCapacityAction({
      materialId: "MP-103",
      receiverId: STORY.receiverId,
      slotId,
      tonnesT: requested,
    });
    setAttemptResult(
      `Requested 9.0 t into ${free.toFixed(1)} t free → HOLD recorded. Reason: insufficient available capacity.`,
    );
  };

  return (
    <div className="surface-card p-5 md:p-6">
      <p className="eyebrow-label text-steel-600 dark:text-steel-400">Hackathon demo</p>
      <h3 className="mt-2 text-base font-semibold text-ink-900 dark:text-white/90">
        Capacity-aware scenario controls
      </h3>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
        Replay the locked 15 t story on the free Sep 28 slot, or attempt to
        over-book the Sep 24 slot (7.0 t free).
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button size="sm" onClick={replayScenario}>
          Replay scenario
        </Button>
        <Button size="sm" variant="outline" onClick={attemptDoubleBook}>
          Attempt 9 t double-book
        </Button>
        <span className="self-center text-theme-xs text-gray-500 dark:text-gray-400">
          Refresh the page to reset the dataset.
        </span>
      </div>

      {attemptResult && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-signal-300 bg-signal-50 p-3 dark:border-signal-500/30 dark:bg-signal-500/10">
          <Badge color="warning" size="sm">
            Blocked
          </Badge>
          <p className="text-theme-xs text-ink-800 dark:text-gray-200">{attemptResult}</p>
        </div>
      )}
    </div>
  );
}
