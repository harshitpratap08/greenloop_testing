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
  ReceiverFacility,
  DemandRecord,
  MaterialOffer
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

export function slotMatchesDemandPeriod(slot: Pick<ReceiverDaySlot, "date">, period: string): boolean {
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

export interface MatchFilterState {
  materialType?: string;
  locationQuery?: string;
  minimumQuantityT?: number;
  maximumBudget?: number;
  neededBy?: string;
}

export function evaluateMatch(
  dataset: GreenLoopDataset,
  context: {
    material: MaterialPassport;
    receiver: ReceiverFacility;
    demand?: DemandRecord;
    offer?: MaterialOffer;
    asOf?: string;
    filters?: MatchFilterState;
  }
): AllocationCandidate {
  const { material, receiver, demand, offer, asOf, filters } = context;

  const out: AllocationCandidate = {
    receiverId: receiver.id,
    materialId: material.id,
    demandId: demand?.id,
    offerId: offer?.id,
    suitability: 0,
    demand: 0,
    distanceKm: receiver.distanceKm,
    distanceKnown: receiver.distanceKnown,
    availableT: 0,
    transportCostPerT: transportCostPerT(receiver.distanceKm),
    handlingCostPerT: HANDLING_COST_PER_T[material.type] ?? 3.5,
    score: 0,
    recommended: false,
    
    isEligible: true,
    factors: {},
    advantages: [],
    drawbacks: [],
    nonMatchReasons: [],
    missingDataNotes: [],
  };

  // 1. Hard Constraints
  if (!receiver.acceptedTypes.includes(material.type)) {
    out.isEligible = false;
    out.nonMatchReasons!.push(`Not eligible: material type '${material.type}' is not accepted by this receiver.`);
  }
  
  if (material.status === 'cancelled') {
    out.isEligible = false;
    out.nonMatchReasons!.push('Not eligible: material is cancelled or unavailable.');
  }

  if (demand && ['CANCELLED', 'COVERED'].includes(demand.status)) {
    out.isEligible = false;
    out.nonMatchReasons!.push(`Not eligible: demand is ${demand.status.toLowerCase()}.`);
  }

  if (filters?.materialType && material.type !== filters.materialType) {
    out.isEligible = false;
    out.nonMatchReasons!.push(`Filtered out: does not match selected material type.`);
  }

  // 2. Quantity & Capacity
  const targetReqQuantity = demand ? demand.requiredT : material.quantityT;
  const targetAvailQuantity = offer ? offer.offeredQuantityT : material.quantityT;
  
  out.requestedQuantityT = targetReqQuantity;
  out.availableQuantityT = targetAvailQuantity;
  
  // Calculate coverage for partial fulfillment
  const coveragePercent = targetReqQuantity > 0 ? clamp01(targetAvailQuantity / targetReqQuantity) : 0;
  out.coveragePercent = round2(coveragePercent * 100);
  out.remainingQuantityT = Math.max(0, targetReqQuantity - targetAvailQuantity);
  out.isFullMatch = targetAvailQuantity >= targetReqQuantity;
  out.isPartialMatch = targetAvailQuantity > 0 && targetAvailQuantity < targetReqQuantity;

  // Capacity slot checking
  const slot = earliestSlotFor(dataset, receiver.id, material.type, asOf);
  const availCapacity = slot ? availableT(slot, bookingsForSlot(dataset, slot.id)) : 0;
  out.availableT = availCapacity;
  
  if (availCapacity === 0) {
    out.isEligible = false;
    out.nonMatchReasons!.push(`Not eligible: receiving capacity is insufficient for this quantity.`);
  }

  // 3. Date constraints
  let dateConflict = false;
  const availableFrom = material.availableFrom || asOf;
  const neededBy = filters?.neededBy || demand?.period;

  if (availableFrom && neededBy) {
    if (availableFrom > neededBy) {
      dateConflict = true;
      out.isEligible = false;
      out.nonMatchReasons!.push(`Date conflict: material becomes available after the requested date.`);
    }
  } else if (!availableFrom || !neededBy) {
      out.missingDataNotes!.push('Availability or needed-by date is missing.');
  }

  // Calculate Base Factors (The original 4)
  const suitability = suitabilityFor(material);
  out.suitability = round2(suitability);
  if (out.factors) {
    out.factors.suitability = {
      value: suitability,
      score: suitability,
      impact: suitability >= 0.75 ? "positive" : "neutral",
      reason: `Based on material grade (${material.grade}) and condition (${material.condition}).`
    };
  }

  const demandScore = demand ? clamp01(targetReqQuantity / Math.max(availCapacity, targetReqQuantity, 1)) : demandFor(dataset, receiver.id, material.type);
  out.demand = round2(demandScore);
  if (out.factors) {
    out.factors.demand = {
      value: demandScore,
      score: demandScore,
      impact: demandScore >= 0.5 ? "positive" : "neutral",
      reason: `Reflects the receiver's demand signal and capacity for this material.`
    };
  }

  const availabilityRatio = clamp01(targetAvailQuantity === 0 ? 0 : availCapacity / targetAvailQuantity);
  if (out.factors) {
    out.factors.availability = {
      value: availCapacity,
      score: availabilityRatio,
      impact: availabilityRatio >= 1 ? "positive" : availabilityRatio > 0 ? "neutral" : "negative",
      reason: `Receiver slot has ${availCapacity.toFixed(1)}t available capacity.`
    };
  }

  const proximity = receiver.distanceKnown === false ? 0.5 : clamp01(1 - receiver.distanceKm / 80);
  if (out.factors) {
    out.factors.proximity = {
      value: receiver.distanceKnown === false ? 'Unknown' : `${receiver.distanceKm} km`,
      score: proximity,
      impact: receiver.distanceKnown === false ? "unknown" : proximity >= 0.5 ? "positive" : "negative",
      reason: receiver.distanceKnown === false ? `Location is unavailable, so distance could not be evaluated.` : `Distance relative to the 80km standard.`
    };
  }
  
  if (receiver.distanceKnown === false) {
    out.missingDataNotes!.push(`Location is unavailable, so distance could not be evaluated.`);
  }

  // Additional Contextual Factors
  
  // Price vs Budget
  let priceFitScore = 1;
  const price = offer?.pricePerT ?? material.pricePerT;
  const budget = filters?.maximumBudget ?? demand?.budgetPerT;
  
  if (price !== undefined && budget !== undefined) {
    if (price <= budget) {
      priceFitScore = 1.0;
      out.advantages?.push('Price is within budget.');
      if (out.factors) {
        out.factors.budget = {
          value: `₹${price}/t vs ₹${budget}/t`, score: priceFitScore, impact: 'positive', reason: 'Price is within budget limit.'
        };
      }
    } else {
      priceFitScore = clamp01(budget / price); // Soft penalty if over budget
      out.drawbacks?.push(`Offered price (₹${price}/t) exceeds the stated budget (₹${budget}/t).`);
      if (out.factors) {
        out.factors.budget = {
          value: `₹${price}/t vs ₹${budget}/t`, score: priceFitScore, impact: 'negative', reason: 'Price exceeds budget limit.'
        };
      }
    }
  } else {
    out.missingDataNotes!.push('Price or budget information is missing.');
    if (out.factors) {
      out.factors.budget = {
        value: 'Unknown', score: 0.5, impact: 'unknown', reason: 'Price or budget information is missing.'
      };
    }
  }

  // Project Compatibility
  out.missingDataNotes!.push('Project compatibility cannot be evaluated because project data is unavailable.');
  if (out.factors) {
    out.factors.project = {
      value: 'Unknown', score: 0.5, impact: 'unknown', reason: 'Project compatibility cannot be evaluated because project data is unavailable.'
    };
  }

  // Logistics Suitability
  out.missingDataNotes!.push('Logistics suitability cannot be fully evaluated because logistics data is unavailable.');
  if (out.factors) {
    out.factors.logistics = {
      value: 'Unknown', score: 0.5, impact: 'unknown', reason: 'Logistics suitability cannot be fully evaluated because logistics data is unavailable.'
    };
  }

  // Evidence
  const hasEvidence = material.evidence && material.evidence.length > 0;
  if (!hasEvidence) {
    out.missingDataNotes!.push('No evidence documents attached.');
  }

  // Calculate final score dynamically based on available data
  let totalWeight = 0;
  let accumulatedScore = 0;
  
  // Original 4 factors weights: 0.4, 0.25, 0.2, 0.15
  accumulatedScore += 0.4 * suitability; totalWeight += 0.4;
  accumulatedScore += 0.25 * demandScore; totalWeight += 0.25;
  accumulatedScore += 0.2 * availabilityRatio; totalWeight += 0.2;
  accumulatedScore += 0.15 * proximity; totalWeight += 0.15;
  
  // Apply additional factors if they exist in context (e.g., price vs budget)
  if (price !== undefined && budget !== undefined) {
      // Add price as a 20% factor, scaling other weights down proportionally
      accumulatedScore += 0.2 * priceFitScore; totalWeight += 0.2;
  }
  
  out.score = out.isEligible ? round3(accumulatedScore / totalWeight) : 0;
  out.recommended = Boolean(out.isEligible && availabilityRatio >= 1 && priceFitScore >= 0.8 && !dateConflict);

  // Build Summaries
  if (!out.isEligible) {
      out.summary = "Not eligible.";
  } else if (out.score >= 0.75) {
      out.summary = "Strong match based on current factors.";
  } else if (out.score >= 0.5) {
      out.summary = "Moderate match. Some constraints may require negotiation.";
  } else {
      out.summary = "Weak match.";
  }

  if (out.isFullMatch) {
      out.advantages?.push("Full quantity requested is available.");
  } else if (out.isPartialMatch) {
      out.drawbacks?.push(`Only ${out.coveragePercent}% of the requested quantity is available.`);
      out.nonMatchReasons?.push(`Weak match: provider can fulfil only ${out.coveragePercent}% of the requested quantity.`);
  }

  if (availCapacity < targetReqQuantity) {
      out.drawbacks?.push(`Insufficient receiving capacity for the full requested load (${availCapacity}t available).`);
  }

  return out;
}

export function contextualMatch(
  dataset: GreenLoopDataset,
  context: {
    materialId?: string;
    receiverId?: string;
    demandId?: string;
    offerId?: string;
  },
  filters?: MatchFilterState,
  asOf?: string
): AllocationCandidate[] {
  let candidates: AllocationCandidate[] = [];
  
  const targetMaterial = context.materialId ? dataset.materials.find(m => m.id === context.materialId) : undefined;
  const targetReceiver = context.receiverId ? dataset.receivers.find(r => r.id === context.receiverId) : undefined;
  const targetDemand = context.demandId ? dataset.demands.find(d => d.id === context.demandId) : undefined;
  const targetOffer = context.offerId ? dataset.offers?.find(o => o.id === context.offerId) : undefined;
  
  if (targetMaterial && !targetDemand && !targetReceiver) {
      // Provider Material -> All Receivers (and their Demands)
      candidates = dataset.receivers.map(rec => {
          // Find best open demand for this material type at this receiver
          const demand = dataset.demands.find(d => d.receiverId === rec.id && d.materialType === targetMaterial.type && ['OPEN', 'PARTIALLY_COVERED'].includes(d.status));
          return evaluateMatch(dataset, { material: targetMaterial, receiver: rec, demand, asOf, filters });
      });
  } else if (targetDemand && !targetMaterial && !targetOffer) {
      // Receiver Request -> All Provider Materials
      const receiver = dataset.receivers.find(r => r.id === targetDemand.receiverId);
      if (receiver) {
          candidates = dataset.materials.map(mat => {
              return evaluateMatch(dataset, { material: mat, receiver, demand: targetDemand, asOf, filters });
          });
      }
  } else if (targetOffer && targetDemand) {
      // Receiver Requirement -> Provider Offer
      const receiver = dataset.receivers.find(r => r.id === targetDemand.receiverId);
      const material = dataset.materials.find(m => m.id === targetOffer.passportId);
      if (receiver && material) {
          candidates = [evaluateMatch(dataset, { material, receiver, demand: targetDemand, offer: targetOffer, asOf, filters })];
      }
  } else if (targetMaterial && targetReceiver) {
      // Specific Material -> Specific Receiver (e.g. for booking creation checks)
      const demand = targetDemand || dataset.demands.find(d => d.receiverId === targetReceiver.id && d.materialType === targetMaterial.type && ['OPEN', 'PARTIALLY_COVERED'].includes(d.status));
      candidates = [evaluateMatch(dataset, { material: targetMaterial, receiver: targetReceiver, demand, asOf, filters })];
  } else {
      // Fallback
      if (targetMaterial) {
         candidates = dataset.receivers.map(rec => evaluateMatch(dataset, { material: targetMaterial, receiver: rec, asOf, filters }));
      }
  }

  // Tie-breaking order:
  // 1. isEligible (true first)
  // 2. score
  // 3. coveragePercent
  // 4. distanceKm
  // 5. stable ID (materialId or receiverId)
  
  return candidates.sort((a, b) => {
    if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
    const aCov = a.coveragePercent ?? 0;
    const bCov = b.coveragePercent ?? 0;
    if (Math.abs(bCov - aCov) > 0.1) return bCov - aCov;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    
    // Stable fallback
    return (a.receiverId || "").localeCompare(b.receiverId || "");
  });
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
  const candidates = contextualMatch(dataset, { materialId }, undefined, asOf);
  // Replicate previous `recommended` logic exactly for backward compatibility if needed:
  // The old logic found all fitting candidates (avail >= qty) and picked the best score.
  // Actually, evaluateMatch already calculates `recommended`, but to perfectly mirror:
  const material = dataset.materials.find(m => m.id === materialId);
  if (material) {
     const fitting = candidates.filter((c) => c.availableT >= material.quantityT);
     const best = (fitting.length > 0 ? fitting : candidates)[0];
     if (best) best.recommended = true;
  }
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
