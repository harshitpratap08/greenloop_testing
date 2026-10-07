import {
  availableT,
  slotMatchesDemandPeriod,
  dispatchLoad,
  recordDelivery,
  releaseCapacity,
  recheckHolds,
  requestCapacity,
  type DeliveryInput,
} from "../../shared/domain/capacity.ts";
import type {
  MaterialUpdate,
  DemandUpdate,
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
} from "../../shared/domain/types.ts";
type RequestCapacityAction = (input: {
  materialId: string;
  receiverId: string;
  slotId: string;
  tonnesT: number;
}) => void;
type CancelBookingAction = (input: { bookingId: string; reason?: string }) => void;
type DispatchAction = (input: { bookingId: string }) => void;
type VerifyAction = (input: { bookingId: string } & Omit<DeliveryInput, "bookingId" | "actor" | "at">) => void;
type AddMaterialAction = (input: Omit<MaterialPassport, "id" | "status" | "surveyedAt">) => MaterialPassport;
type AddDemandInput = Omit<DemandRecord, "id" | "status" | "createdAt" | "receiverId"> & { receiverId?: string };
type AddDemandAction = (input: AddDemandInput) => DemandRecord;
type AddProjectAction = (input: Pick<Project, "name" | "location" | "status"> & Partial<Pick<Project, "geo">>) => Project;
type AddCapacityAction = (input: Omit<ReceiverDaySlot, "id">) => ReceiverDaySlot;
type UpdateCapacityAction = (slotId: string, capacityT: number) => boolean;

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
  if (!demand || demand.status === "DRAFT" || demand.status === "PAUSED" || demand.status === "CANCELLED") return dataset;
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

