import {
  availableT,
  slotMatchesDemandPeriod,
  dispatchLoad,
  recordDelivery,
  releaseCapacity,
  recheckHolds,
  requestCapacity,
  type DeliveryInput,
} from "@/domain/capacity";
import { demoDataset } from "@/domain/demoData";
import type {
  Actor,
  Booking,
  DemandRecord,
  DomainEvent,
  Evidence,
  GreenLoopDataset,
  MaterialOffer,
  MaterialPassport,
  Project,
  ReceiverDaySlot,
  SupportRequest,
  VerificationRecord,
} from "@/domain/types";
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
 * State is the domain dataset; actions keep the transaction, capacity ledger,
 * and event trail in sync for provider and receiver workflows.
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
type AddDemandInput = Omit<DemandRecord, "id" | "status" | "createdAt" | "receiverId"> & { receiverId?: string };
type AddDemandAction = (input: AddDemandInput) => DemandRecord;
type AddProjectAction = (input: Pick<Project, "name" | "location" | "status">) => Project;
type AddCapacityAction = (input: Omit<ReceiverDaySlot, "id">) => ReceiverDaySlot;
type UpdateCapacityAction = (slotId: string, capacityT: number) => boolean;

export interface GreenLoopStoreValue {
  dataset: GreenLoopDataset;
  requestCapacityAction: RequestCapacityAction;
  cancelBookingAction: CancelBookingAction;
  dispatchAction: DispatchAction;
  verifyAction: VerifyAction;
  replayScenario: ReplayScenario;
  addMaterialAction: AddMaterialAction;
  addDemandAction: AddDemandAction;
  addProjectAction: AddProjectAction;
  addCapacityAction: AddCapacityAction;
  updateCapacityAction: UpdateCapacityAction;
  addSupportRequestAction: (input: Omit<SupportRequest, "id" | "submittedAt">) => SupportRequest;
  addOfferAction: (offer: Omit<MaterialOffer, "id" | "status" | "createdAt">) => void;
  acceptOfferAction: (offerId: string) => void;
  declineOfferAction: (offerId: string) => void;
  acceptRequestAction: (bookingId: string, acceptedT?: number) => void;
  rejectRequestAction: (bookingId: string) => void;
  rescheduleRequestAction: (bookingId: string, slotId: string) => void;
  receiveLoadAction: (bookingId: string, actualT: number, evidence: Evidence[]) => void;
  verifyLoadAction: (verificationId: string, acceptedT: number, rejectedT: number, rejectReason?: string) => void;
  initializeStore: (demoData: boolean) => void;
}

const GreenLoopStoreContext = createContext<GreenLoopStoreValue | null>(null);

function nextId(prefix: string, existing: Array<{ id: string }>, padding = 0): string {
  const numericIds = existing
    .map((item) => Number(item.id.replace(`${prefix}-`, "")))
    .filter(Number.isFinite);
  const next = Math.max(existing.length, ...numericIds, 0) + 1;
  return `${prefix}-${padding ? String(next).padStart(padding, "0") : next}`;
}

function eventFor(
  dataset: GreenLoopDataset,
  kind: string,
  actor: Actor,
  summary: string,
  subjectIds: string[],
  detail?: string,
  at = new Date().toISOString(),
): DomainEvent {
  return {
    id: nextId("EV", dataset.events, 3),
    at,
    kind,
    actor,
    summary,
    ...(detail ? { detail } : {}),
    subjectIds,
  };
}

function updateDemandCoverage(dataset: GreenLoopDataset, demandId: string): GreenLoopDataset {
  const demand = dataset.demands.find((item) => item.id === demandId);
  if (!demand || demand.status === "PAUSED") return dataset;
  const coveredT = dataset.bookings
    .filter((booking) => booking.demandId === demandId && booking.status === "confirmed")
    .reduce((total, booking) => total + booking.tonnesT, 0);
  const status = coveredT <= 0
    ? "OPEN"
    : coveredT + 1e-9 >= demand.requiredT
      ? "COVERED"
      : "PARTIALLY_COVERED";
  return {
    ...dataset,
    demands: dataset.demands.map((item) => item.id === demandId ? { ...item, status } : item),
  };
}

function syncDemandCoverage(dataset: GreenLoopDataset): GreenLoopDataset {
  return dataset.demands.reduce((current, demand) => updateDemandCoverage(current, demand.id), dataset);
}

