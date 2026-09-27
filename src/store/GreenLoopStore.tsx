import { demoDataset } from "@/domain/demoData";
import {
  dispatchLoad,
  recordDelivery,
  releaseCapacity,
  requestCapacity,
  type DeliveryInput,
} from "@/domain/capacity";
import type { Actor, GreenLoopDataset } from "@/domain/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * GreenLoop demo store — one shared scenario state for every platform page.
 *
 * State IS the domain dataset; all mutations flow through the pure capacity
 * engine, so every page (and the public-site ledger in a later pass) sees the
 * same figures. The seeded dataset encodes the locked 15 t scenario as a
 * completed run; `replayScenario()` performs the same transitions live from a
 * pristine seed on the free 0928 slot, appending a fresh event trail.
 */

const ACTOR_A: Actor = { kind: "contractor", name: "Harrow Road Demolition — site team" };
const ACTOR_B: Actor = { kind: "contractor", name: "Kings Cross Strip-out — site team" };
const ACTOR_RECEIVER: Actor = { kind: "receiver", name: "Riverstone Aggregates — yard office" };

/** The locked story, as seed constants. */
const STORY = {
  receiverId: "R-001",
  freeSlotId: "SL-R1-CONC-0928",
  materialAId: "MP-101",
  materialBId: "MP-102",
} as const;

type RequestCapacityAction = (input: {
  materialId: string;
  receiverId: string;
  slotId: string;
  tonnesT: number;
}) => void;
type CancelBookingAction = (input: { bookingId: string; reason?: string }) => void;
type DispatchAction = (input: { bookingId: string }) => void;
type VerifyAction = (input: { bookingId: string } & Omit<DeliveryInput, "bookingId" | "actor" | "at">) => void;
type ReplayScenario = () => void;

export interface GreenLoopStoreValue {
  dataset: GreenLoopDataset;
  requestCapacityAction: RequestCapacityAction;
  cancelBookingAction: CancelBookingAction;
  dispatchAction: DispatchAction;
  verifyAction: VerifyAction;
  replayScenario: ReplayScenario;
}

const GreenLoopStoreContext = createContext<GreenLoopStoreValue | null>(null);

export function GreenLoopStoreProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<GreenLoopDataset>(() => demoDataset());

  const requestCapacityAction = useCallback<RequestCapacityAction>((input) => {
    setDataset((prev) =>
      requestCapacity(prev, {
        ...input,
        actor: ACTOR_A,
        at: new Date().toISOString(),
      }).dataset,
    );
  }, []);

  const cancelBookingAction = useCallback<CancelBookingAction>((input) => {
    setDataset((prev) =>
      releaseCapacity(prev, {
        bookingId: input.bookingId,
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        actor: ACTOR_A,
        at: new Date().toISOString(),
      }).dataset,
    );
  }, []);

  const dispatchAction = useCallback<DispatchAction>((input) => {
    setDataset((prev) =>
      dispatchLoad(prev, {
        bookingId: input.bookingId,
        actor: ACTOR_B,
        at: new Date().toISOString(),
      }).dataset,
    );
  }, []);

  const verifyAction = useCallback<VerifyAction>((input) => {
    setDataset((prev) =>
      recordDelivery(prev, {
        ...input,
        actor: ACTOR_RECEIVER,
        at: new Date().toISOString(),
      }).dataset,
    );
  }, []);

  /** Stage the locked scenario on the free 0928 slot: A confirms, B holds.
   *  Stops at the HOLD so the cancel→recheck moment stays live in Bookings. */
  const replayScenario = useCallback<ReplayScenario>(() => {
    setDataset(() => {
      const seed = demoDataset();
      const a = requestCapacity(seed, {
        materialId: STORY.materialAId,
        receiverId: STORY.receiverId,
        slotId: STORY.freeSlotId,
        tonnesT: 10,
        actor: ACTOR_A,
        at: new Date().toISOString(),
      });
      const b = requestCapacity(a.dataset, {
        materialId: STORY.materialBId,
        receiverId: STORY.receiverId,
        slotId: STORY.freeSlotId,
        tonnesT: 8,
        actor: ACTOR_B,
        at: new Date().toISOString(),
      });
      return b.dataset;
    });
  }, []);

  const value = useMemo<GreenLoopStoreValue>(
    () => ({
      dataset,
      requestCapacityAction,
      cancelBookingAction,
      dispatchAction,
      verifyAction,
      replayScenario,
    }),
    [dataset, requestCapacityAction, cancelBookingAction, dispatchAction, verifyAction, replayScenario],
  );

  return (
    <GreenLoopStoreContext.Provider value={value}>
      {children}
    </GreenLoopStoreContext.Provider>
  );
}

export function useGreenLoopStore(): GreenLoopStoreValue {
  const ctx = useContext(GreenLoopStoreContext);
  if (!ctx) {
    throw new Error("useGreenLoopStore must be used within GreenLoopStoreProvider");
  }
  return ctx;
}
