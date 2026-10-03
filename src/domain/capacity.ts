/**
 * GreenLoop capacity engine — pure functions over the demo dataset.
 *
 * The core product invariant lives here: a receiver's day-slot capacity is a
 * shared ledger. A request either CONFIRMS (consuming capacity) or goes ON
 * HOLD with an explicit reason; cancelling a confirmed reservation releases
 * capacity and rechecks held requests (earliest-held first, FIFO).
 *
 * No React, no I/O, no clock reads: callers pass `at` (ISO timestamp) and
 * `actor`, and every transition returns appended DomainEvents so the UI and
 * the public-site ledger stay in sync from one source of truth.
 */

import type {
  Actor,
  Allocation,
  AllocationCandidate,
  Booking,
  ConfirmOutcome,
  DomainEvent,
  Evidence,
  GreenLoopDataset,
  MaterialPassport,
  MaterialTypeKey,
  ReceiverDaySlot,
  VerificationRecord,
} from "./types.ts";

// ---------------------------------------------------------------------------
// Capacity arithmetic
// ---------------------------------------------------------------------------

/** Tonnes already reserved by CONFIRMED bookings on a slot. */
export function reservedT(bookings: Booking[]): number {
  return round1(sum(bookings.filter((b) => b.status === "confirmed").map((b) => b.tonnesT)));
}

/** Free tonnage in a slot right now. Accepts any booking list — it is
 *  filtered to this slot's confirmed bookings internally. */
export function availableT(slot: ReceiverDaySlot, bookings: Booking[]): number {
  const slotConfirmed = bookings.filter(
    (b) => b.slotId === slot.id && b.status === "confirmed",
  );
  return round1(Math.max(0, slot.capacityT - (slot.reservedT ?? 0) - sum(slotConfirmed.map((b) => b.tonnesT))));
}

export function bookingsForSlot(dataset: GreenLoopDataset, slotId: string): Booking[] {
  return dataset.bookings.filter((b) => b.slotId === slotId);
}

export function findSlot(dataset: GreenLoopDataset, slotId: string): ReceiverDaySlot | undefined {
  return dataset.slots.find((s) => s.id === slotId);
}