export function GreenLoopStoreProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<GreenLoopDataset>(() => {
    const saved = localStorage.getItem("gl_dataset");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return demoDataset();
      }
    }
    return demoDataset();
  });

  useEffect(() => {
    localStorage.setItem("gl_dataset", JSON.stringify(dataset));
  }, [dataset]);

  const initializeStore = useCallback((demoData: boolean) => {
    if (demoData) {
      setDataset(demoDataset());
    } else {
      const seed = demoDataset();
      setDataset({
        materials: [],
        projects: [],
        receivers: seed.receivers,
        slots: [],
        allocations: [],
        bookings: [],
        verifications: [],
        events: [],
        demands: [],
        offers: [],
      });
    }
  }, []);

  const requestCapacityAction = useCallback<RequestCapacityAction>((input) => {
    setDataset((prev) => {
      const material = prev.materials.find((item) => item.id === input.materialId);
      if (!material) return prev;
      const committedT = prev.bookings
        .filter((booking) => booking.materialId === input.materialId && booking.status !== "cancelled")
        .reduce((total, booking) => total + booking.tonnesT, 0);
      if (input.tonnesT > material.quantityT - committedT + 1e-9) return prev;
      return requestCapacity(prev, {
        ...input,
        actor: ACTOR_A,
        at: new Date().toISOString(),
      }).dataset;
    });
  }, []);

  const cancelBookingAction = useCallback<CancelBookingAction>((input) => {
    setDataset((prev) => {
      const released = releaseCapacity(prev, {
        bookingId: input.bookingId,
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        actor: ACTOR_A,
        at: new Date().toISOString(),
      }).dataset;
      return syncDemandCoverage(released);
    });
  }, []);

  const dispatchAction = useCallback<DispatchAction>((input) => {
    setDataset((prev) => dispatchLoad(prev, {
      bookingId: input.bookingId,
      actor: ACTOR_B,
      at: new Date().toISOString(),
    }).dataset);
  }, []);

  const verifyAction = useCallback<VerifyAction>((input) => {
    setDataset((prev) => recordDelivery(prev, {
      ...input,
      actor: ACTOR_RECEIVER,
      at: new Date().toISOString(),
    }).dataset);
  }, []);

  /** Stage the locked scenario on the free 0928 slot: A confirms, B holds. */
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
      id: `MP-${Math.max(1000, ...dataset.materials.map((item) => Number(item.id.replace("MP-", "")) || 0)) + 1}`,
      status: "surveyed",
      surveyedAt: new Date().toISOString(),
    };
    setDataset((prev) => {
      const at = new Date().toISOString();
      const event = eventFor(prev, "material.surveyed", ACTOR_A,
        `Surveyed ${newMaterial.quantityT} t of ${newMaterial.type}`,
        [newMaterial.id, newMaterial.projectId], undefined, at);
      return { ...prev, materials: [newMaterial, ...prev.materials], events: [...prev.events, event] };
    });
    return newMaterial;
  }, [dataset.materials]);

  const addDemandAction = useCallback<AddDemandAction>((input) => {
    const newDemand: DemandRecord = {
      ...input,
      id: nextId("DM", dataset.demands, 3),
      receiverId: input.receiverId ?? STORY.receiverId,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    };
    setDataset((prev) => {
      const event = eventFor(prev, "demand.created", ACTOR_RECEIVER,
        `${newDemand.requiredT.toFixed(1)} t of ${newDemand.materialType} demand published`,
        [newDemand.id, newDemand.receiverId]);
      return { ...prev, demands: [newDemand, ...prev.demands], events: [...prev.events, event] };
    });
    return newDemand;
  }, [dataset.demands]);

  const addProjectAction = useCallback<AddProjectAction>((input) => {
    const at = new Date().toISOString();
    const newProject: Project = {
      ...input,
      id: nextId("PR", dataset.projects, 2),
      surveyedAt: at,
      lastActivityAt: at,
    };
    setDataset((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
      events: [...prev.events, eventFor(prev, "project.created", ACTOR_A,
        `Project created — ${newProject.name}`, [newProject.id], undefined, at)],
    }));
    return newProject;
  }, [dataset.projects]);

  const updateCapacityAction = useCallback<UpdateCapacityAction>((slotId, capacityT) => {
    const slot = dataset.slots.find((item) => item.id === slotId);
    if (!slot || !Number.isFinite(capacityT) || capacityT <= 0) return false;
    const reserved = dataset.bookings.filter((booking) => booking.slotId === slotId && booking.status === "confirmed")
      .reduce((total, booking) => total + booking.tonnesT, 0);
    if (capacityT < reserved) return false;
    setDataset((prev) => {
      const current = prev.slots.find((item) => item.id === slotId);
      if (!current) return prev;
      const at = new Date().toISOString();
      const updated: GreenLoopDataset = {
        ...prev,
        slots: prev.slots.map((item) => item.id === slotId ? { ...item, capacityT } : item),
        events: [...prev.events, eventFor(prev, "capacity.replanned", ACTOR_RECEIVER,
          `${slot.materialType} capacity for ${slot.date} changed to ${capacityT.toFixed(1)} t`, [slot.id, slot.receiverId], undefined, at)],
      };
      return capacityT > current.capacityT
        ? syncDemandCoverage(recheckHolds(updated, { slotId, actor: ACTOR_RECEIVER, at }).dataset)
        : updated;
    });
    return true;
  }, [dataset.slots, dataset.bookings]);

  const addSupportRequestAction = useCallback((input: Omit<SupportRequest, "id" | "submittedAt">) => {
    const request: SupportRequest = { ...input, id: nextId("SUP", dataset.supportRequests ?? []), submittedAt: new Date().toISOString() };
    setDataset((prev) => ({
      ...prev,
      supportRequests: [request, ...(prev.supportRequests ?? [])],
      events: [...prev.events, eventFor(prev, "support.submitted", { kind: "system", name: request.email }, "Support request submitted", [request.id])],
    }));
    return request;
  }, [dataset.supportRequests]);

  const addCapacityAction = useCallback<AddCapacityAction>((input) => {
    const at = new Date().toISOString();
    const slot: ReceiverDaySlot = { ...input, id: nextId("SL", dataset.slots) };
    setDataset((prev) => ({
      ...prev,
      slots: [...prev.slots, slot],
      receivers: prev.receivers.map((receiver) => receiver.id === slot.receiverId && !receiver.acceptedTypes.includes(slot.materialType)
        ? { ...receiver, acceptedTypes: [...receiver.acceptedTypes, slot.materialType] }
        : receiver),
      events: [...prev.events, eventFor(prev, "capacity.slot.created", ACTOR_RECEIVER,
        `${slot.capacityT.toFixed(1)} t ${slot.materialType} capacity opened for ${slot.date}`,
        [slot.id, slot.receiverId], undefined, at)],
    }));
    return slot;
  }, [dataset.slots]);

  const acceptRequestAction = useCallback((bookingId: string, requestedAcceptedT?: number) => {
    setDataset((prev) => {
      const booking = prev.bookings.find((item) => item.id === bookingId);
      if (!booking || (booking.status !== "hold" && booking.status !== "confirmed") || booking.receiverAcceptedAt) return prev;
      const at = new Date().toISOString();
      if (booking.status === "confirmed") {
        const event = eventFor(prev, "request.accepted", ACTOR_RECEIVER,
          `Receiver accepted ${booking.tonnesT.toFixed(1)} t request`,
          [booking.materialId, booking.receiverId, booking.allocationId, booking.id], undefined, at);
        return {
          ...prev,
          bookings: prev.bookings.map((item) => item.id === bookingId ? { ...item, receiverAcceptedAt: at, updatedAt: at } : item),
          events: [...prev.events, event],
        };
      }
      const slot = prev.slots.find((item) => item.id === booking.slotId);
      const material = prev.materials.find((item) => item.id === booking.materialId);
      if (!slot || !material || slot.receiverId !== booking.receiverId || slot.materialType !== material.type) return prev;
      const before = availableT(slot, prev.bookings);
      const committedMaterialT = prev.bookings.filter((item) => item.id !== bookingId && item.materialId === booking.materialId && item.status !== "cancelled")
        .reduce((total, item) => total + item.tonnesT, 0);
      const materialRemainingT = Math.max(0, material.quantityT - committedMaterialT);
      const demand = booking.demandId ? prev.demands.find((item) => item.id === booking.demandId) : undefined;
      const committedDemandT = booking.demandId ? prev.bookings.filter((item) => item.id !== bookingId && item.demandId === booking.demandId && item.status !== "cancelled")
        .reduce((total, item) => total + item.tonnesT, 0) : 0;
      const demandRemainingT = demand ? Math.max(0, demand.requiredT - committedDemandT) : Infinity;
      const maximumAcceptableT = Math.min(before, materialRemainingT, demandRemainingT);
      const acceptedT = Math.min(booking.tonnesT, requestedAcceptedT ?? booking.tonnesT);
      if (!Number.isFinite(acceptedT) || acceptedT <= 0 || acceptedT > maximumAcceptableT + 1e-9) return prev;
      if (acceptedT < booking.tonnesT) {
        const remainingT = Math.round((booking.tonnesT - acceptedT) * 10) / 10;
        const allocation = prev.allocations.find((item) => item.id === booking.allocationId);
        if (!allocation) return prev;
        const allocationId = nextId("AL", prev.allocations);
        const confirmedAllocation = { ...allocation, id: allocationId, requestedT: acceptedT, status: "confirmed" as const, holdReason: undefined, capacityBeforeT: before, capacityAfterT: Math.max(0, Math.round((before - acceptedT) * 10) / 10), decidedAt: at, updatedAt: at };
        const confirmedBooking = { ...booking, id: nextId("BK", prev.bookings), allocationId, tonnesT: acceptedT, status: "confirmed" as const, holdReason: undefined, receiverAcceptedAt: at, capacityBeforeT: before, capacityAfterT: confirmedAllocation.capacityAfterT, createdAt: at, updatedAt: at };
        const next: GreenLoopDataset = {
          ...prev,
          allocations: [...prev.allocations.map((item) => item.id === allocation.id ? { ...item, status: "cancelled" as const, updatedAt: at } : item), confirmedAllocation],
          bookings: [...prev.bookings.map((item) => item.id === bookingId ? { ...item, status: "cancelled" as const, cancelledAt: at, cancelledReason: `Receiver confirmed ${acceptedT.toFixed(1)} t; ${remainingT.toFixed(1)} t remains available to book elsewhere`, updatedAt: at } : item), confirmedBooking],
          materials: prev.materials.map((item) => item.id === booking.materialId ? { ...item, status: "reserved" } : item),
          events: [...prev.events, eventFor(prev, "request.partially-accepted", ACTOR_RECEIVER,
            `Receiver confirmed ${acceptedT.toFixed(1)} t; ${remainingT.toFixed(1)} t remains available to book elsewhere`,
            [booking.materialId, booking.receiverId, booking.allocationId, booking.id, allocationId, confirmedBooking.id], undefined, at)],
        };
        return booking.demandId ? updateDemandCoverage(next, booking.demandId) : next;
      }
      if (booking.tonnesT > before + 1e-9) return prev;
      const after = Math.max(0, Math.round((before - booking.tonnesT) * 10) / 10);
      let next: GreenLoopDataset = {
        ...prev,
        bookings: prev.bookings.map((item) => item.id === bookingId
          ? { ...item, status: "confirmed", receiverAcceptedAt: at, holdReason: undefined, capacityBeforeT: before, capacityAfterT: after, updatedAt: at }
          : item),
        allocations: prev.allocations.map((item) => item.id === booking.allocationId
          ? { ...item, status: "confirmed", holdReason: undefined, capacityBeforeT: before, capacityAfterT: after, updatedAt: at }
          : item),
        materials: prev.materials.map((item) => item.id === booking.materialId ? { ...item, status: "reserved" } : item),
      };
      next = {
        ...next,
        events: [...next.events, eventFor(prev, "allocation.confirmed", ACTOR_RECEIVER,
          `Receiver accepted ${booking.tonnesT.toFixed(1)} t request`,
          [booking.materialId, booking.receiverId, booking.allocationId, booking.id], undefined, at)],
      };
      return booking.demandId ? updateDemandCoverage(next, booking.demandId) : next;
    });
  }, []);

  const rejectRequestAction = useCallback((bookingId: string) => {
    setDataset((prev) => {
      const booking = prev.bookings.find((item) => item.id === bookingId);
      if (!booking || (booking.status !== "hold" && booking.status !== "confirmed")) return prev;
      const at = new Date().toISOString();
      if (booking.status === "confirmed") {
        const released = releaseCapacity(prev, {
          bookingId,
          reason: "Rejected by receiver",
          actor: ACTOR_RECEIVER,
          at,
        }).dataset;
        return syncDemandCoverage(released);
      }
      let next: GreenLoopDataset = {
        ...prev,
        bookings: prev.bookings.map((item) => item.id === bookingId
          ? { ...item, status: "cancelled", cancelledAt: at, cancelledReason: "Rejected by receiver", updatedAt: at }
          : item),
        allocations: prev.allocations.map((item) => item.id === booking.allocationId
          ? { ...item, status: "cancelled", updatedAt: at }
          : item),
        events: [...prev.events, eventFor(prev, "allocation.rejected", ACTOR_RECEIVER,
          `Receiver rejected request for ${booking.tonnesT.toFixed(1)} t`,
          [booking.materialId, booking.receiverId, booking.allocationId, booking.id], undefined, at)],
      };
      if (!next.bookings.some((item) => item.materialId === booking.materialId && item.status === "confirmed")) {
        next = { ...next, materials: next.materials.map((item) => item.id === booking.materialId && item.status !== "verified" && item.status !== "dispatched" ? { ...item, status: "passport-ready" } : item) };
      }
      return booking.demandId ? updateDemandCoverage(next, booking.demandId) : next;
    });
  }, []);

  const rescheduleRequestAction = useCallback((bookingId: string, slotId: string) => {
    setDataset((prev) => {
      const booking = prev.bookings.find((item) => item.id === bookingId);
      const target = prev.slots.find((item) => item.id === slotId);
      const material = booking && prev.materials.find((item) => item.id === booking.materialId);
      const demand = booking?.demandId ? prev.demands.find((item) => item.id === booking.demandId) : undefined;
      if (!booking || booking.status !== "hold" || !target || !material ||
        target.receiverId !== booking.receiverId || target.materialType !== material.type ||
        demand && !slotMatchesDemandPeriod(target, demand.period)) return prev;
      const before = availableT(target, prev.bookings);
      const committedMaterialT = prev.bookings.filter((item) => item.id !== bookingId && item.materialId === booking.materialId && item.status !== "cancelled")
        .reduce((total, item) => total + item.tonnesT, 0);
      const materialRemainingT = Math.max(0, material.quantityT - committedMaterialT);
      const committedDemandT = booking.demandId ? prev.bookings.filter((item) => item.id !== bookingId && item.demandId === booking.demandId && item.status !== "cancelled")
        .reduce((total, item) => total + item.tonnesT, 0) : 0;
      const demandRemainingT = demand ? Math.max(0, demand.requiredT - committedDemandT) : Infinity;
      const at = new Date().toISOString();
      if (booking.tonnesT > before + 1e-9 || booking.tonnesT > materialRemainingT + 1e-9 || booking.tonnesT > demandRemainingT + 1e-9) {
        const event = eventFor(prev, "allocation.reschedule.hold", ACTOR_RECEIVER,
          `Reschedule unavailable — ${booking.tonnesT.toFixed(1)} t does not fit in ${target.date}`,
          [booking.materialId, booking.receiverId, booking.id, target.id], undefined, at);
        return { ...prev, events: [...prev.events, event] };
      }
      const after = Math.max(0, Math.round((before - booking.tonnesT) * 10) / 10);
      const next: GreenLoopDataset = {
        ...prev,
        bookings: prev.bookings.map((item) => item.id === bookingId
          ? { ...item, slotId: target.id, status: "confirmed", holdReason: undefined, capacityBeforeT: before, capacityAfterT: after, updatedAt: at }
          : item),
        allocations: prev.allocations.map((item) => item.id === booking.allocationId
          ? { ...item, slotId: target.id, status: "confirmed", holdReason: undefined, capacityBeforeT: before, capacityAfterT: after, updatedAt: at }
          : item),
        materials: prev.materials.map((item) => item.id === booking.materialId ? { ...item, status: "reserved" } : item),
        events: [...prev.events, eventFor(prev, "allocation.rescheduled", ACTOR_RECEIVER,
          `${booking.tonnesT.toFixed(1)} t request rescheduled to ${target.date}`,
          [booking.materialId, booking.receiverId, booking.allocationId, booking.id, target.id], undefined, at)],
      };
      return syncDemandCoverage(next);
    });
  }, []);

  const receiveLoadAction = useCallback((bookingId: string, actualT: number, evidence: Evidence[]) => {
    setDataset((prev) => {
      const booking = prev.bookings.find((item) => item.id === bookingId);
      if (!booking || booking.status !== "confirmed" || !booking.loadRef ||
        !prev.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id)) ||
        prev.verifications.some((item) => item.bookingId === bookingId)) return prev;
      const at = new Date().toISOString();
      const evidenceList = evidence.some((item) => item.kind === "weighbridge-ticket")
        ? evidence
        : [...evidence, { kind: "weighbridge-ticket" as const, label: `Weighbridge receipt ${booking.loadRef}`, ref: booking.loadRef, recordedAt: at }];
      const verification: VerificationRecord = {
        id: nextId("VR", prev.verifications),
        bookingId,
        loadRef: booking.loadRef,
        materialId: booking.materialId,
        receiverId: booking.receiverId,
        plannedT: booking.tonnesT,
        actualT: Math.max(0, actualT),
        acceptedT: 0,
        rejectedT: 0,
        status: "pending",
        evidence: evidenceList,
      };
      const event = eventFor(prev, "delivery.received", ACTOR_RECEIVER,
        `${booking.loadRef} received — ${verification.actualT.toFixed(1)} t weighed; verification pending`,
        [booking.materialId, booking.receiverId, booking.id, verification.id], undefined, at);
      return { ...prev, verifications: [...prev.verifications, verification], events: [...prev.events, event] };
    });
  }, []);

  const verifyLoadAction = useCallback((verificationId: string, acceptedT: number, rejectedT: number, rejectReason?: string) => {
    setDataset((prev) => {
      const record = prev.verifications.find((item) => item.id === verificationId);
      if (!record || record.status !== "pending") return prev;
      const at = new Date().toISOString();
      const accepted = Math.max(0, Math.min(record.actualT, acceptedT));
      const rejected = Math.max(0, Math.min(record.actualT - accepted, rejectedT));
      const status = rejected > 0 && accepted === 0 ? "rejected" : "verified";
      const booking = prev.bookings.find((item) => item.id === record.bookingId);
      const updated: VerificationRecord = {
        ...record,
        acceptedT: accepted,
        rejectedT: rejected,
        ...(rejectReason ? { rejectReason } : {}),
        status,
        verifiedAt: at,
      };
      const event = eventFor(prev, status === "verified" ? "verification.completed" : "verification.rejected",
        ACTOR_RECEIVER,
        `${record.loadRef} ${status} — accepted ${accepted.toFixed(1)} t`,
        [record.materialId, record.receiverId, record.bookingId, record.id],
        rejected > 0 ? `${rejected.toFixed(1)} t rejected${rejectReason ? `: ${rejectReason}` : ""}` : undefined,
        at);
      const next: GreenLoopDataset = {
        ...prev,
        verifications: prev.verifications.map((item) => item.id === verificationId ? updated : item),
        materials: prev.materials.map((item) => item.id === record.materialId ? { ...item, status: "verified" } : item),
        events: [...prev.events, event],
      };
      return booking?.demandId ? updateDemandCoverage(next, booking.demandId) : next;
    });
  }, []);

  const addOfferAction = useCallback((input: Omit<MaterialOffer, "id" | "status" | "createdAt">) => {
    const newOffer: MaterialOffer = {
      ...input,
      id: nextId("OF", dataset.offers ?? [], 4),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setDataset((prev) => ({
      ...prev,
      offers: [newOffer, ...(prev.offers ?? [])],
      events: [...prev.events, eventFor(prev, "offer.created", ACTOR_A,
        `${newOffer.offeredQuantityT.toFixed(1)} t provider offer submitted`,
        [newOffer.id, newOffer.demandId, newOffer.passportId])],
    }));
  }, [dataset.offers]);

  const acceptOfferAction = useCallback((offerId: string) => {
    setDataset((prev) => {
      const offers = prev.offers ?? [];
      const offer = offers.find((item) => item.id === offerId);
      if (!offer || offer.status !== "pending") return prev;
      const demand = prev.demands.find((item) => item.id === offer.demandId);
      const material = prev.materials.find((item) => item.id === offer.passportId);
      if (!demand || !material || material.type !== demand.materialType || demand.status === "PAUSED") return prev;
      const eligibleSlots = prev.slots
        .filter((item) => item.receiverId === demand.receiverId && item.materialType === demand.materialType && slotMatchesDemandPeriod(item, demand.period))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (!eligibleSlots.length) return prev;

      const at = new Date().toISOString();
      const committedMaterialT = prev.bookings.filter((booking) => booking.materialId === material.id && booking.status !== "cancelled")
        .reduce((total, booking) => total + booking.tonnesT, 0);
      const committedDemandT = prev.bookings.filter((booking) => booking.demandId === demand.id && booking.status !== "cancelled")
        .reduce((total, booking) => total + booking.tonnesT, 0);
      const materialAvailableT = Math.max(0, material.quantityT - committedMaterialT);
      const demandRemainingT = Math.max(0, demand.requiredT - committedDemandT);
      const requested = offer.offeredQuantityT;
      if (requested > materialAvailableT || requested > demandRemainingT) return prev;
      const slot = eligibleSlots.find((item) => availableT(item, prev.bookings) >= requested) ?? eligibleSlots[0];
      const capacityResult = requestCapacity(prev, {
        materialId: material.id,
        receiverId: demand.receiverId,
        slotId: slot.id,
        tonnesT: requested,
        actor: ACTOR_RECEIVER,
        at,
      });
      const createdBooking = capacityResult.output.booking;
      const acceptedBooking: Booking = { ...createdBooking, demandId: demand.id, receiverAcceptedAt: at };
      const attachedDataset: GreenLoopDataset = {
        ...capacityResult.dataset,
        bookings: capacityResult.dataset.bookings.map((item) => item.id === createdBooking.id ? acceptedBooking : item),
        offers: offers.map((item) => item.id === offerId ? { ...item, status: "accepted" } : item),
        events: capacityResult.dataset.events.map((event) =>
          event.subjectIds.includes(createdBooking.id)
            ? { ...event, subjectIds: [...event.subjectIds, demand.id, offer.id] }
            : event),
      };
      const event = eventFor(attachedDataset, "offer.accepted", ACTOR_RECEIVER,
        `Provider offer accepted — ${requested.toFixed(1)} t ${material.type}; capacity ${capacityResult.output.outcome}`,
        [offer.id, demand.id, material.id, acceptedBooking.id, slot.id], undefined, at);
      let next = { ...attachedDataset, events: [...attachedDataset.events, event] };
      next = updateDemandCoverage(next, demand.id);
      return next;
    });
  }, []);

  const declineOfferAction = useCallback((offerId: string) => {
    setDataset((prev) => {
      const offer = prev.offers?.find((item) => item.id === offerId);
      if (!offer || offer.status !== "pending") return prev;
      const event = eventFor(prev, "offer.declined", ACTOR_RECEIVER, "Provider offer declined", [offer.id, offer.demandId, offer.passportId]);
      return {
        ...prev,
        offers: (prev.offers ?? []).map((item) => item.id === offerId ? { ...item, status: "declined" } : item),
        events: [...prev.events, event],
      };
    });
  }, []);

  const value = useMemo<GreenLoopStoreValue>(() => ({
    dataset,
    requestCapacityAction,
    cancelBookingAction,
    dispatchAction,
    verifyAction,
    replayScenario,
    addMaterialAction,
    addDemandAction,
    addProjectAction,
    addCapacityAction,
    updateCapacityAction,
    addSupportRequestAction,
    addOfferAction,
    acceptOfferAction,
    declineOfferAction,
    acceptRequestAction,
    rejectRequestAction,
    rescheduleRequestAction,
    receiveLoadAction,
    verifyLoadAction,
    initializeStore,
  }), [dataset, requestCapacityAction, cancelBookingAction, dispatchAction, verifyAction, replayScenario,
    addMaterialAction, addDemandAction, addProjectAction, addCapacityAction, updateCapacityAction, addSupportRequestAction, addOfferAction, acceptOfferAction,
    declineOfferAction, acceptRequestAction, rejectRequestAction, rescheduleRequestAction, receiveLoadAction,
    verifyLoadAction, initializeStore]);

  return <GreenLoopStoreContext.Provider value={value}>{children}</GreenLoopStoreContext.Provider>;
}

export function useGreenLoopStore(): GreenLoopStoreValue {
  const ctx = useContext(GreenLoopStoreContext);
  if (!ctx) throw new Error("useGreenLoopStore must be used within GreenLoopStoreProvider");
  return ctx;
}
