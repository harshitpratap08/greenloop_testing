import { demoDataset } from "@/domain/demoData";
import {
  dispatchLoad,
  recordDelivery,
  releaseCapacity,
  requestCapacity,
  type DeliveryInput,
} from "@/domain/capacity";
import type { Actor, GreenLoopDataset, MaterialPassport, DemandRecord, Evidence, VerificationRecord, MaterialOffer } from "@/domain/types";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
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
type AddMaterialAction = (input: Omit<MaterialPassport, "id" | "status" | "surveyedAt">) => MaterialPassport;
type AddDemandAction = (input: Omit<DemandRecord, "id" | "status" | "createdAt" | "receiverId">) => DemandRecord;

export interface GreenLoopStoreValue {
  dataset: GreenLoopDataset;
  requestCapacityAction: RequestCapacityAction;
  cancelBookingAction: CancelBookingAction;
  dispatchAction: DispatchAction;
  verifyAction: VerifyAction;
  replayScenario: ReplayScenario;
  addMaterialAction: AddMaterialAction;
  addDemandAction: AddDemandAction;
  addOfferAction: (offer: Omit<MaterialOffer, "id" | "status" | "createdAt">) => void;
  acceptOfferAction: (offerId: string) => void;
  declineOfferAction: (offerId: string) => void;
  acceptRequestAction: (bookingId: string) => void;
  rejectRequestAction: (bookingId: string) => void;
  rescheduleRequestAction: (bookingId: string, slotId: string) => void;
  receiveLoadAction: (bookingId: string, actualT: number, evidence: Evidence[]) => void;
  verifyLoadAction: (verificationId: string, acceptedT: number, rejectedT: number, rejectReason?: string) => void;
  initializeStore: (demoData: boolean) => void;
}

const GreenLoopStoreContext = createContext<GreenLoopStoreValue | null>(null);