export function slotMatchesDemandPeriod(slot: ReceiverDaySlot, period: string): boolean {
  let deadline: string | undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    deadline = period;
  } else {
    const quarter = period.match(/^Q([1-4])\s+(\d{4})$/i);
    const namedMonth = period.match(/^([A-Za-z]+)\s+(\d{4})$/);
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = namedMonth ? monthNames.indexOf(namedMonth[1].slice(0, 3).toLowerCase()) + 1 : 0;
    const endMonth = quarter ? Number(quarter[1]) * 3 : month;
    const year = quarter ? Number(quarter[2]) : namedMonth ? Number(namedMonth[2]) : 0;
    if (endMonth > 0 && year > 0) {
      const lastDay = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
      deadline = `${year}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }
  }
  return !deadline || slot.date <= deadline;
}

/** Ledger view for one slot: capacity split into confirmed / available / held. */
export function slotLedger(
  dataset: GreenLoopDataset,
  slotId: string,
): { slot: ReceiverDaySlot; reserved: number; available: number; heldT: number } | undefined {
  const slot = findSlot(dataset, slotId);
  if (!slot) return undefined;
  const bookings = bookingsForSlot(dataset, slotId);
  const reserved = reservedT(bookings) + (slot.reservedT ?? 0);
  return {
    slot,
    reserved,
    available: round1(slot.capacityT - reserved),
    heldT: round1(sum(bookings.filter((b) => b.status === "hold").map((b) => b.tonnesT))),
  };
}

// ---------------------------------------------------------------------------
// Event helpers
// ---------------------------------------------------------------------------

function nextEventId(events: DomainEvent[], offset: number): string {
  const highestId = events.reduce((highest, event) => {
    const numericId = Number(event.id.replace(/^EV-/, ""));
    return Number.isFinite(numericId) ? Math.max(highest, numericId) : highest;
  }, events.length);
  return `EV-${String(highestId + 1 + offset).padStart(3, "0")}`;
}

function makeEvent(
  events: DomainEvent[],
  offset: number,
  kind: string,
  actor: Actor,
  at: string,
  summary: string,
  detail?: string,
  subjectIds: string[] = [],
): DomainEvent {
  return {
    id: nextEventId(events, offset),
    at,
    kind,
    actor,
    summary,
    ...(detail ? { detail } : {}),
    subjectIds,
  };
}

function withEvents(dataset: GreenLoopDataset, events: DomainEvent[]): GreenLoopDataset {
  return { ...dataset, events: [...dataset.events, ...events] };
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** Receiver demand signal per material class (0–1); editable demo table. */
const DEMAND_SIGNALS: Record<string, number> = {
  "R-001:concrete": 0.8,
  "R-001:brick": 0.6,
  "R-002:brick": 0.7,
  "R-002:timber": 0.5,
  "R-002:plasterboard": 0.4,
  "R-003:steel": 0.9,
  "R-004:concrete": 0.5,
  "R-004:glass": 0.6,
  "R-004:plasterboard": 0.3,
  "R-005:timber": 0.8,
};

const HANDLING_COST_PER_T: Record<MaterialTypeKey, number> = {
  concrete: 3.5,
  brick: 4.0,
  steel: 6.0,
  timber: 3.0,
  plasterboard: 2.5,
  glass: 5.0,
};

function demandFor(dataset: GreenLoopDataset, receiverId: string, type: MaterialTypeKey): number {
  const open = dataset.demands.filter(d => d.receiverId === receiverId && d.materialType === type && (d.status === "OPEN" || d.status === "PARTIALLY_COVERED"));
  if (!open.length) return DEMAND_SIGNALS[`${receiverId}:${type}`] ?? 0;
  const remaining = open.reduce((sum, d) => sum + Math.max(0, d.requiredT - (d.coveredT ?? dataset.bookings.filter(b => b.demandId === d.id && b.status === "confirmed").reduce((total, b) => total + b.tonnesT, 0))), 0);
  const capacity = dataset.slots.filter(s => s.receiverId === receiverId && s.materialType === type).reduce((sum, s) => sum + s.capacityT, 0);
  return clamp01(remaining / Math.max(remaining, capacity, 1));
}

function suitabilityFor(material: MaterialPassport): number {
  let s = 0.75;
  if (material.grade === "A") s += 0.1;
  else if (material.grade === "B") s += 0.05;
  if (material.condition === "good") s += 0.1;
  else if (material.condition === "fair") s += 0.05;
  else s -= 0.1;
  return clamp01(s);
}

function earliestSlotFor(dataset: GreenLoopDataset, receiverId: string, type: MaterialTypeKey, asOf?: string) {
  const slots = dataset.slots
    .filter((s) => s.receiverId === receiverId && s.materialType === type && (!asOf || s.date >= asOf))
    .sort((a, b) => a.date.localeCompare(b.date));
  return slots[0];
}

function transportCostPerT(distanceKm: number): number {
  return round2(2 + 0.14 * distanceKm);
}

/**
 * Score every receiver that can process the material. Deterministic composite:
 * suitability 40% · demand 25% · availability 20% · proximity 15%.
 * `recommended` marks the best-scored candidate with room for the load
 * (or, if none fits, the best score overall for transparency).
 */
export function computeMatch(
  dataset: GreenLoopDataset,
  materialId: string,
  asOf?: string,
): AllocationCandidate[] {
  const material = dataset.materials.find((m) => m.id === materialId);
  if (!material) return [];

  const candidates = dataset.receivers
    .filter((r) => r.acceptedTypes.includes(material.type))
    .map<AllocationCandidate>((receiver) => {
      const slot = earliestSlotFor(dataset, receiver.id, material.type, asOf);
      const avail = slot ? availableT(slot, bookingsForSlot(dataset, slot.id)) : 0;
      const suitability = suitabilityFor(material);
      const demand = demandFor(dataset, receiver.id, material.type);
      const proximity = receiver.distanceKnown === false ? 0.5 : clamp01(1 - receiver.distanceKm / 80);
      const availabilityRatio = clamp01(material.quantityT === 0 ? 0 : avail / material.quantityT);
      const score = round3(
        0.4 * suitability + 0.25 * demand + 0.2 * availabilityRatio + 0.15 * proximity,
      );
      return {
        receiverId: receiver.id,
        suitability: round2(suitability),
        demand: round2(demand),
        distanceKm: receiver.distanceKm,
        distanceKnown: receiver.distanceKnown,
        availableT: avail,
        transportCostPerT: transportCostPerT(receiver.distanceKm),
        handlingCostPerT: HANDLING_COST_PER_T[material.type],
        score,
        recommended: false,
      };
    })
    .sort((a, b) => b.score - a.score);

  const fitting = candidates.filter((c) => c.availableT >= material.quantityT);
  const best = (fitting.length > 0 ? fitting : candidates)[0];
  if (best) best.recommended = true;
  return candidates;
}

// ---------------------------------------------------------------------------
// Requests: confirm or hold
// ---------------------------------------------------------------------------

export interface RequestCapacityOutput {
  allocation: Allocation;
  booking: Booking;
  outcome: ConfirmOutcome;
}

/**
 * Attempt to reserve `tonnesT` on a receiver slot. Confirms when free tonnage
 * covers the request; otherwise records a HOLD with an explicit reason and
 * zeroed available-after so the UI can show exactly why it did not fit.
 */
export function requestCapacity(
  dataset: GreenLoopDataset,
  input: {
    materialId: string;
    receiverId: string;
    slotId: string;
    tonnesT: number;
    actor: Actor;
    at: string;
  },
): EngineOutput<RequestCapacityOutput> {
  const slot = findSlot(dataset, input.slotId);
  const material = dataset.materials.find((m) => m.id === input.materialId);
  if (!slot || !material) throw new Error(`Unknown slot/material: ${input.slotId}/${input.materialId}`);

  const events: DomainEvent[] = [];
  const before = availableT(slot, bookingsForSlot(dataset, slot.id));
  const fits = input.tonnesT <= before + 1e-9;
  const after = fits ? round1(before - input.tonnesT) : 0;
  const outcome: ConfirmOutcome = fits ? "confirmed" : "hold";
  const holdReason = fits
    ? undefined
    : `Insufficient available capacity — ${input.tonnesT.toFixed(1)} t requested, ${before.toFixed(1)} t available`;

  const allocation: Allocation = {
    id: `AL-${dataset.allocations.length + 1}`,
    materialId: material.id,
    receiverId: input.receiverId,
    slotId: slot.id,
    requestedT: input.tonnesT,
    status: outcome,
    ...(holdReason ? { holdReason } : {}),
    capacityBeforeT: before,
    capacityAfterT: after,
    decidedAt: input.at,
    updatedAt: input.at,
    candidates: computeMatch(dataset, material.id, input.at.slice(0, 10)),
  };

  const booking: Booking = {
    id: `BK-${dataset.bookings.length + 1}`,
    allocationId: allocation.id,
    slotId: slot.id,
    receiverId: input.receiverId,
    materialId: material.id,
    tonnesT: input.tonnesT,
    status: outcome,
    ...(holdReason ? { holdReason } : {}),
    capacityBeforeT: before,
    capacityAfterT: after,
    createdAt: input.at,
    updatedAt: input.at,
  };

  events.push(
    makeEvent(
      dataset.events,
      0,
      "allocation.requested",
      input.actor,
      input.at,
      `${input.tonnesT.toFixed(1)} t of ${material.type} requested at ${receiverName(dataset, input.receiverId)}`,
      undefined,
      [material.id, input.receiverId, allocation.id],
    ),
  );
  events.push(
    makeEvent(
      dataset.events,
      1,
      outcome === "confirmed" ? "allocation.confirmed" : "allocation.hold",
      input.actor,
      input.at,
      outcome === "confirmed"
        ? `Confirmed — capacity ${before.toFixed(1)} t → ${after.toFixed(1)} t available`
        : `HOLD — ${holdReason}`,
      undefined,
      [material.id, input.receiverId, allocation.id],
    ),
  );

  const materialStatus = fits ? "reserved" : "passport-ready";
  const next: GreenLoopDataset = {
    ...withEvents(dataset, events),
    allocations: [...dataset.allocations, allocation],
    bookings: [...dataset.bookings, booking],
    materials: dataset.materials.map((m) =>
      m.id === material.id ? { ...m, status: materialStatus } : m,
    ),
  };
  return { dataset: next, events, output: { allocation, booking, outcome } };
}

// ---------------------------------------------------------------------------
// Release + recheck
// ---------------------------------------------------------------------------

export interface ReleaseOutput {
  cancelledBooking: Booking;
  reconfirmed: Array<{ allocationId: string; bookingId: string; materialId: string; tonnesT: number }>;
}

/**
 * Cancel a confirmed booking (its tonnes return to the ledger), mark the
 * material passport-ready again, then recheck held requests on the same slot.
 */
export function releaseCapacity(
  dataset: GreenLoopDataset,
  input: { bookingId: string; actor: Actor; at: string; reason?: string },
): EngineOutput<ReleaseOutput> {
  const booking = dataset.bookings.find((b) => b.id === input.bookingId);
  if (!booking) throw new Error(`Unknown booking: ${input.bookingId}`);
  if ((booking.status !== "confirmed" && booking.status !== "hold") || booking.loadRef || dataset.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id))) {
    return { dataset, events: [], output: { cancelledBooking: booking, reconfirmed: [] } };
  }

  const events: DomainEvent[] = [];
  const cancelledBooking: Booking = {
    ...booking,
    status: "cancelled",
    updatedAt: input.at,
    cancelledAt: input.at,
    ...(input.reason ? { cancelledReason: input.reason } : {}),
  };

  events.push(
    makeEvent(
      dataset.events,
      0,
      booking.status === "confirmed" ? "capacity.released" : "booking.cancelled",
      input.actor,
      input.at,
      booking.status === "confirmed" ? `${booking.tonnesT.toFixed(1)} t released at ${receiverName(dataset, booking.receiverId)}` : `${booking.tonnesT.toFixed(1)} t held request cancelled at ${receiverName(dataset, booking.receiverId)}`,
      input.reason,
      [booking.materialId, booking.receiverId, booking.id],
    ),
  );

  let next: GreenLoopDataset = {
    ...withEvents(dataset, events),
    bookings: dataset.bookings.map((b) => (b.id === booking.id ? cancelledBooking : b)),
    allocations: dataset.allocations.map((a) =>
      a.id === booking.allocationId
        ? { ...a, status: "cancelled" as const, updatedAt: input.at }
        : a,
    ),
    materials: dataset.materials.map((m) =>
      m.id === booking.materialId && m.status !== "verified" && m.status !== "dispatched"
        ? { ...m, status: "passport-ready" as const }
        : m,
    ),
  };

  const recheck = booking.status === "confirmed"
    ? recheckHolds(next, { slotId: booking.slotId, actor: input.actor, at: input.at })
    : { dataset: next, events: [], output: { reconfirmed: [] } };
  next = recheck.dataset;
  events.push(...recheck.events);

  return {
    dataset: next,
    events,
    output: { cancelledBooking, reconfirmed: recheck.output.reconfirmed },
  };
}

export interface RecheckOutput {
  rechecked: number;
  reconfirmed: Array<{ allocationId: string; bookingId: string; materialId: string; tonnesT: number }>;
}

/**
 * Recheck held requests on a slot, earliest-held first. Each confirmation
 * consumes capacity before the next hold is evaluated, so the ledger can
 * never be over-booked.
 */
export function recheckHolds(
  dataset: GreenLoopDataset,
  input: { slotId: string; actor: Actor; at: string },
): EngineOutput<RecheckOutput> {
  const slot = findSlot(dataset, input.slotId);
  if (!slot) throw new Error(`Unknown slot: ${input.slotId}`);

  const holds = dataset.bookings
    .filter((b) => b.slotId === slot.id && b.status === "hold")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const events: DomainEvent[] = [];
  const reconfirmed: RecheckOutput["reconfirmed"] = [];
  let bookings = [...dataset.bookings];
  let materials = [...dataset.materials];
  let allocations = [...dataset.allocations];

  for (const hold of holds) {
    const avail = availableT(slot, bookings);
    const material = dataset.materials.find((item) => item.id === hold.materialId);
    const committedMaterialT = bookings
      .filter((booking) => booking.materialId === hold.materialId && booking.status === "confirmed")
      .reduce((total, booking) => total + booking.tonnesT, 0);
    const materialRemainingT = Math.max(0, (material?.quantityT ?? 0) - committedMaterialT);
    const demand = hold.demandId ? dataset.demands.find((item) => item.id === hold.demandId) : undefined;
    const committedDemandT = hold.demandId
      ? bookings.filter((booking) => booking.demandId === hold.demandId && booking.status === "confirmed")
        .reduce((total, booking) => total + booking.tonnesT, 0)
      : 0;
    const demandRemainingT = demand ? Math.max(0, demand.requiredT - committedDemandT) : Infinity;
    if (hold.tonnesT > avail + 1e-9 || hold.tonnesT > materialRemainingT + 1e-9 || hold.demandId && !demand || hold.tonnesT > demandRemainingT + 1e-9) continue;

    const after = round1(avail - hold.tonnesT);
    bookings = bookings.map((b) =>
      b.id === hold.id
        ? { ...b, status: "confirmed" as const, capacityBeforeT: avail, capacityAfterT: after, updatedAt: input.at, holdReason: undefined }
        : b,
    );
    allocations = allocations.map((a) =>
      a.id === hold.allocationId
        ? { ...a, status: "confirmed" as const, capacityBeforeT: avail, capacityAfterT: after, updatedAt: input.at, holdReason: undefined }
        : a,
    );
    materials = materials.map((m) => (m.id === hold.materialId ? { ...m, status: "reserved" as const } : m));

    events.push(
      makeEvent(
        dataset.events,
        events.length,
        "allocation.recheck.confirmed",
        input.actor,
        input.at,
        `Recheck confirmed — ${hold.tonnesT.toFixed(1)} t now fits (${avail.toFixed(1)} t available)`,
        undefined,
        [hold.materialId, hold.receiverId, hold.id],
      ),
    );
    reconfirmed.push({
      allocationId: hold.allocationId,
      bookingId: hold.id,
      materialId: hold.materialId,
      tonnesT: hold.tonnesT,
    });
  }

  if (reconfirmed.length === 0) {
    return { dataset, events: [], output: { rechecked: holds.length, reconfirmed: [] } };
  }

  return {
    dataset: {
      ...withEvents(dataset, events),
      bookings,
      materials,
      allocations,
    },
    events,
    output: { rechecked: holds.length, reconfirmed },
  };
}

// ---------------------------------------------------------------------------
// Dispatch + verification
// ---------------------------------------------------------------------------

export interface DispatchOutput {
  loadRef?: string;
}

/** Mark a confirmed booking dispatched and stamp the load reference. */
export function dispatchLoad(
  dataset: GreenLoopDataset,
  input: { bookingId: string; actor: Actor; at: string },
): EngineOutput<DispatchOutput> {
  const booking = dataset.bookings.find((b) => b.id === input.bookingId);
  if (!booking) throw new Error(`Unknown booking: ${input.bookingId}`);
  const alreadyDispatched = booking.status !== "confirmed" || !booking.receiverAcceptedAt || Boolean(booking.loadRef) ||
    dataset.events.some((event) => event.kind === "load.dispatched" && event.subjectIds.includes(booking.id));
  if (alreadyDispatched) return { dataset, events: [], output: {} };

  const usedLoadRefs = new Set([
    ...dataset.bookings.map((item) => item.loadRef).filter((ref): ref is string => Boolean(ref)),
    ...dataset.events.flatMap((event) => event.summary.match(/LOAD-\d+/g) ?? []),
  ]);
  let loadNumber = 1001;
  while (usedLoadRefs.has(`LOAD-${loadNumber}`)) loadNumber += 1;
  const loadRef = `LOAD-${loadNumber}`;

  const event = makeEvent(
    dataset.events,
    0,
    "load.dispatched",
    input.actor,
    input.at,
    `${loadRef} dispatched — ${booking.tonnesT.toFixed(1)} t to ${receiverName(dataset, booking.receiverId)}`,
    undefined,
    [booking.materialId, booking.receiverId, booking.id],
  );

  return {
    dataset: {
      ...withEvents(dataset, [event]),
      bookings: dataset.bookings.map((item) =>
        item.id === booking.id ? { ...item, loadRef, updatedAt: input.at } : item,
      ),
      materials: dataset.materials.map((m) =>
        m.id === booking.materialId ? { ...m, status: "dispatched" as const } : m,
      ),
    },
    events: [event],
    output: { loadRef },
  };
}

export interface DeliveryInput {
  bookingId: string;
  actualT: number;
  acceptedT: number;
  rejectReason?: string;
  evidence: Evidence[];
  actor: Actor;
  at: string;
}

export interface DeliveryOutput {
  verificationId: string;
  loadRef: string;
  status: "verified" | "rejected";
}

/** Record the weighbridge reconciliation for a dispatched load. */
export function recordDelivery(
  dataset: GreenLoopDataset,
  input: DeliveryInput,
): EngineOutput<DeliveryOutput> {
  const booking = dataset.bookings.find((b) => b.id === input.bookingId);
  if (!booking) throw new Error(`Unknown booking: ${input.bookingId}`);
  if (booking.status !== "confirmed" || !booking.loadRef ||
    dataset.verifications.some((record) => record.bookingId === booking.id)) {
    return { dataset, events: [], output: { verificationId: "", loadRef: booking.loadRef ?? "", status: "verified" } };
  }

  const rejectedT = round1(Math.max(0, input.actualT - input.acceptedT));
  const status = rejectedT > 0 && input.acceptedT === 0 ? "rejected" : "verified";
  const loadRef = booking.loadRef;

  const verification: VerificationRecord = {
    id: `VR-${dataset.verifications.length + 1}`,
    bookingId: booking.id,
    loadRef,
    materialId: booking.materialId,
    receiverId: booking.receiverId,
    plannedT: booking.tonnesT,
    actualT: round1(input.actualT),
    acceptedT: round1(input.acceptedT),
    rejectedT,
    ...(input.rejectReason ? { rejectReason: input.rejectReason } : {}),
    status,
    verifiedAt: input.at,
    evidence: input.evidence,
  };

  const event = makeEvent(
    dataset.events,
    0,
    status === "verified" ? "verification.completed" : "verification.rejected",
    input.actor,
    input.at,
    `${loadRef} verified — planned ${booking.tonnesT.toFixed(1)} t, accepted ${verification.acceptedT.toFixed(1)} t`,
    rejectedT > 0 ? `${rejectedT.toFixed(1)} t rejected${input.rejectReason ? `: ${input.rejectReason}` : ""}` : undefined,
    [booking.materialId, booking.receiverId, booking.id],
  );

  return {
    dataset: {
      ...withEvents(dataset, [event]),
      verifications: [...dataset.verifications, verification],
      materials: dataset.materials.map((m) =>
        m.id === booking.materialId ? { ...m, status: "verified" as const } : m,
      ),
    },
    events: [event],
    output: { verificationId: verification.id, loadRef, status },
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export interface EngineOutput<T> {
  dataset: GreenLoopDataset;
  events: DomainEvent[];
  output: T;
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function receiverName(dataset: GreenLoopDataset, receiverId: string): string {
  return dataset.receivers.find((r) => r.id === receiverId)?.name ?? receiverId;
}
