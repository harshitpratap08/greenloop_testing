/**
 * GreenLoop domain types — shared by the operational platform and the
 * public site's capacity ledger. Pure data, no React imports.
 *
 * Core workflow: SURVEY → MATCH → RESERVE → DISPATCH → VERIFY
 */

export type ProjectStatus = "active" | "demolition" | "complete";
export type MaterialCondition = "good" | "fair" | "poor";
export type MaterialGrade = "A" | "B" | "C";
export type MaterialTypeKey =
  | "concrete"
  | "brick"
  | "steel"
  | "timber"
  | "plasterboard"
  | "glass";

export type MaterialStatus =
  | "surveyed"
  | "passport-ready"
  | "allocated"
  | "reserved"
  | "dispatched"
  | "verified"
  | "cancelled";

export type AllocationStatus = "confirmed" | "hold" | "pending" | "cancelled";
export type BookingStatus = "confirmed" | "hold" | "pending" | "cancelled";
export type VerificationStatus = "verified" | "rejected" | "pending";
export type DemandStatus = "OPEN" | "PARTIALLY_COVERED" | "COVERED" | "PAUSED";

export type ActorKind = "system" | "contractor" | "receiver";

export interface Actor {
  kind: ActorKind;
  name: string;
}

/** Every state transition is appended here; drives app timelines + site ledger. */
export interface DomainEvent {
  id: string;
  at: string; // ISO timestamp
  kind: string; // e.g. "allocation.confirmed", "capacity.released"
  actor: Actor;
  summary: string;
  detail?: string;
  /** Identifiers touched, so views can filter events per entity. */
  subjectIds: string[];
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  /** Earliest of any material's survey timestamp; demo seed only. */
  surveyedAt: string;
  lastActivityAt: string;
}

export interface MaterialPassport {
  id: string;
  projectId: string;
  type: MaterialTypeKey;
  /** Best-estimate recoverable quantity, tonnes. */
  quantityT: number;
  /** Survey uncertainty band in tonnes [min, max]. */
  quantityRangeT: [number, number];
  condition: MaterialCondition;
  grade: MaterialGrade;
  surveyedAt: string;
  status: MaterialStatus;
  /** Confidence in the estimate, 0–1. */
  confidence: number;
  evidence: Evidence[];
}

export interface Evidence {
  kind: "survey-sheet" | "site-photo" | "lab-report" | "weighbridge-ticket";
  label: string;
  /** Present when evidence is a document artifact; demo uses slugs. */
  ref?: string;
  recordedAt: string;
}

export interface ReceiverFacility {
  id: string;
  name: string;
  location: string;
  /** Tonnes of inbound material the yard can take per operating day. */
  dailyIntakeT: number;
  /** Tonnes of recovered material currently stockpiled. */
  currentStockT: number;
  acceptedTypes: MaterialTypeKey[];
  /** Distance in km from the demo project cluster. */
  distanceKm: number;
}

/** A one-day intake slot at a receiver, per material class. */
export interface ReceiverDaySlot {
  id: string;
  receiverId: string;
  /** ISO date for this slot. */
  date: string;
  materialType: MaterialTypeKey;
  /** Total tonnage the slot can accept. */
  capacityT: number;
}

export interface Allocation {
  id: string;
  materialId: string;
  receiverId: string;
  slotId: string;
  requestedT: number;
  status: AllocationStatus;
  /** For holds: why capacity could not be confirmed. */
  holdReason?: string;
  /** Point-in-time figures captured when the allocation was decided. */
  capacityBeforeT: number;
  capacityAfterT: number;
  decidedAt?: string;
  updatedAt: string;
  /** Ranked candidate receivers from matching, best first. */
  candidates: AllocationCandidate[];
}

export interface AllocationCandidate {
  receiverId: string;
  /** 0–1 suitability of the material for this receiver's process. */
  suitability: number;
  /** Receiver's current demand signal for this material, 0–1. */
  demand: number;
  distanceKm: number;
  /** Free tonnage in the candidate slot at scoring time. */
  availableT: number;
  /** Indicative transport cost, £/t. */
  transportCostPerT: number;
  /** Indicative handling cost, £/t. */
  handlingCostPerT: number;
  /** Deterministic composite score; higher is better. */
  score: number;
  recommended: boolean;
}

export interface Booking {
  id: string;
  allocationId: string;
  slotId: string;
  receiverId: string;
  materialId: string;
  tonnesT: number;
  status: BookingStatus;
  holdReason?: string;
  capacityBeforeT: number;
  capacityAfterT: number;
  createdAt: string;
  updatedAt: string;
  /** Demand fulfilled by an accepted provider offer, when applicable. */
  demandId?: string;
  receiverAcceptedAt?: string;
  /** Unique reference assigned when this booking is dispatched. */
  loadRef?: string;
  /** Populated when a confirmed booking is released. */
  cancelledAt?: string;
  cancelledReason?: string;
}

export interface MaterialOffer {
  id: string;
  demandId: string;
  providerId: string;
  passportId: string;
  offeredQuantityT: number;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface VerificationRecord {
  id: string;
  bookingId: string;
  loadRef: string;
  materialId: string;
  receiverId: string;
  /** Tonnes on the dispatch paperwork. */
  plannedT: number;
  /** Tonnes measured on the weighbridge. */
  actualT: number;
  acceptedT: number;
  rejectedT: number;
  rejectReason?: string;
  status: VerificationStatus;
  verifiedAt?: string;
  evidence: Evidence[];
}

export interface DemandRecord {
  id: string;
  receiverId: string;
  materialType: MaterialTypeKey;
  requiredT: number;
  period: string;
  location: string;
  status: DemandStatus;
  createdAt: string;
  notes?: string;
}

export interface SupportRequest {
  id: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

export interface GreenLoopDataset {
  supportRequests?: SupportRequest[];
  projects: Project[];
  materials: MaterialPassport[];
  receivers: ReceiverFacility[];
  slots: ReceiverDaySlot[];
  allocations: Allocation[];
  bookings: Booking[];
  verifications: VerificationRecord[];
  events: DomainEvent[];
  demands: DemandRecord[];
  offers?: MaterialOffer[];
}

export interface EngineResult<T> {
  data: T;
  events: DomainEvent[];
}

export type ConfirmOutcome = "confirmed" | "hold";