export function createActions(initial: GreenLoopDataset, actor: Actor) {
  let dataset = initial;
  const setDataset = (update: (previous: GreenLoopDataset) => GreenLoopDataset) => { dataset = update(dataset); };
  const ACTOR_A = actor;
  const ACTOR_B = actor;
  const ACTOR_RECEIVER = actor;
  const updateMaterialAction = (id: string, input: MaterialUpdate) => {
    const record = dataset.materials.find(item => item.id === id && !item.archivedAt);
    if (!record || dataset.bookings.some(item => item.materialId === id)) return false;
    const activeOffers = (dataset.offers ?? []).some(item => item.passportId === id && ["pending", "accepted"].includes(item.status));
    if (activeOffers && (input.type !== record.type || input.condition !== record.condition || input.grade !== record.grade)) return false;
    const updated: MaterialPassport = { ...record, ...input, pricePerT: input.pricePerT ?? undefined, availableFrom: input.availableFrom ?? undefined, quantityRangeT: [Math.min(record.quantityRangeT[0], input.quantityT), Math.max(record.quantityRangeT[1], input.quantityT)], originalQuantity: input.quantityT / (record.conversionFactor || 1) };
    dataset = { ...dataset, materials: dataset.materials.map(item => item.id === id ? updated : item), events: [...dataset.events, eventFor(dataset, "material.updated", actor, `Material passport ${id} updated`, [id, record.projectId])] };
    return true;
  };
  const deleteMaterialAction = (id: string) => {
    const record = dataset.materials.find(item => item.id === id && !item.archivedAt);
    if (!record || dataset.bookings.some(item => item.materialId === id) || dataset.verifications.some(item => item.materialId === id)) return false;
    dataset = { ...dataset, materials: dataset.materials.map(item => item.id === id ? { ...item, archivedAt: new Date().toISOString() } : item), allocations: dataset.allocations.map(item => item.materialId === id ? { ...item, status: "cancelled" as const } : item), offers: (dataset.offers ?? []).map(item => item.passportId === id ? { ...item, status: "withdrawn" as const, archivedAt: new Date().toISOString() } : item), events: [...dataset.events, eventFor(dataset, "material.deleted", actor, `Material passport ${id} deleted`, [id, record.projectId])] };
    return true;
  };
  const updateDemandAction = (id: string, input: DemandUpdate) => {
    const record = dataset.demands.find(item => item.id === id && !item.archivedAt);
    if (!record || record.status === "CANCELLED") return false;
    const bookings = dataset.bookings.filter(item => item.demandId === id);
    const committed = bookings.filter(item => item.status !== "cancelled").reduce((sum, item) => sum + item.tonnesT, 0);
    const activeOffers = (dataset.offers ?? []).some(item => item.demandId === id && ["pending", "accepted"].includes(item.status));
    if (input.requiredT < committed || ((bookings.length || activeOffers) && input.materialType !== record.materialType) || (bookings.length && input.location !== record.location)) return false;
    if (bookings.some(item => item.status !== "cancelled" && (dataset.slots.find(slot => slot.id === item.slotId)?.date ?? "") > input.period)) return false;
    const updated: DemandRecord = { ...record, ...input, budgetPerT: input.budgetPerT ?? undefined, geo: input.location === record.location ? record.geo : undefined };
    dataset = updateDemandCoverage({ ...dataset, demands: dataset.demands.map(item => item.id === id ? updated : item), events: [...dataset.events, eventFor(dataset, "demand.updated", actor, `Material request ${id} updated`, [id, record.receiverId])] }, id);
    return true;
  };
  const deleteDemandAction = (id: string) => {
    const record = dataset.demands.find(item => item.id === id && !item.archivedAt);
    if (!record || dataset.bookings.some(item => item.demandId === id)) return false;
    dataset = { ...dataset, demands: dataset.demands.map(item => item.id === id ? { ...item, archivedAt: new Date().toISOString(), status: "CANCELLED" as const } : item), offers: (dataset.offers ?? []).map(item => item.demandId === id ? { ...item, status: "withdrawn" as const, archivedAt: new Date().toISOString() } : item), events: [...dataset.events, eventFor(dataset, "demand.deleted", actor, `Material request ${id} deleted`, [id, record.receiverId])] };
    return true;
  };
  const requestCapacityAction: RequestCapacityAction = (input) => {
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
  };

  const cancelBookingAction: CancelBookingAction = (input) => {
    setDataset((prev) => {
      const released = releaseCapacity(prev, {
        bookingId: input.bookingId,
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        actor: ACTOR_A,
        at: new Date().toISOString(),
      }).dataset;
      return syncDemandCoverage(released);
    });
  };

  const dispatchAction: DispatchAction = (input) => {
    setDataset((prev) => dispatchLoad(prev, {
      bookingId: input.bookingId,
      actor: ACTOR_B,
      at: new Date().toISOString(),
    }).dataset);
  };

  const verifyAction: VerifyAction = (input) => {
    setDataset((prev) => recordDelivery(prev, {
      ...input,
      actor: ACTOR_RECEIVER,
      at: new Date().toISOString(),
    }).dataset);
  };

  const addMaterialAction: AddMaterialAction = (input) => {
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
  };

  const addDemandAction: AddDemandAction = (input) => {
    const newDemand: DemandRecord = {
      ...input,
      id: nextId("DM", dataset.demands, 3),
      receiverId: input.receiverId ?? "",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      targetProviderId: input.targetProviderId,
      targetMaterialId: input.targetMaterialId,
    };
    setDataset((prev) => {
      const event = eventFor(prev, "demand.created", ACTOR_RECEIVER,
        `${newDemand.requiredT.toFixed(1)} t of ${newDemand.materialType} demand published`,
        [newDemand.id, newDemand.receiverId, ...(newDemand.targetMaterialId ? [newDemand.targetMaterialId] : [])]);
      return { ...prev, demands: [newDemand, ...prev.demands], events: [...prev.events, event] };
    });
    return newDemand;
  };

  const saveDemandDraftAction: AddDemandAction = (input) => {
    const draft: DemandRecord = { ...input, id: nextId("DM", dataset.demands, 3), receiverId: input.receiverId ?? "", status: "DRAFT", createdAt: new Date().toISOString(), targetProviderId: input.targetProviderId, targetMaterialId: input.targetMaterialId };
    setDataset((prev) => ({ ...prev, demands: [draft, ...prev.demands], events: [...prev.events, eventFor(prev, "demand.draft_saved", ACTOR_RECEIVER, "Receiver saved a material request draft", [draft.id, draft.receiverId])] }));
    return draft;
  };

  const deleteDemandDraftAction = (demandId: string) => {
    const draft = dataset.demands.find((item) => item.id === demandId);
    if (!draft || draft.status !== "DRAFT") return false;
    setDataset((prev) => ({ ...prev, demands: prev.demands.filter((item) => item.id !== demandId), events: [...prev.events, eventFor(prev, "demand.draft_deleted", ACTOR_RECEIVER, "Receiver deleted a material request draft", [demandId, draft.receiverId])] }));
    return true;
  };

  const addProjectAction: AddProjectAction = (input) => {
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
  };

  const updateCapacityAction: UpdateCapacityAction = (slotId, capacityT) => {
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
  };

  const addSupportRequestAction = (input: Omit<SupportRequest, "id" | "submittedAt">) => {
    const request: SupportRequest = { ...input, id: nextId("SUP", dataset.supportRequests ?? []), submittedAt: new Date().toISOString() };
    setDataset((prev) => ({
      ...prev,
      supportRequests: [request, ...(prev.supportRequests ?? [])],
      events: [...prev.events, eventFor(prev, "support.submitted", { kind: "system", name: request.email }, "Support request submitted", [request.id])],
    }));
    return request;
  };

  const addCapacityAction: AddCapacityAction = (input) => {
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
  };

  const acceptRequestAction = (bookingId: string, requestedAcceptedT?: number) => {
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
  };

  const rejectRequestAction = (bookingId: string) => {
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
  };

  const rescheduleRequestAction = (bookingId: string, slotId: string) => {
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
        return prev;
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
  };

  const updateDeliveryAction = (bookingId: string, stage: "ready" | "picked-up" | "arrived") => {
    setDataset((prev) => {
      const booking = prev.bookings.find(item => item.id === bookingId);
      if (!booking || booking.status !== "confirmed" || !booking.receiverAcceptedAt || prev.verifications.some(item => item.bookingId === bookingId)) return prev;
      const events = prev.events.filter(item => item.subjectIds.includes(bookingId));
      const kind = `delivery.${stage}`;
      if (events.some(item => item.kind === kind)) return prev;
      if (stage === "ready" && (booking.loadRef || events.some(item => item.kind === "delivery.picked-up"))) return prev;
      if (stage === "picked-up" && (booking.loadRef || !events.some(item => item.kind === "delivery.ready"))) return prev;
      if (stage === "arrived" && !booking.loadRef) return prev;
      const at = new Date().toISOString();
      const labels = { ready: "Ready for pickup", "picked-up": "Picked up", arrived: "Reached destination" };
      return { ...prev, bookings: prev.bookings.map(item => item.id === bookingId ? { ...item, updatedAt: at } : item), events: [...prev.events, eventFor(prev, kind, ACTOR_A, `${bookingId}: ${labels[stage]}`, [bookingId, booking.materialId, booking.receiverId], undefined, at)] };
    });
  };

  const receiveLoadAction = (bookingId: string, actualT: number, evidence: Evidence[]) => {
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
  };

  const verifyLoadAction = (verificationId: string, acceptedT: number, rejectedT: number, rejectReason?: string) => {
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
  };

  const addOfferAction = (input: Omit<MaterialOffer, "id" | "status" | "createdAt">) => {
    const newOffer: MaterialOffer = {
      ...input,
      id: nextId("OF", dataset.offers ?? [], 4),
      status: "pending",
      createdAt: new Date().toISOString(),
      counters: input.counters ?? [],
    };
    setDataset((prev) => ({
      ...prev,
      offers: [newOffer, ...(prev.offers ?? [])],
      events: [...prev.events, eventFor(prev, "offer.created", ACTOR_A,
        `${newOffer.offeredQuantityT.toFixed(1)} t provider offer submitted`,
        [newOffer.id, newOffer.demandId, newOffer.passportId])],
    }));
  };

  const saveOfferDraftAction = (input: Omit<MaterialOffer, "id" | "status" | "createdAt">) => {
    const draft: MaterialOffer = { ...input, id: nextId("OF", dataset.offers ?? [], 4), status: "draft", createdAt: new Date().toISOString(), counters: [] };
    setDataset((prev) => ({ ...prev, offers: [draft, ...(prev.offers ?? [])], events: [...prev.events, eventFor(prev, "offer.draft_saved", ACTOR_A, "Provider saved a material offer draft", [draft.id, draft.demandId, draft.passportId])] }));
    return true;
  };

  const deleteOfferDraftAction = (offerId: string) => {
    const draft = dataset.offers?.find((item) => item.id === offerId);
    if (!draft || draft.status !== "draft") return false;
    setDataset((prev) => ({ ...prev, offers: (prev.offers ?? []).filter((item) => item.id !== offerId), events: [...prev.events, eventFor(prev, "offer.draft_deleted", ACTOR_A, "Provider deleted a material offer draft", [offerId, draft.demandId, draft.passportId])] }));
    return true;
  };

  const acceptOfferAction = (offerId: string) => {
    setDataset((prev) => {
      const offers = prev.offers ?? [];
      const offer = offers.find((item) => item.id === offerId);
      if (!offer || offer.status !== "pending") return prev;
      const demand = prev.demands.find((item) => item.id === offer.demandId);
      const material = prev.materials.find((item) => item.id === offer.passportId);
      if (!demand || !material || material.type !== demand.materialType || demand.status === "PAUSED" || demand.status === "CANCELLED") return prev;
      const eligibleSlots = prev.slots
        .filter((item) => item.receiverId === demand.receiverId && item.materialType === demand.materialType && item.date >= new Date().toISOString().slice(0, 10) && slotMatchesDemandPeriod(item, demand.period))
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
      const slot = eligibleSlots.find((item) => availableT(item, prev.bookings) >= requested);
      if (!slot) return prev;
      const capacityResult = requestCapacity(prev, {
        materialId: material.id,
        receiverId: demand.receiverId,
        slotId: slot.id,
        tonnesT: requested,
        actor: ACTOR_RECEIVER,
        at,
      });
      const createdBooking = capacityResult.output.booking;
      const agreedPricePerT = offer.counters?.at(-1)?.pricePerT ?? offer.pricePerT;
      const acceptedBooking: Booking = { ...createdBooking, demandId: demand.id, receiverAcceptedAt: at, ...(agreedPricePerT !== undefined ? { agreedPricePerT } : {}) };
      const attachedDataset: GreenLoopDataset = {
        ...capacityResult.dataset,
        bookings: capacityResult.dataset.bookings.map((item) => item.id === createdBooking.id ? acceptedBooking : item),
        offers: offers.map((item) => item.id === offerId ? { ...item, status: "accepted", ...(agreedPricePerT !== undefined ? { agreedPricePerT } : {}) } : item),
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
  };

  const counterOfferAction = (offerId: string, actor: "provider" | "receiver", pricePerT: number) => {
    if (!Number.isFinite(pricePerT) || pricePerT <= 0) return false;
    setDataset((prev) => {
      const offer = prev.offers?.find((item) => item.id === offerId);
      if (!offer || offer.status !== "pending") return prev;
      const counter = { actor, pricePerT, at: new Date().toISOString() };
      const event = eventFor(prev, "offer.countered", actor === "receiver" ? ACTOR_RECEIVER : ACTOR_A,
        `${actor === "receiver" ? "Receiver" : "Provider"} countered at ${pricePerT.toLocaleString("en-IN")} INR/t`, [offer.id, offer.demandId, offer.passportId]);
      return { ...prev, offers: (prev.offers ?? []).map((item) => item.id === offerId ? { ...item, counters: [...(item.counters ?? []), counter] } : item), events: [...prev.events, event] };
    });
    return true;
  };

  const cancelDemandAction = (demandId: string) => {
    setDataset((prev) => {
      const demand = prev.demands.find((item) => item.id === demandId);
      if (!demand || !["OPEN", "PARTIALLY_COVERED"].includes(demand.status)) return prev;
      const pendingOffers = (prev.offers ?? []).filter((offer) => offer.demandId === demand.id && offer.status === "pending");
      const event = eventFor(prev, "demand.cancelled", ACTOR_RECEIVER, "Receiver cancelled material request", [demand.id, ...pendingOffers.map((offer) => offer.id)]);
      return { ...prev, demands: prev.demands.map((item) => item.id === demandId ? { ...item, status: "CANCELLED" } : item), offers: (prev.offers ?? []).map((offer) => offer.demandId === demand.id && offer.status === "pending" ? { ...offer, status: "declined" } : offer), events: [...prev.events, event] };
    });
    return true;
  };

  const withdrawOfferAction = (offerId: string) => {
    setDataset((prev) => {
      const offer = prev.offers?.find((item) => item.id === offerId);
      if (!offer || offer.status !== "pending") return prev;
      const event = eventFor(prev, "offer.withdrawn", ACTOR_A, "Provider withdrew pending offer", [offer.id, offer.demandId, offer.passportId]);
      return { ...prev, offers: (prev.offers ?? []).map((item) => item.id === offerId ? { ...item, status: "withdrawn" } : item), events: [...prev.events, event] };
    });
    return true;
  };

  const archiveBookingAction = (bookingId: string, actor: "provider" | "receiver") => {
    setDataset((prev) => {
      const verification = prev.verifications.find((item) => item.bookingId === bookingId);
      const booking = prev.bookings.find((item) => item.id === bookingId);
      if (!booking || !verification || verification.status !== "verified" || booking.archivedAt) return prev;
      const at = new Date().toISOString();
      const event = eventFor(prev, "booking.archived", actor === "receiver" ? ACTOR_RECEIVER : ACTOR_A, "Completed booking archived", [booking.id, verification.id, booking.materialId]);
      return { ...prev, bookings: prev.bookings.map((item) => item.id === bookingId ? { ...item, archivedAt: at } : item), events: [...prev.events, event] };
    });
    return true;
  };

  const declineOfferAction = (offerId: string) => {
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
  };

  return { getDataset: () => dataset, updateMaterialAction, deleteMaterialAction, updateDemandAction, deleteDemandAction, updateDeliveryAction, requestCapacityAction, cancelBookingAction, dispatchAction, verifyAction, addMaterialAction, addDemandAction, saveDemandDraftAction, deleteDemandDraftAction, addProjectAction, updateCapacityAction, addSupportRequestAction, addCapacityAction, acceptRequestAction, rejectRequestAction, rescheduleRequestAction, receiveLoadAction, verifyLoadAction, addOfferAction, saveOfferDraftAction, deleteOfferDraftAction, acceptOfferAction, declineOfferAction, counterOfferAction, cancelDemandAction, withdrawOfferAction, archiveBookingAction };
}