export function GreenLoopStoreProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<GreenLoopDataset>(() => {
    const saved = localStorage.getItem('gl_dataset');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return demoDataset();
      }
    }
    return demoDataset();
  });

  // Persist dataset changes
  useEffect(() => {
    localStorage.setItem('gl_dataset', JSON.stringify(dataset));
  }, [dataset]);

  const initializeStore = useCallback((demoData: boolean) => {
    if (demoData) {
      setDataset(demoDataset());
    } else {
      setDataset({
        materials: [],
        projects: [],
        receivers: [],
        slots: [],
        allocations: [],
        bookings: [],
        verifications: [],
        events: [],
        demands: [],
        offers: []
      });
    }
  }, []);

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

  const addMaterialAction = useCallback<AddMaterialAction>((input) => {
    const newMaterial: MaterialPassport = {
      ...input,
      id: `MP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "surveyed",
      surveyedAt: new Date().toISOString(),
    };
    
    setDataset((prev) => ({
      ...prev,
      materials: [newMaterial, ...prev.materials],
      events: [
        {
          id: `EV-${Math.floor(1000 + Math.random() * 9000)}`,
          at: new Date().toISOString(),
          kind: "material.surveyed",
          actor: ACTOR_A,
          summary: `Surveyed ${newMaterial.quantityT}t of ${newMaterial.type}`,
          subjectIds: [newMaterial.id, newMaterial.projectId]
        },
        ...prev.events
      ]
    }));
    return newMaterial;
  }, []);

  const addDemandAction = useCallback<AddDemandAction>((input) => {
    const newDemand: DemandRecord = {
      ...input,
      id: `DM-${Math.floor(100 + Math.random() * 900)}`,
      receiverId: "R-001", // Defaulting to the demo receiver
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    
    setDataset((prev) => ({
      ...prev,
      demands: [newDemand, ...prev.demands],
    }));
    return newDemand;
  }, []);

  const acceptRequestAction = useCallback((bookingId: string) => {
    setDataset(prev => {
      const b = prev.bookings.find(x => x.id === bookingId);
      if (!b) return prev;
      return {
        ...prev,
        bookings: prev.bookings.map(x => x.id === bookingId ? { ...x, status: "confirmed", holdReason: undefined } : x)
      };
    });
  }, []);

  const rejectRequestAction = useCallback((bookingId: string) => {
    setDataset(prev => {
      return {
        ...prev,
        bookings: prev.bookings.map(x => x.id === bookingId ? { ...x, status: "cancelled", cancelledReason: "Rejected by receiver" } : x)
      };
    });
  }, []);

  const rescheduleRequestAction = useCallback((bookingId: string, slotId: string) => {
    setDataset(prev => {
      return {
        ...prev,
        bookings: prev.bookings.map(x => x.id === bookingId ? { ...x, slotId, status: "confirmed", holdReason: undefined } : x)
      };
    });
  }, []);

  const receiveLoadAction = useCallback((bookingId: string, actualT: number, evidence: Evidence[]) => {
    setDataset(prev => {
      const b = prev.bookings.find(x => x.id === bookingId);
      if (!b) return prev;
      const loadRef = `LOAD-${1000 + prev.verifications.length + 1}`;
      const vr: VerificationRecord = {
        id: `VR-${prev.verifications.length + 1}`,
        bookingId,
        loadRef,
        materialId: b.materialId,
        receiverId: b.receiverId,
        plannedT: b.tonnesT,
        actualT,
        acceptedT: 0,
        rejectedT: 0,
        status: "pending",
        evidence,
        verifiedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        bookings: prev.bookings.map(x => x.id === bookingId ? { ...x, status: "verified" as any } : x),
        verifications: [...prev.verifications, vr]
      };
    });
  }, []);

  const verifyLoadAction = useCallback((verificationId: string, acceptedT: number, rejectedT: number, rejectReason?: string) => {
    setDataset(prev => {
      return {
        ...prev,
        verifications: prev.verifications.map(x => x.id === verificationId ? { 
          ...x, 
          acceptedT, 
          rejectedT, 
          rejectReason, 
          status: rejectedT > 0 && acceptedT === 0 ? "rejected" : "verified" 
        } : x)
      };
    });
  }, []);

  const addOfferAction = useCallback((input: Omit<MaterialOffer, "id" | "status" | "createdAt">) => {
    const newOffer: MaterialOffer = {
      ...input,
      id: `OF-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    setDataset(prev => ({
      ...prev,
      offers: [newOffer, ...(prev.offers || [])]
    }));
  }, []);

  const acceptOfferAction = useCallback((offerId: string) => {
    setDataset(prev => {
      const updatedOffers = (prev.offers || []).map(o => o.id === offerId ? { ...o, status: "accepted" as const } : o);
      const offer = prev.offers?.find(o => o.id === offerId);
      if (!offer) return prev;
      
      const demand = prev.demands.find(d => d.id === offer.demandId);
      const updatedDemands = prev.demands.map(d => {
        if (d.id === offer.demandId) {
          return { ...d, status: "COVERED" as const };
        }
        return d;
      });
      let nextState = { ...prev, offers: updatedOffers, demands: updatedDemands };

      if (demand) {
        // Automatically create booking for the accepted offer to connect to downstream
        // Let's find any suitable slot for this material to place the booking
        const slot = prev.slots.find(s => s.receiverId === demand.receiverId && s.materialType === demand.materialType);
        if (slot) {
          nextState = requestCapacity(nextState, {
            materialId: offer.passportId,
            receiverId: demand.receiverId,
            slotId: slot.id,
            tonnesT: offer.offeredQuantityT,
            actor: ACTOR_RECEIVER,
            at: new Date().toISOString()
          }).dataset;

          // Force the latest booking to be confirmed since it was accepted by the receiver
          const latestBooking = nextState.bookings[nextState.bookings.length - 1];
          if (latestBooking && latestBooking.status !== "confirmed") {
            nextState.bookings = nextState.bookings.map(b => b.id === latestBooking.id ? { ...b, status: "confirmed", holdReason: undefined } : b);
          }
        }
      }

      return nextState;
    });
  }, []);

  const declineOfferAction = useCallback((offerId: string) => {
    setDataset(prev => ({
      ...prev,
      offers: (prev.offers || []).map(o => o.id === offerId ? { ...o, status: "declined" as const } : o)
    }));
  }, []);

  const value = useMemo<GreenLoopStoreValue>(
    () => ({
      dataset,
      requestCapacityAction,
      cancelBookingAction,
      dispatchAction,
      verifyAction,
      replayScenario,
      addMaterialAction,
      addDemandAction,
      addOfferAction,
      acceptOfferAction,
      declineOfferAction,
      acceptRequestAction,
      rejectRequestAction,
      rescheduleRequestAction,
      receiveLoadAction,
      verifyLoadAction,
      initializeStore,
    }),
    [dataset, requestCapacityAction, cancelBookingAction, dispatchAction, verifyAction, replayScenario, addMaterialAction, addDemandAction, addOfferAction, acceptOfferAction, declineOfferAction, acceptRequestAction, rejectRequestAction, rescheduleRequestAction, receiveLoadAction, verifyLoadAction, initializeStore],
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
